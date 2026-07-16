# Media CDN for companions (public) + optional private path behaviors.
# ACM must live in us-east-1 (CloudFront). DNS records live in cairn-prod via aws.dns.

locals {
  name_prefix = "${var.project_name}-${var.environment}"
}

data "aws_route53_zone" "public" {
  provider = aws.dns
  name     = var.hosted_zone_name
}

data "aws_s3_bucket" "private_media" {
  bucket = var.private_media_bucket_name
}

data "aws_s3_bucket" "public_media" {
  bucket = var.public_media_bucket_name
}

# ─── ACM (us-east-1) ─────────────────────────────────────────────────────────

resource "aws_acm_certificate" "media" {
  provider          = aws.us_east_1
  domain_name       = var.media_domain
  validation_method = "DNS"

  lifecycle {
    create_before_destroy = true
  }

  tags = {
    Name = "${local.name_prefix}-media"
  }
}

resource "aws_route53_record" "acm_validation" {
  provider = aws.dns

  for_each = {
    for dvo in aws_acm_certificate.media.domain_validation_options : dvo.domain_name => {
      name  = dvo.resource_record_name
      type  = dvo.resource_record_type
      value = dvo.resource_record_value
    }
  }

  allow_overwrite = true
  zone_id         = data.aws_route53_zone.public.zone_id
  name            = each.value.name
  type            = each.value.type
  ttl             = 300
  records         = [each.value.value]
}

resource "aws_acm_certificate_validation" "media" {
  provider                = aws.us_east_1
  certificate_arn         = aws_acm_certificate.media.arn
  validation_record_fqdns = [for r in aws_route53_record.acm_validation : r.fqdn]
}

# ─── OAC + response headers ──────────────────────────────────────────────────

resource "aws_cloudfront_origin_access_control" "media" {
  name                              = "${local.name_prefix}-media"
  description                       = "OAC for ${local.name_prefix} media"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

resource "aws_cloudfront_response_headers_policy" "public_media" {
  name = "${local.name_prefix}-public-media-headers"

  cors_config {
    access_control_allow_credentials = false
    access_control_allow_headers { items = ["*"] }
    access_control_allow_methods { items = ["GET", "HEAD"] }
    access_control_allow_origins { items = ["*"] }
    origin_override = true
  }

  security_headers_config {
    content_type_options { override = true }
    frame_options {
      frame_option = "DENY"
      override     = true
    }
    strict_transport_security {
      access_control_max_age_sec = 31536000
      include_subdomains         = true
      override                   = true
    }
  }
}

# ─── CloudFront ──────────────────────────────────────────────────────────────

resource "aws_cloudfront_distribution" "media" {
  aliases         = [var.media_domain]
  comment         = "${local.name_prefix}-media"
  enabled         = true
  http_version    = "http2and3"
  is_ipv6_enabled = true
  price_class     = "PriceClass_100"

  origin {
    domain_name              = data.aws_s3_bucket.private_media.bucket_regional_domain_name
    origin_access_control_id = aws_cloudfront_origin_access_control.media.id
    origin_id                = "s3-${var.private_media_bucket_name}"
  }

  origin {
    domain_name              = data.aws_s3_bucket.public_media.bucket_regional_domain_name
    origin_access_control_id = aws_cloudfront_origin_access_control.media.id
    origin_id                = "s3-${var.public_media_bucket_name}"
  }

  # Default — private media (TTL 0; query string for future presigned CF reads).
  default_cache_behavior {
    allowed_methods        = ["GET", "HEAD"]
    cached_methods         = ["GET", "HEAD"]
    compress               = true
    default_ttl            = 0
    max_ttl                = 0
    min_ttl                = 0
    target_origin_id       = "s3-${var.private_media_bucket_name}"
    viewer_protocol_policy = "redirect-to-https"

    forwarded_values {
      query_string = true
      headers      = ["Origin", "Access-Control-Request-Headers", "Access-Control-Request-Method"]
      cookies {
        forward = "none"
      }
    }
  }

  ordered_cache_behavior {
    path_pattern               = "companions/*"
    allowed_methods            = ["GET", "HEAD"]
    cached_methods             = ["GET", "HEAD"]
    compress                   = true
    default_ttl                = 86400
    max_ttl                    = 31536000
    min_ttl                    = 0
    target_origin_id           = "s3-${var.public_media_bucket_name}"
    viewer_protocol_policy     = "redirect-to-https"
    response_headers_policy_id = aws_cloudfront_response_headers_policy.public_media.id

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }
  }

  ordered_cache_behavior {
    path_pattern               = "/public/*"
    allowed_methods            = ["GET", "HEAD"]
    cached_methods             = ["GET", "HEAD"]
    compress                   = true
    default_ttl                = 86400
    max_ttl                    = 31536000
    min_ttl                    = 0
    target_origin_id           = "s3-${var.public_media_bucket_name}"
    viewer_protocol_policy     = "redirect-to-https"
    response_headers_policy_id = aws_cloudfront_response_headers_policy.public_media.id

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }
  }

  ordered_cache_behavior {
    path_pattern           = "/private/*"
    allowed_methods        = ["GET", "HEAD"]
    cached_methods         = ["GET", "HEAD"]
    compress               = true
    default_ttl            = 0
    max_ttl                = 0
    min_ttl                = 0
    target_origin_id       = "s3-${var.private_media_bucket_name}"
    viewer_protocol_policy = "redirect-to-https"

    forwarded_values {
      query_string = true
      headers      = ["Origin", "Access-Control-Request-Headers", "Access-Control-Request-Method"]
      cookies {
        forward = "none"
      }
    }
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    acm_certificate_arn            = aws_acm_certificate_validation.media.certificate_arn
    cloudfront_default_certificate = false
    minimum_protocol_version       = "TLSv1.2_2021"
    ssl_support_method             = "sni-only"
  }

  tags = {
    Name = "${local.name_prefix}-media"
  }
}

# ─── Bucket policies (OAC GetObject) ─────────────────────────────────────────

resource "aws_s3_bucket_policy" "private_media" {
  bucket = var.private_media_bucket_name

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowCloudFrontOAC"
        Effect = "Allow"
        Principal = {
          Service = "cloudfront.amazonaws.com"
        }
        Action   = "s3:GetObject"
        Resource = "${var.private_media_bucket_arn}/*"
        Condition = {
          StringEquals = {
            "AWS:SourceArn" = aws_cloudfront_distribution.media.arn
          }
        }
      }
    ]
  })
}

resource "aws_s3_bucket_policy" "public_media" {
  bucket = var.public_media_bucket_name

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowCloudFrontOAC"
        Effect = "Allow"
        Principal = {
          Service = "cloudfront.amazonaws.com"
        }
        Action   = "s3:GetObject"
        Resource = "${var.public_media_bucket_arn}/*"
        Condition = {
          StringEquals = {
            "AWS:SourceArn" = aws_cloudfront_distribution.media.arn
          }
        }
      }
    ]
  })
}

# ─── DNS aliases ─────────────────────────────────────────────────────────────

resource "aws_route53_record" "media_a" {
  provider = aws.dns
  zone_id  = data.aws_route53_zone.public.zone_id
  name     = var.media_domain
  type     = "A"

  alias {
    name                   = aws_cloudfront_distribution.media.domain_name
    zone_id                = aws_cloudfront_distribution.media.hosted_zone_id
    evaluate_target_health = false
  }
}

resource "aws_route53_record" "media_aaaa" {
  provider = aws.dns
  zone_id  = data.aws_route53_zone.public.zone_id
  name     = var.media_domain
  type     = "AAAA"

  alias {
    name                   = aws_cloudfront_distribution.media.domain_name
    zone_id                = aws_cloudfront_distribution.media.hosted_zone_id
    evaluate_target_health = false
  }
}

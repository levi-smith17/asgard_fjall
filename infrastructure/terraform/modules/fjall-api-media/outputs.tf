output "media_domain" {
  value = var.media_domain
}

output "media_cdn_url" {
  value = "https://${var.media_domain}"
}

output "media_cloudfront_distribution_id" {
  value = aws_cloudfront_distribution.media.id
}

output "media_cloudfront_distribution_arn" {
  value = aws_cloudfront_distribution.media.arn
}

output "media_cloudfront_domain_name" {
  value = aws_cloudfront_distribution.media.domain_name
}

output "certificate_arn" {
  value = aws_acm_certificate_validation.media.certificate_arn
}

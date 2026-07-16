data "aws_route53_zone" "public" {
  provider = aws.dns
  name     = var.hosted_zone_name
}

resource "aws_route53_record" "web_a" {
  provider = aws.dns
  zone_id  = data.aws_route53_zone.public.zone_id
  name     = var.domain
  type     = "A"

  alias {
    name                   = module.cloudfront.cloudfront_domain_name
    zone_id                = "Z2FDTNDATAQYW2"
    evaluate_target_health = false
  }
}

resource "aws_route53_record" "web_aaaa" {
  provider = aws.dns
  zone_id  = data.aws_route53_zone.public.zone_id
  name     = var.domain
  type     = "AAAA"

  alias {
    name                   = module.cloudfront.cloudfront_domain_name
    zone_id                = "Z2FDTNDATAQYW2"
    evaluate_target_health = false
  }
}

# Intentionally no public A/AAAA for var.lan_domain (fjall.levismith.us).
# ACM validation CNAMEs above still publish for the SAN; LAN clients resolve
# via Pi-hole → CloudFront (see docs/asgard-fjall.md / pipeline-bootstrap).

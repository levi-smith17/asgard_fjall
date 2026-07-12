data "aws_route53_zone" "public" {
  name = var.hosted_zone_name
}

resource "aws_route53_record" "web_a" {
  zone_id = data.aws_route53_zone.public.zone_id
  name    = var.domain
  type    = "A"

  alias {
    name                   = module.cloudfront.cloudfront_domain_name
    zone_id                = "Z2FDTNDATAQYW2"
    evaluate_target_health = false
  }
}

resource "aws_route53_record" "web_aaaa" {
  zone_id = data.aws_route53_zone.public.zone_id
  name    = var.domain
  type    = "AAAA"

  alias {
    name                   = module.cloudfront.cloudfront_domain_name
    zone_id                = "Z2FDTNDATAQYW2"
    evaluate_target_health = false
  }
}

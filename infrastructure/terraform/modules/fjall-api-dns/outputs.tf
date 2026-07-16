output "api_domain" {
  value = var.api_domain
}

output "certificate_arn" {
  value = aws_acm_certificate_validation.api.certificate_arn
}

output "hosted_zone_id" {
  value = data.aws_route53_zone.public.zone_id
}

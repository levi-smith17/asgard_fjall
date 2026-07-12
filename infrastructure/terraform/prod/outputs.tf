output "web_bucket_name" {
  value = module.cloudfront.bucket_name
}

output "cloudfront_distribution_id" {
  value = module.cloudfront.cloudfront_distribution_id
}

output "cloudfront_domain_name" {
  value = module.cloudfront.cloudfront_domain_name
}

output "github_actions_role_arn" {
  value = module.github_oidc.role_arn
}

output "public_url" {
  value = "https://${var.domain}"
}

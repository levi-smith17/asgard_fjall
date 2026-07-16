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

output "lan_url" {
  description = "LAN/VPN Fjall URL (Pi-hole only — no public Route53 A/AAAA)."
  value       = var.lan_domain != "" ? "https://${var.lan_domain}" : null
}

output "cloudfront_aliases" {
  value = compact([var.domain, var.lan_domain])
}

output "github_actions_setup" {
  value = {
    secret_AWS_ROLE_ARN             = module.github_oidc.role_arn
    var_WEB_BUCKET                  = module.cloudfront.bucket_name
    var_CLOUDFRONT_DISTRIBUTION_ID  = module.cloudfront.cloudfront_distribution_id
  }
}

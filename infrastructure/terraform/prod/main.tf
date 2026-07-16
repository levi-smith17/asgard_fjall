locals {
  cloudfront_extra_domains = compact(concat([var.lan_domain], var.apex_domains))
}

module "auth" {
  source             = "../modules/auth"
  environment        = var.environment
  managed_by         = var.managed_by
  owner              = var.owner
  project_name       = var.project_name
  custom_domain      = var.domain
  additional_domains = compact([var.lan_domain])
  webauthn_rp_id     = var.webauthn_rp_id
  session_secret     = var.fjall_session_secret
  auth_email         = var.fjall_auth_email
}

module "cloudfront" {
  source             = "../modules/cloudfront"
  environment        = var.environment
  managed_by         = var.managed_by
  owner              = var.owner
  project_name       = var.project_name
  custom_domain      = var.domain
  additional_domains = local.cloudfront_extra_domains
  certificate_arn    = aws_acm_certificate_validation.cloudfront.certificate_arn
  auth_origin_domain = module.auth.function_url_domain
}

module "github_oidc" {
  source                      = "../modules/github_oidc"
  environment                 = var.environment
  github_repo                 = var.github_repo
  managed_by                  = var.managed_by
  owner                       = var.owner
  project_name                = var.project_name
  web_bucket_arn              = module.cloudfront.bucket_arn
  cloudfront_distribution_arn = "arn:aws:cloudfront::${data.aws_caller_identity.current.account_id}:distribution/${module.cloudfront.cloudfront_distribution_id}"
  terraform_state_bucket      = var.terraform_state_bucket
}

data "aws_caller_identity" "current" {}

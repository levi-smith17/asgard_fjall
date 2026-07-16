locals {
  account_id   = "910896517350"
  aws_region   = "us-east-2"
  environment  = "prod"
  project_name = "asgard-fjall"
  github_repo  = "levi-smith17/asgard_fjall"

  # API hostname + public zone (zone itself stays in cairn-prod).
  api_domain       = "api.asgard.levismith.us"
  hosted_zone_name = "levismith.us"
  dns_aws_profile  = "cairn-prod"

  common_tags = {
    project     = "asgard-fjall"
    environment = "prod"
    managed_by  = "terragrunt"
    owner       = "levi"
    phase       = "c-greenfield"
  }
}

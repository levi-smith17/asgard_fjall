locals {
  account_id   = "910896517350"
  aws_region   = "us-east-2"
  environment  = "prod"
  project_name = "asgard-fjall"
  github_repo  = "levi-smith17/asgard_fjall"

  # API hostname + public zone (zone itself stays in cairn-prod).
  api_domain       = "api.asgard.levismith.us"
  media_domain     = "media.asgard.levismith.us"
  hosted_zone_name = "levismith.us"
  dns_aws_profile  = "cairn-prod"

  api_allowed_origins = [
    "https://asgard.levismith.us",
    "https://fjall.levismith.us",
    "https://levismith.us",
    "https://www.levismith.us",
    "http://localhost:5180",
  ]

  common_tags = {
    project     = "asgard-fjall"
    environment = "prod"
    managed_by  = "terragrunt"
    owner       = "levi"
    phase       = "c-greenfield"
  }
}

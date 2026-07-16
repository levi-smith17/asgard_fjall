include "root" {
  path = find_in_parent_folders("root.hcl")
}

locals {
  env = read_terragrunt_config(find_in_parent_folders("env.hcl"))
}

dependency "api_dns" {
  config_path = "../api-dns"

  mock_outputs = {
    certificate_arn = "arn:aws:acm:us-east-2:000000000000:certificate/mock"
    hosted_zone_id  = "Z0000000000000"
    api_domain      = "api.asgard.levismith.us"
  }
  mock_outputs_allowed_terraform_commands = ["validate", "plan"]
}

generate "dns_provider" {
  path      = "dns_provider.tf"
  if_exists = "overwrite_terragrunt"
  contents  = <<EOF
provider "aws" {
  alias   = "dns"
  region  = "${local.env.locals.aws_region}"
  profile = "${local.env.locals.dns_aws_profile}"
}
EOF
}

terraform {
  source = "${get_repo_root()}/infrastructure/terraform/modules/fjall-api-http"
}

inputs = {
  project_name     = local.env.locals.project_name
  environment      = local.env.locals.environment
  api_domain       = local.env.locals.api_domain
  hosted_zone_name = local.env.locals.hosted_zone_name
  certificate_arn  = dependency.api_dns.outputs.certificate_arn
  allowed_origins  = local.env.locals.api_allowed_origins
  aws_region       = local.env.locals.aws_region
}

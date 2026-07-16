include "root" {
  path = find_in_parent_folders("root.hcl")
}

locals {
  env = read_terragrunt_config(find_in_parent_folders("env.hcl"))
}

# Public DNS for levismith.us lives in cairn-prod (same pattern as the web root).
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
  source = "${get_repo_root()}/infrastructure/terraform/modules/fjall-api-dns"
}

inputs = {
  project_name     = local.env.locals.project_name
  environment      = local.env.locals.environment
  api_domain       = local.env.locals.api_domain
  hosted_zone_name = local.env.locals.hosted_zone_name
  aws_region       = local.env.locals.aws_region
}

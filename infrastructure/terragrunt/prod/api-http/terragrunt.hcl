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

dependency "api_data" {
  config_path = "../api-data"

  mock_outputs = {
    table_name             = "asgard-fjall-prod"
    lambda_read_policy_arn = "arn:aws:iam::000000000000:policy/mock-read"
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
  project_name           = local.env.locals.project_name
  environment            = local.env.locals.environment
  api_domain             = local.env.locals.api_domain
  hosted_zone_name       = local.env.locals.hosted_zone_name
  certificate_arn        = dependency.api_dns.outputs.certificate_arn
  allowed_origins        = local.env.locals.api_allowed_origins
  cognito_user_pool_id   = local.env.locals.cognito_user_pool_id
  cognito_client_id      = local.env.locals.cognito_client_id
  dynamodb_table_name    = dependency.api_data.outputs.table_name
  lambda_read_policy_arn = dependency.api_data.outputs.lambda_read_policy_arn
  aws_region             = local.env.locals.aws_region
}

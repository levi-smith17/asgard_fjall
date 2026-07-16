include "root" {
  path = find_in_parent_folders("root.hcl")
}

locals {
  env = read_terragrunt_config(find_in_parent_folders("env.hcl"))
}

terraform {
  source = "${get_repo_root()}/infrastructure/terraform/modules/fjall-api-foundation"
}

inputs = {
  project_name = local.env.locals.project_name
  environment  = local.env.locals.environment
  github_repo  = local.env.locals.github_repo
  aws_region   = local.env.locals.aws_region
}

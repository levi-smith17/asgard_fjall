include "root" {
  path = find_in_parent_folders("root.hcl")
}

locals {
  env = read_terragrunt_config(find_in_parent_folders("env.hcl"))
}

terraform {
  source = "${get_repo_root()}/infrastructure/terraform/modules/fjall-api-data"
}

inputs = {
  project_name = local.env.locals.project_name
  environment  = local.env.locals.environment
  pitr_enabled = true
}

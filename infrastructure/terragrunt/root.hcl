locals {
  account_id = try(read_terragrunt_config(find_in_parent_folders("env.hcl")).locals.account_id, "")
  aws_region = try(read_terragrunt_config(find_in_parent_folders("env.hcl")).locals.aws_region, "us-east-2")
  environment = try(read_terragrunt_config(find_in_parent_folders("env.hcl")).locals.environment, "prod")
  project_name = try(read_terragrunt_config(find_in_parent_folders("env.hcl")).locals.project_name, "asgard-fjall")
  common_tags = try(read_terragrunt_config(find_in_parent_folders("env.hcl")).locals.common_tags, {})
}

remote_state {
  backend = "s3"
  generate = {
    path      = "backend.tf"
    if_exists = "overwrite_terragrunt"
  }
  config = {
    bucket  = "asgard-terraform-state-910896517350"
    key     = "asgard-fjall/terragrunt/${path_relative_to_include()}/terraform.tfstate"
    region  = "us-east-2"
    encrypt = true
  }
}

generate "provider" {
  path      = "provider.tf"
  if_exists = "overwrite_terragrunt"
  contents  = <<EOF
terraform {
  required_version = ">= 1.6.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 5.0"
    }
    archive = {
      source  = "hashicorp/archive"
      version = ">= 2.4"
    }
  }
}

provider "aws" {
  region = "${local.aws_region}"
  default_tags {
    tags = ${jsonencode(local.common_tags)}
  }
}
EOF
}

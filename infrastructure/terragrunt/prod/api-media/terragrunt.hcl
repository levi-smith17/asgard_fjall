include "root" {
  path = find_in_parent_folders("root.hcl")
}

locals {
  env = read_terragrunt_config(find_in_parent_folders("env.hcl"))
}

dependency "api_data" {
  config_path = "../api-data"

  mock_outputs = {
    private_media_bucket_name = "asgard-fjall-prod-private-media"
    private_media_bucket_arn  = "arn:aws:s3:::asgard-fjall-prod-private-media"
    public_media_bucket_name  = "asgard-fjall-prod-public-media"
    public_media_bucket_arn   = "arn:aws:s3:::asgard-fjall-prod-public-media"
  }
  mock_outputs_allowed_terraform_commands = ["validate", "plan"]
}

# CloudFront ACM must be in us-east-1; public DNS lives in cairn-prod.
generate "media_providers" {
  path      = "media_providers.tf"
  if_exists = "overwrite_terragrunt"
  contents  = <<EOF
provider "aws" {
  alias  = "us_east_1"
  region = "us-east-1"
  default_tags {
    tags = ${jsonencode(local.env.locals.common_tags)}
  }
}

provider "aws" {
  alias   = "dns"
  region  = "${local.env.locals.aws_region}"
  profile = "${local.env.locals.dns_aws_profile}"
}
EOF
}

terraform {
  source = "${get_repo_root()}/infrastructure/terraform/modules/fjall-api-media"
}

inputs = {
  project_name              = local.env.locals.project_name
  environment               = local.env.locals.environment
  media_domain              = local.env.locals.media_domain
  hosted_zone_name          = local.env.locals.hosted_zone_name
  private_media_bucket_name = dependency.api_data.outputs.private_media_bucket_name
  private_media_bucket_arn  = dependency.api_data.outputs.private_media_bucket_arn
  public_media_bucket_name  = dependency.api_data.outputs.public_media_bucket_name
  public_media_bucket_arn   = dependency.api_data.outputs.public_media_bucket_arn
}

terraform {
  required_version = ">= 1.6.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 5.0"
    }
  }

  # Reuse the existing Asgard account state bucket.
  backend "s3" {
    bucket  = "asgard-terraform-state-910896517350"
    key     = "asgard-fjall/prod/terraform.tfstate"
    region  = "us-east-2"
    profile = "asgard"
  }
}

# Compute / CloudFront / IAM live in the Asgard account.
provider "aws" {
  region  = var.aws_region
  profile = var.aws_profile
}

provider "aws" {
  alias   = "us_east_1"
  region  = "us-east-1"
  profile = var.aws_profile
}

# Public DNS for levismith.us lives in cairn-prod — ACM validation + alias only.
provider "aws" {
  alias   = "dns"
  region  = var.aws_region
  profile = var.dns_aws_profile
}

variable "aws_region" {
  type    = string
  default = "us-east-2"
}

variable "aws_profile" {
  description = "AWS CLI profile for Asgard account (CloudFront, S3, IAM)."
  type        = string
  default     = "asgard"
}

variable "dns_aws_profile" {
  description = "AWS CLI profile that owns the public levismith.us hosted zone."
  type        = string
  default     = "cairn-prod"
}

variable "project_name" {
  type    = string
  default = "asgard-fjall"
}

variable "environment" {
  type    = string
  default = "prod"
}

variable "owner" {
  type    = string
  default = "levi"
}

variable "managed_by" {
  type    = string
  default = "terraform"
}

variable "domain" {
  description = "Public Fjall hostname (Route53 alias target)."
  type        = string
  default     = "asgard.levismith.us"
}

variable "hosted_zone_name" {
  description = "Route53 public hosted zone that contains var.domain."
  type        = string
  default     = "levismith.us"
}

variable "github_repo" {
  type    = string
  default = "levi-smith17/asgard_fjall"
}

variable "terraform_state_bucket" {
  type    = string
  default = "asgard-terraform-state-910896517350"
}

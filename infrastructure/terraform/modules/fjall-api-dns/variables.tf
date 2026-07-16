variable "project_name" {
  type = string
}

variable "environment" {
  type = string
}

variable "api_domain" {
  description = "Public API hostname (e.g. api.asgard.levismith.us)."
  type        = string
}

variable "hosted_zone_name" {
  description = "Public hosted zone in cairn-prod that parents api_domain."
  type        = string
}

variable "aws_region" {
  type    = string
  default = "us-east-2"
}

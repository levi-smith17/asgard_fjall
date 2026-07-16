variable "project_name" {
  type = string
}

variable "environment" {
  type = string
}

variable "api_domain" {
  type = string
}

variable "hosted_zone_name" {
  type = string
}

variable "certificate_arn" {
  description = "Validated regional ACM certificate ARN for api_domain."
  type        = string
}

variable "allowed_origins" {
  description = "CORS allowlist for the HTTP API."
  type        = list(string)
}

variable "aws_region" {
  type    = string
  default = "us-east-2"
}

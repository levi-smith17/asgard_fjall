variable "project_name" {
  type = string
}

variable "environment" {
  type = string
}

variable "github_repo" {
  description = "GitHub org/repo allowed to assume the API deploy role via OIDC."
  type        = string
}

variable "aws_region" {
  type    = string
  default = "us-east-2"
}

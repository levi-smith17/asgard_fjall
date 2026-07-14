variable "environment" {
  type = string
}

variable "managed_by" {
  type = string
}

variable "owner" {
  type = string
}

variable "project_name" {
  type = string
}

variable "custom_domain" {
  type = string
}

variable "session_secret" {
  type      = string
  sensitive = true
}

variable "auth_email" {
  type    = string
  default = "admin@local"
}

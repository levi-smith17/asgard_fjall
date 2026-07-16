variable "certificate_arn" {
  type    = string
  default = null
}

variable "custom_domain" {
  type = string
}

variable "additional_domains" {
  description = "Extra CloudFront aliases (e.g. LAN-only fjall.levismith.us)."
  type        = list(string)
  default     = []
}

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

variable "auth_origin_domain" {
  type        = string
  default     = null
  description = "Lambda Function URL hostname for /api/auth* (no https://)."
}

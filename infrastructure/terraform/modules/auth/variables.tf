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

variable "additional_domains" {
  description = "Extra browser origins allowed for WebAuthn + Lambda Function URL CORS."
  type        = list(string)
  default     = []
}

variable "webauthn_rp_id" {
  description = "Shared WebAuthn RP ID (parent domain of all Fjall hostnames)."
  type        = string
}

variable "session_secret" {
  type      = string
  sensitive = true
}

variable "auth_email" {
  type    = string
  default = "admin@local"
}

variable "auth_sub" {
  description = "Stable user id for Dynamo USER# keys (migrated Cognito sub)."
  type        = string
  default     = "610b75f0-6031-703c-a794-0924826eaa3f"
}

locals {
  webauthn_hosts    = concat([var.custom_domain], var.additional_domains)
  webauthn_origins  = [for host in local.webauthn_hosts : "https://${host}"]
  webauthn_origins_csv = join(",", local.webauthn_origins)
}

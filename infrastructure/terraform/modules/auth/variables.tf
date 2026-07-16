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

locals {
  webauthn_hosts    = concat([var.custom_domain], var.additional_domains)
  webauthn_origins  = [for host in local.webauthn_hosts : "https://${host}"]
  webauthn_origins_csv = join(",", local.webauthn_origins)
}

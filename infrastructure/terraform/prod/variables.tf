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

variable "lan_domain" {
  description = "LAN/VPN-only Fjall hostname (CloudFront alias + ACM SAN; no public A/AAAA — Pi-hole only)."
  type        = string
  default     = "fjall.levismith.us"
}

variable "apex_domains" {
  description = "Public Ordstirr apex hostnames (ACM SAN + CloudFront alias + Route53 A/AAAA)."
  type        = list(string)
  default     = ["levismith.us", "www.levismith.us"]
}

variable "webauthn_rp_id" {
  description = "WebAuthn RP ID shared across Fjall hostnames (must be a parent of each origin host)."
  type        = string
  default     = "levismith.us"
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

variable "fjall_session_secret" {
  description = "HMAC secret for fjall_session cookies (passkey auth)."
  type        = string
  sensitive   = true
}

variable "fjall_auth_email" {
  description = "Single-user email embedded in passkey session payload."
  type        = string
  default     = "admin@local"
}

variable "project_name" {
  type = string
}

variable "environment" {
  type = string
}

variable "pitr_enabled" {
  type    = bool
  default = true
}

variable "private_media_allowed_origins" {
  description = "CORS allowlist for private and public media buckets (presigned PUT/GET from Asgard web origins)."
  type        = list(string)
}

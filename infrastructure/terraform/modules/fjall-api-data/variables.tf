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
  description = "CORS allowlist for the private media bucket (presigned PUT/GET from Asgard web origins)."
  type        = list(string)
}

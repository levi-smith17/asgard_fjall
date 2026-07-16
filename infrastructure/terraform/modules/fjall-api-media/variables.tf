variable "project_name" {
  type = string
}

variable "environment" {
  type = string
}

variable "media_domain" {
  description = "Public media hostname (e.g. media.asgard.levismith.us)."
  type        = string
}

variable "hosted_zone_name" {
  description = "Public Route53 zone name (lives in cairn-prod)."
  type        = string
}

variable "private_media_bucket_name" {
  type = string
}

variable "private_media_bucket_arn" {
  type = string
}

variable "public_media_bucket_name" {
  type = string
}

variable "public_media_bucket_arn" {
  type = string
}

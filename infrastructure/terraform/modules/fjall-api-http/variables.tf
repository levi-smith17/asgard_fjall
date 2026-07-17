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

variable "dynamodb_table_name" {
  type = string
}

variable "lambda_read_policy_arn" {
  description = "IAM policy ARN granting DynamoDB read (authorizer + read handlers)."
  type        = string
}

variable "lambda_write_policy_arn" {
  description = "IAM policy ARN granting DynamoDB read/write."
  type        = string
}

variable "aws_region" {
  type    = string
  default = "us-east-2"
}

variable "fjall_session_secret" {
  description = "Shared HMAC secret for Fjall passkey session Bearer tokens (authorizer)."
  type        = string
  sensitive   = true
  default     = ""
}

variable "s3_private_media_bucket_name" {
  description = "Private media S3 bucket name (Audr receipts). Wired into lambda_env when provided."
  type        = string
  default     = null
}

variable "s3_public_media_bucket_name" {
  description = "Public media S3 bucket name (Ordstirr companions). Wired into lambda_env when provided."
  type        = string
  default     = null
}

variable "media_cdn_url" {
  description = "Public media CloudFront base URL (e.g. https://media.asgard.levismith.us)."
  type        = string
  default     = null
}

variable "lambda_s3_policy_arn" {
  description = "IAM policy ARN granting S3 access to private + public media buckets, attached to routes with s3_access = true."
  type        = string
  default     = null
}

variable "lambda_ssm_read_policy_arn" {
  description = "IAM policy ARN granting SSM GetParameter access under /asgard-fjall/users/*, attached to routes with ssm_access = \"read\" or \"write\"."
  type        = string
  default     = null
}

variable "lambda_ssm_write_policy_arn" {
  description = "IAM policy ARN granting SSM Get/Put/DeleteParameter access under /asgard-fjall/users/*, attached to routes with ssm_access = \"write\"."
  type        = string
  default     = null
}

variable "web_url" {
  description = "Public web app base URL — used for thread links in Ordstirr/Sendibod contact emails."
  type        = string
  default     = "https://asgard.levismith.us"
}

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

variable "cognito_user_pool_id" {
  description = "Cognito user pool used for JWT validation (Cairn prod until cutover)."
  type        = string
}

variable "cognito_client_id" {
  description = "Cognito app client ID expected as JWT audience."
  type        = string
}

variable "dynamodb_table_name" {
  type = string
}

variable "lambda_read_policy_arn" {
  description = "IAM policy ARN granting DynamoDB read (authorizer + read handlers)."
  type        = string
}

variable "aws_region" {
  type    = string
  default = "us-east-2"
}

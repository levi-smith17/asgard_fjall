output "github_api_deploy_role_arn" {
  value = aws_iam_role.github_api_deploy.arn
}

output "account_id" {
  value = data.aws_caller_identity.current.account_id
}

output "lambda_name_prefix" {
  value = "${var.project_name}-${var.environment}"
}

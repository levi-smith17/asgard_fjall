output "ecr_repository_url" {
  value = aws_ecr_repository.api.repository_url
}

output "ecr_repository_arn" {
  value = aws_ecr_repository.api.arn
}

output "github_api_deploy_role_arn" {
  value = aws_iam_role.github_api_deploy.arn
}

output "account_id" {
  value = data.aws_caller_identity.current.account_id
}

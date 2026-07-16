output "table_name" {
  value = aws_dynamodb_table.main.name
}

output "table_arn" {
  value = aws_dynamodb_table.main.arn
}

output "table_stream_arn" {
  value = aws_dynamodb_table.main.stream_arn
}

output "lambda_read_policy_arn" {
  value = aws_iam_policy.lambda_read.arn
}

output "lambda_write_policy_arn" {
  value = aws_iam_policy.lambda_write.arn
}

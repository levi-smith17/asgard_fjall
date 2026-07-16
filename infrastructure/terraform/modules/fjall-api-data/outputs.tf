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

output "lambda_ssm_read_policy_arn" {
  value = aws_iam_policy.lambda_ssm_read.arn
}

output "lambda_ssm_write_policy_arn" {
  value = aws_iam_policy.lambda_ssm_write.arn
}

output "private_media_bucket_name" {
  value = aws_s3_bucket.private_media.bucket
}

output "private_media_bucket_arn" {
  value = aws_s3_bucket.private_media.arn
}

output "lambda_s3_policy_arn" {
  value = aws_iam_policy.lambda_s3_media.arn
}

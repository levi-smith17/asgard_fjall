output "function_url" {
  value = aws_lambda_function_url.auth.function_url
}

output "function_name" {
  value = aws_lambda_function.auth.function_name
}

output "table_name" {
  value = aws_dynamodb_table.auth.name
}

output "function_url_domain" {
  value = trimsuffix(trimprefix(aws_lambda_function_url.auth.function_url, "https://"), "/")
}

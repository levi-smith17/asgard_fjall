output "api_id" {
  value = aws_apigatewayv2_api.main.id
}

output "api_endpoint" {
  value = aws_apigatewayv2_api.main.api_endpoint
}

output "api_domain" {
  value = var.api_domain
}

output "function_names" {
  value = { for key, fn in aws_lambda_function.main : key => fn.function_name }
}

output "stage_name" {
  value = aws_apigatewayv2_stage.main.name
}

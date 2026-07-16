output "api_id" {
  value = aws_apigatewayv2_api.main.id
}

output "api_endpoint" {
  value = aws_apigatewayv2_api.main.api_endpoint
}

output "api_domain" {
  value = var.api_domain
}

output "health_function_name" {
  value = aws_lambda_function.main["health-get"].function_name
}

output "authorizer_function_name" {
  value = aws_lambda_function.main["auth-authorizer"].function_name
}

output "auth_context_function_name" {
  value = aws_lambda_function.main["auth-context"].function_name
}

output "stage_name" {
  value = aws_apigatewayv2_stage.main.name
}

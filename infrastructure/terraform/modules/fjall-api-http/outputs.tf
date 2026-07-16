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
  value = aws_lambda_function.health.function_name
}

output "stage_name" {
  value = aws_apigatewayv2_stage.main.name
}

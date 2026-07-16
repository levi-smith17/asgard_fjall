locals {
  name_prefix = "${var.project_name}-${var.environment}"
}

data "archive_file" "health_placeholder" {
  type        = "zip"
  output_path = "${path.module}/health-placeholder.zip"

  source {
    content  = <<-JS
      exports.handler = async () => ({
        statusCode: 200,
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status: "ok", service: "asgard-fjall-api", placeholder: true }),
      });
    JS
    filename = "health/get/handler.js"
  }
}

resource "aws_iam_role" "health" {
  name = "${local.name_prefix}-health-get"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = { Service = "lambda.amazonaws.com" }
        Action = "sts:AssumeRole"
      }
    ]
  })

  tags = {
    Name = "${local.name_prefix}-health-get"
  }
}

resource "aws_iam_role_policy_attachment" "health_basic" {
  role       = aws_iam_role.health.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

resource "aws_lambda_function" "health" {
  function_name    = "${local.name_prefix}-health-get"
  role             = aws_iam_role.health.arn
  handler          = "health/get/handler.handler"
  runtime          = "nodejs22.x"
  filename         = data.archive_file.health_placeholder.output_path
  source_code_hash = data.archive_file.health_placeholder.output_base64sha256
  timeout          = 10
  memory_size      = 128

  environment {
    variables = {
      ENVIRONMENT = var.environment
      SERVICE     = "asgard-fjall-api"
    }
  }

  tags = {
    Name = "${local.name_prefix}-health-get"
  }

  lifecycle {
    ignore_changes = [filename, source_code_hash]
  }
}

resource "aws_apigatewayv2_api" "main" {
  name          = "${local.name_prefix}-api"
  protocol_type = "HTTP"

  cors_configuration {
    allow_headers = ["authorization", "content-type"]
    allow_methods = ["DELETE", "GET", "OPTIONS", "PATCH", "POST", "PUT"]
    allow_origins = var.allowed_origins
    max_age       = 300
  }

  tags = {
    Name = "${local.name_prefix}-api"
  }
}

resource "aws_apigatewayv2_stage" "main" {
  api_id      = aws_apigatewayv2_api.main.id
  name        = var.environment
  auto_deploy = true

  tags = {
    Name = "${local.name_prefix}-api-${var.environment}"
  }
}

resource "aws_apigatewayv2_integration" "health" {
  api_id                 = aws_apigatewayv2_api.main.id
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_function.health.invoke_arn
  integration_method     = "POST"
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_route" "health" {
  api_id             = aws_apigatewayv2_api.main.id
  route_key          = "GET /health"
  target             = "integrations/${aws_apigatewayv2_integration.health.id}"
  authorization_type = "NONE"
}

resource "aws_lambda_permission" "health" {
  statement_id  = "AllowApiGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.health.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.main.execution_arn}/*/*/health"
}

resource "aws_apigatewayv2_domain_name" "main" {
  domain_name = var.api_domain

  domain_name_configuration {
    certificate_arn = var.certificate_arn
    endpoint_type   = "REGIONAL"
    security_policy = "TLS_1_2"
  }

  tags = {
    Name = var.api_domain
  }
}

resource "aws_apigatewayv2_api_mapping" "main" {
  api_id      = aws_apigatewayv2_api.main.id
  domain_name = aws_apigatewayv2_domain_name.main.id
  stage       = aws_apigatewayv2_stage.main.id
}

data "aws_route53_zone" "public" {
  provider = aws.dns
  name     = var.hosted_zone_name
}

resource "aws_route53_record" "api_a" {
  provider = aws.dns
  zone_id  = data.aws_route53_zone.public.zone_id
  name     = var.api_domain
  type     = "A"

  alias {
    name                   = aws_apigatewayv2_domain_name.main.domain_name_configuration[0].target_domain_name
    zone_id                = aws_apigatewayv2_domain_name.main.domain_name_configuration[0].hosted_zone_id
    evaluate_target_health = false
  }
}

resource "aws_route53_record" "api_aaaa" {
  provider = aws.dns
  zone_id  = data.aws_route53_zone.public.zone_id
  name     = var.api_domain
  type     = "AAAA"

  alias {
    name                   = aws_apigatewayv2_domain_name.main.domain_name_configuration[0].target_domain_name
    zone_id                = aws_apigatewayv2_domain_name.main.domain_name_configuration[0].hosted_zone_id
    evaluate_target_health = false
  }
}

locals {
  name_prefix = "${var.project_name}-${var.environment}"

  lambda_env = {
    ENVIRONMENT          = var.environment
    SERVICE              = "asgard-fjall-api"
    COGNITO_USER_POOL_ID = var.cognito_user_pool_id
    COGNITO_CLIENT_ID    = var.cognito_client_id
    DYNAMODB_TABLE       = var.dynamodb_table_name
  }
}

moved {
  from = aws_iam_role.health
  to   = aws_iam_role.lambda["health-get"]
}

moved {
  from = aws_iam_role_policy_attachment.health_basic
  to   = aws_iam_role_policy_attachment.lambda_basic["health-get"]
}

moved {
  from = aws_lambda_function.health
  to   = aws_lambda_function.main["health-get"]
}

moved {
  from = data.archive_file.health_placeholder
  to   = data.archive_file.placeholder["health-get"]
}

data "archive_file" "placeholder" {
  for_each = {
    health-get = {
      path    = "health/get/handler.js"
      body    = <<-JS
        exports.handler = async () => ({
          statusCode: 200,
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ status: "ok", service: "asgard-fjall-api", placeholder: true }),
        });
      JS
    }
    auth-authorizer = {
      path = "auth/authorizer/handler.js"
      body = <<-JS
        exports.handler = async () => ({ isAuthorized: false });
      JS
    }
    auth-context = {
      path = "auth/context/handler.js"
      body = <<-JS
        exports.handler = async () => ({
          statusCode: 503,
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ error: "Deploy apps/api auth/context" }),
        });
      JS
    }
  }

  type        = "zip"
  output_path = "${path.module}/placeholders/${each.key}.zip"

  source {
    content  = each.value.body
    filename = each.value.path
  }
}

resource "aws_iam_role" "lambda" {
  for_each = toset(["health-get", "auth-authorizer", "auth-context"])

  name = "${local.name_prefix}-${each.key}"

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
    Name = "${local.name_prefix}-${each.key}"
  }
}

resource "aws_iam_role_policy_attachment" "lambda_basic" {
  for_each = aws_iam_role.lambda

  role       = each.value.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

resource "aws_iam_role_policy_attachment" "authorizer_read" {
  role       = aws_iam_role.lambda["auth-authorizer"].name
  policy_arn = var.lambda_read_policy_arn
}

resource "aws_lambda_function" "main" {
  for_each = {
    health-get      = { handler = "health/get/handler.handler", timeout = 10, memory = 128 }
    auth-authorizer = { handler = "auth/authorizer/handler.handler", timeout = 10, memory = 256 }
    auth-context    = { handler = "auth/context/handler.handler", timeout = 10, memory = 128 }
  }

  function_name    = "${local.name_prefix}-${each.key}"
  role             = aws_iam_role.lambda[each.key].arn
  handler          = each.value.handler
  runtime          = "nodejs22.x"
  filename         = data.archive_file.placeholder[each.key].output_path
  source_code_hash = data.archive_file.placeholder[each.key].output_base64sha256
  timeout          = each.value.timeout
  memory_size      = each.value.memory

  environment {
    variables = local.lambda_env
  }

  tags = {
    Name = "${local.name_prefix}-${each.key}"
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

resource "aws_apigatewayv2_authorizer" "request" {
  api_id                            = aws_apigatewayv2_api.main.id
  authorizer_type                   = "REQUEST"
  authorizer_uri                    = aws_lambda_function.main["auth-authorizer"].invoke_arn
  identity_sources                  = ["$request.header.Authorization"]
  name                              = "${local.name_prefix}-request"
  authorizer_payload_format_version = "2.0"
  enable_simple_responses           = true
}

resource "aws_lambda_permission" "authorizer" {
  statement_id  = "AllowAPIGatewayAuthorizer"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.main["auth-authorizer"].function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.main.execution_arn}/authorizers/${aws_apigatewayv2_authorizer.request.id}"
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
  integration_uri        = aws_lambda_function.main["health-get"].invoke_arn
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
  statement_id  = "AllowApiGatewayInvokeHealth"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.main["health-get"].function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.main.execution_arn}/*/*/health"
}

resource "aws_apigatewayv2_integration" "auth_context" {
  api_id                 = aws_apigatewayv2_api.main.id
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_function.main["auth-context"].invoke_arn
  integration_method     = "POST"
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_route" "auth_context" {
  api_id             = aws_apigatewayv2_api.main.id
  route_key          = "GET /auth/context"
  target             = "integrations/${aws_apigatewayv2_integration.auth_context.id}"
  authorization_type = "CUSTOM"
  authorizer_id      = aws_apigatewayv2_authorizer.request.id
}

resource "aws_lambda_permission" "auth_context" {
  statement_id  = "AllowApiGatewayInvokeAuthContext"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.main["auth-context"].function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.main.execution_arn}/*/*/auth/context"
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

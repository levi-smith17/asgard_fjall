locals {
  name_prefix = "${var.project_name}-${var.environment}"

  lambda_env = merge(
    {
      ENVIRONMENT          = var.environment
      SERVICE              = "asgard-fjall-api"
      COGNITO_USER_POOL_ID = var.cognito_user_pool_id
      COGNITO_CLIENT_ID    = var.cognito_client_id
      DYNAMODB_TABLE       = var.dynamodb_table_name
    },
    var.s3_private_media_bucket_name != null ? {
      S3_PRIVATE_MEDIA_BUCKET = var.s3_private_media_bucket_name
    } : {},
  )

  # Public routes (no authorizer).
  public_routes = {
    health-get = {
      route_key = "GET /health"
      memory    = 128
      policy    = "none"
    }

    # Sendibod public thread endpoints (email-reply links — no JWT, gated by TOKEN pk).
    sendibod-public-thread-get = {
      route_key = "GET /public/thread/{token}"
      memory    = 128
      policy    = "read"
    }
    sendibod-public-thread-reply = {
      route_key = "POST /public/thread/{token}/reply"
      memory    = 128
      policy    = "write"
    }
  }

  # Protected routes (REQUEST authorizer). Asgard terms only.
  protected_routes = {
    auth-context = {
      route_key = "GET /auth/context"
      memory    = 128
      policy    = "none"
    }
    profile-get = {
      route_key = "GET /profile"
      memory    = 256
      policy    = "read"
    }
    thing-get = {
      route_key = "GET /thing"
      memory    = 256
      policy    = "read"
    }
    thing-update = {
      route_key = "PUT /thing/{section}"
      memory    = 256
      policy    = "write"
    }
    thing-api-token-get = {
      route_key = "GET /thing/api-token"
      memory    = 128
      policy    = "read"
    }
    thing-api-token-create = {
      route_key = "POST /thing/api-token"
      memory    = 128
      policy    = "write"
    }
    thing-api-token-revoke = {
      route_key = "DELETE /thing/api-token"
      memory    = 128
      policy    = "write"
    }
    laufar-get = {
      route_key = "GET /laufar"
      memory    = 256
      policy    = "read"
    }
    laufar-create = {
      route_key = "POST /laufar"
      memory    = 256
      policy    = "write"
    }
    laufar-update = {
      route_key = "PUT /laufar/{id}"
      memory    = 256
      policy    = "write"
    }
    laufar-delete = {
      route_key = "DELETE /laufar/{id}"
      memory    = 128
      policy    = "write"
    }
    laufar-fetch-meta = {
      route_key = "GET /laufar/fetch-meta"
      memory    = 256
      policy    = "write"
    }
    greinar-get = {
      route_key = "GET /greinar"
      memory    = 128
      policy    = "read"
    }
    greinar-create = {
      route_key = "POST /greinar"
      memory    = 128
      policy    = "write"
    }
    greinar-update = {
      route_key = "PUT /greinar/{id}"
      memory    = 128
      policy    = "write"
    }
    greinar-delete = {
      route_key = "DELETE /greinar/{id}"
      memory    = 256
      policy    = "write"
    }
    runir-get = {
      route_key = "GET /runir"
      memory    = 256
      policy    = "read"
    }
    runir-create = {
      route_key = "POST /runir"
      memory    = 128
      policy    = "write"
    }
    runir-update = {
      route_key = "PUT /runir/{id}"
      memory    = 128
      policy    = "write"
    }
    runir-delete = {
      route_key = "DELETE /runir/{id}"
      memory    = 128
      policy    = "write"
    }

    # Audr (Cairn's burn/supplylines/cache/sjodr) — Asgard naming.
    surtr-get = {
      route_key = "GET /surtr"
      memory    = 256
      policy    = "read"
    }
    surtr-create = {
      route_key = "POST /surtr"
      memory    = 128
      policy    = "write"
    }
    surtr-update = {
      route_key = "PUT /surtr/{id}"
      memory    = 128
      policy    = "write"
    }
    surtr-delete = {
      route_key = "DELETE /surtr/{id}"
      memory    = 128
      policy    = "write"
    }
    surtr-receipt-url = {
      route_key = "GET /surtr/receipt-url"
      memory    = 128
      policy    = "read"
      s3_access = true
    }
    surtr-receipt-upload-url = {
      route_key = "POST /surtr/receipt-upload-url"
      memory    = 128
      policy    = "none"
      s3_access = true
    }
    surtr-receipt-delete = {
      route_key = "DELETE /surtr/receipt-url"
      memory    = 128
      policy    = "write"
      s3_access = true
    }
    idunn-get = {
      route_key = "GET /idunn"
      memory    = 256
      policy    = "read"
    }
    idunn-create = {
      route_key = "POST /idunn"
      memory    = 128
      policy    = "write"
    }
    idunn-update = {
      route_key = "PUT /idunn/{id}"
      memory    = 128
      policy    = "write"
    }
    idunn-delete = {
      route_key = "DELETE /idunn/{id}"
      memory    = 128
      policy    = "write"
    }
    idunn-summary = {
      route_key = "GET /idunn/summary"
      memory    = 256
      policy    = "read"
    }
    skatt-get = {
      route_key = "GET /skatt"
      memory    = 128
      policy    = "read"
    }
    skatt-create = {
      route_key = "POST /skatt"
      memory    = 128
      policy    = "write"
    }
    skatt-update = {
      route_key = "PUT /skatt/{id}"
      memory    = 128
      policy    = "write"
    }
    skatt-delete = {
      route_key = "DELETE /skatt/{id}"
      memory    = 128
      policy    = "write"
    }
    skatt-carry-over = {
      route_key = "POST /skatt/carry-over"
      memory    = 128
      policy    = "write"
    }
    sjodr-get = {
      route_key = "GET /sjodr"
      memory    = 128
      policy    = "read"
    }
    sjodr-create = {
      route_key = "POST /sjodr"
      memory    = 128
      policy    = "write"
    }
    sjodr-update = {
      route_key = "PUT /sjodr/{id}"
      memory    = 128
      policy    = "write"
    }
    sjodr-delete = {
      route_key = "DELETE /sjodr/{id}"
      memory    = 256
      policy    = "write"
    }

    # Sendibod (Cairn's signals) — Asgard naming. Public thread routes live in public_routes.
    sendibod-get = {
      route_key = "GET /sendibod"
      memory    = 256
      policy    = "read"
    }
    sendibod-reply = {
      route_key = "POST /sendibod/{id}/reply"
      memory    = 128
      policy    = "write"
    }
    sendibod-mark-read = {
      route_key = "PUT /sendibod/{id}/read"
      memory    = 128
      policy    = "write"
    }
    sendibod-delete = {
      route_key = "DELETE /sendibod/{id}"
      memory    = 128
      policy    = "write"
    }

    # Sögur (Cairn's logs) — Asgard naming.
    sogur-get = {
      route_key = "GET /sogur"
      memory    = 256
      policy    = "read"
    }
    sogur-create = {
      route_key = "POST /sogur"
      memory    = 128
      policy    = "write"
    }
    sogur-update = {
      route_key = "PUT /sogur/{id}"
      memory    = 128
      policy    = "write"
    }
    sogur-delete = {
      route_key = "DELETE /sogur/{id}"
      memory    = 128
      policy    = "write"
    }
    sogur-upload-url = {
      route_key = "POST /sogur/upload-url"
      memory    = 128
      policy    = "write"
      s3_access = true
    }

    # Nidjatal (Cairn's headwaters) — Asgard naming.
    nidjatal-kin-get = {
      route_key = "GET /nidjatal/kin"
      memory    = 256
      policy    = "read"
    }
    nidjatal-kin-create = {
      route_key = "POST /nidjatal/kin"
      memory    = 128
      policy    = "write"
    }
    nidjatal-kin-update = {
      route_key = "PUT /nidjatal/kin/{id}"
      memory    = 128
      policy    = "write"
    }
    nidjatal-kin-delete = {
      route_key = "DELETE /nidjatal/kin/{id}"
      memory    = 128
      policy    = "write"
    }

    # Search — greenfield remapped Dynamo prefixes.
    search-get = {
      route_key = "GET /search"
      memory    = 256
      policy    = "read"
    }

    # Dagatal (Cairn's itinerary) — Asgard naming. CalDAV/ICS calendar sync.
    dagatal-events-get = {
      route_key  = "GET /dagatal/events"
      memory     = 512
      timeout    = 30
      policy     = "read"
      ssm_access = "read"
    }
    dagatal-calendars-create = {
      route_key  = "POST /dagatal"
      memory     = 128
      policy     = "write"
      ssm_access = "write"
    }
    dagatal-calendars-update = {
      route_key  = "PUT /dagatal/{id}"
      memory     = 128
      policy     = "write"
      ssm_access = "write"
    }
    dagatal-calendars-delete = {
      route_key  = "DELETE /dagatal/{id}"
      memory     = 128
      policy     = "write"
      ssm_access = "write"
    }
    dagatal-subscriptions-create = {
      route_key = "POST /dagatal-subscriptions"
      memory    = 128
      policy    = "write"
    }
    dagatal-subscriptions-update = {
      route_key = "PUT /dagatal-subscriptions/{id}"
      memory    = 128
      policy    = "write"
    }
    dagatal-subscriptions-delete = {
      route_key = "DELETE /dagatal-subscriptions/{id}"
      memory    = 128
      policy    = "write"
    }
  }

  authorizer = {
    auth-authorizer = {
      memory = 256
      policy = "read"
    }
  }

  all_functions = merge(local.public_routes, local.protected_routes, local.authorizer)
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

moved {
  from = aws_apigatewayv2_integration.health
  to   = aws_apigatewayv2_integration.public["health-get"]
}

moved {
  from = aws_apigatewayv2_route.health
  to   = aws_apigatewayv2_route.public["health-get"]
}

moved {
  from = aws_lambda_permission.health
  to   = aws_lambda_permission.public["health-get"]
}

moved {
  from = aws_apigatewayv2_integration.auth_context
  to   = aws_apigatewayv2_integration.protected["auth-context"]
}

moved {
  from = aws_apigatewayv2_route.auth_context
  to   = aws_apigatewayv2_route.protected["auth-context"]
}

moved {
  from = aws_lambda_permission.auth_context
  to   = aws_lambda_permission.protected["auth-context"]
}

moved {
  from = aws_iam_role_policy_attachment.authorizer_read
  to   = aws_iam_role_policy_attachment.lambda_data["auth-authorizer"]
}

data "archive_file" "placeholder" {
  for_each = local.all_functions

  type        = "zip"
  output_path = "${path.module}/placeholders/${each.key}.zip"

  source {
    content  = <<-JS
      exports.handler = async () => ({
        statusCode: 503,
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ error: "Deploy apps/api ${each.key}" }),
      });
    JS
    filename = "${split("-", each.key)[0]}/${join("-", slice(split("-", each.key), 1, length(split("-", each.key))))}/handler.js"
  }
}

resource "aws_iam_role" "lambda" {
  for_each = local.all_functions

  name = "${local.name_prefix}-${each.key}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect    = "Allow"
        Principal = { Service = "lambda.amazonaws.com" }
        Action    = "sts:AssumeRole"
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

resource "aws_iam_role_policy_attachment" "lambda_data" {
  for_each = {
    for key, cfg in local.all_functions : key => cfg.policy
    if cfg.policy == "read" || cfg.policy == "write"
  }

  role       = aws_iam_role.lambda[each.key].name
  policy_arn = each.value == "write" ? var.lambda_write_policy_arn : var.lambda_read_policy_arn
}

resource "aws_iam_role_policy_attachment" "lambda_s3_media" {
  for_each = var.lambda_s3_policy_arn == null ? {} : {
    for key, cfg in local.all_functions : key => cfg
    if try(cfg.s3_access, false)
  }

  role       = aws_iam_role.lambda[each.key].name
  policy_arn = var.lambda_s3_policy_arn
}

resource "aws_iam_role_policy_attachment" "lambda_ssm_read" {
  for_each = var.lambda_ssm_read_policy_arn == null ? {} : {
    for key, cfg in local.all_functions : key => cfg
    if try(cfg.ssm_access, null) == "read"
  }

  role       = aws_iam_role.lambda[each.key].name
  policy_arn = var.lambda_ssm_read_policy_arn
}

resource "aws_iam_role_policy_attachment" "lambda_ssm_write" {
  for_each = var.lambda_ssm_write_policy_arn == null ? {} : {
    for key, cfg in local.all_functions : key => cfg
    if try(cfg.ssm_access, null) == "write"
  }

  role       = aws_iam_role.lambda[each.key].name
  policy_arn = var.lambda_ssm_write_policy_arn
}

resource "aws_lambda_function" "main" {
  for_each = local.all_functions

  function_name = "${local.name_prefix}-${each.key}"
  role          = aws_iam_role.lambda[each.key].arn
  handler = format(
    "%s/%s/handler.handler",
    split("-", each.key)[0],
    join("-", slice(split("-", each.key), 1, length(split("-", each.key)))),
  )
  runtime          = "nodejs22.x"
  filename         = data.archive_file.placeholder[each.key].output_path
  source_code_hash = data.archive_file.placeholder[each.key].output_base64sha256
  timeout          = try(each.value.timeout, 10)
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

resource "aws_apigatewayv2_integration" "public" {
  for_each = local.public_routes

  api_id                 = aws_apigatewayv2_api.main.id
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_function.main[each.key].invoke_arn
  integration_method     = "POST"
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_route" "public" {
  for_each = local.public_routes

  api_id             = aws_apigatewayv2_api.main.id
  route_key          = each.value.route_key
  target             = "integrations/${aws_apigatewayv2_integration.public[each.key].id}"
  authorization_type = "NONE"
}

resource "aws_lambda_permission" "public" {
  for_each = local.public_routes

  statement_id  = "AllowApiGateway-${each.key}"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.main[each.key].function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.main.execution_arn}/*/*"
}

resource "aws_apigatewayv2_integration" "protected" {
  for_each = local.protected_routes

  api_id                 = aws_apigatewayv2_api.main.id
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_function.main[each.key].invoke_arn
  integration_method     = "POST"
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_route" "protected" {
  for_each = local.protected_routes

  api_id             = aws_apigatewayv2_api.main.id
  route_key          = each.value.route_key
  target             = "integrations/${aws_apigatewayv2_integration.protected[each.key].id}"
  authorization_type = "CUSTOM"
  authorizer_id      = aws_apigatewayv2_authorizer.request.id
}

resource "aws_lambda_permission" "protected" {
  for_each = local.protected_routes

  statement_id  = "AllowApiGateway-${each.key}"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.main[each.key].function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.main.execution_arn}/*/*"
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

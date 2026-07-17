resource "aws_dynamodb_table" "auth" {
  name         = "${var.project_name}-${var.environment}-auth"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "pk"
  range_key    = "sk"

  attribute {
    name = "pk"
    type = "S"
  }

  attribute {
    name = "sk"
    type = "S"
  }

  ttl {
    attribute_name = "ttl"
    enabled        = true
  }

  tags = {
    environment = var.environment
    managed_by  = var.managed_by
    owner       = var.owner
    project     = var.project_name
  }
}

data "archive_file" "auth_placeholder" {
  type        = "zip"
  output_path = "${path.module}/auth-placeholder.zip"

  source {
    content  = "exports.handler = async () => ({ statusCode: 503, body: 'Deploy apps/auth bundle' });"
    filename = "index.js"
  }
}

resource "aws_iam_role" "auth_lambda" {
  name = "${var.project_name}-${var.environment}-auth-lambda"

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
    environment = var.environment
    managed_by  = var.managed_by
    owner       = var.owner
    project     = var.project_name
  }
}

resource "aws_iam_role_policy_attachment" "auth_basic" {
  role       = aws_iam_role.auth_lambda.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

resource "aws_iam_role_policy" "auth_dynamo" {
  name = "${var.project_name}-${var.environment}-auth-dynamo"
  role = aws_iam_role.auth_lambda.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "dynamodb:GetItem",
          "dynamodb:PutItem",
          "dynamodb:UpdateItem",
          "dynamodb:DeleteItem",
          "dynamodb:Scan",
          "dynamodb:Query"
        ]
        Resource = aws_dynamodb_table.auth.arn
      }
    ]
  })
}

resource "aws_lambda_function" "auth" {
  function_name = "${var.project_name}-${var.environment}-auth"
  role          = aws_iam_role.auth_lambda.arn
  handler       = "handler.handler"
  runtime       = "nodejs22.x"
  filename      = data.archive_file.auth_placeholder.output_path
  source_code_hash = data.archive_file.auth_placeholder.output_base64sha256
  timeout       = 10
  memory_size   = 256

  environment {
    variables = {
      FJALL_AUTH_TABLE        = aws_dynamodb_table.auth.name
      FJALL_SESSION_SECRET    = var.session_secret
      FJALL_AUTH_SUB          = var.auth_sub
      FJALL_WEBAUTHN_ORIGIN   = local.webauthn_origins[0]
      FJALL_WEBAUTHN_ORIGINS  = local.webauthn_origins_csv
      FJALL_WEBAUTHN_RP_ID    = var.webauthn_rp_id
      FJALL_WEBAUTHN_RP_NAME  = "Asgard Fjall"
      FJALL_AUTH_EMAIL        = var.auth_email
    }
  }

  tags = {
    environment = var.environment
    managed_by  = var.managed_by
    owner       = var.owner
    project     = var.project_name
  }

  lifecycle {
    ignore_changes = [filename, source_code_hash]
  }
}

resource "aws_lambda_function_url" "auth" {
  function_name      = aws_lambda_function.auth.function_name
  authorization_type = "NONE"

  cors {
    allow_credentials = true
    allow_headers     = ["content-type"]
    allow_methods     = ["*"]
    allow_origins     = local.webauthn_origins
    max_age           = 86400
  }
}

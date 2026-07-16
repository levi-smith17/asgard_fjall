locals {
  name_prefix = "${var.project_name}-${var.environment}"
  table_name  = local.name_prefix
}

resource "aws_dynamodb_table" "main" {
  name             = local.table_name
  billing_mode     = "PAY_PER_REQUEST"
  hash_key         = "pk"
  range_key        = "sk"
  stream_enabled   = true
  stream_view_type = "NEW_AND_OLD_IMAGES"

  attribute {
    name = "pk"
    type = "S"
  }

  attribute {
    name = "sk"
    type = "S"
  }

  attribute {
    name = "gsi1pk"
    type = "S"
  }

  attribute {
    name = "gsi1sk"
    type = "S"
  }

  global_secondary_index {
    name            = "gsi1"
    hash_key        = "gsi1pk"
    range_key       = "gsi1sk"
    projection_type = "ALL"
  }

  ttl {
    attribute_name = "ttl"
    enabled        = true
  }

  point_in_time_recovery {
    enabled = var.pitr_enabled
  }

  tags = {
    Name = local.table_name
  }
}

data "aws_iam_policy_document" "lambda_read" {
  statement {
    sid    = "DynamoRead"
    effect = "Allow"
    actions = [
      "dynamodb:BatchGetItem",
      "dynamodb:GetItem",
      "dynamodb:Query",
      "dynamodb:Scan",
      "dynamodb:ConditionCheckItem",
      "dynamodb:DescribeTable",
    ]
    resources = [
      aws_dynamodb_table.main.arn,
      "${aws_dynamodb_table.main.arn}/index/*",
    ]
  }
}

data "aws_iam_policy_document" "lambda_write" {
  statement {
    sid    = "DynamoWrite"
    effect = "Allow"
    actions = [
      "dynamodb:BatchGetItem",
      "dynamodb:BatchWriteItem",
      "dynamodb:ConditionCheckItem",
      "dynamodb:DeleteItem",
      "dynamodb:DescribeTable",
      "dynamodb:GetItem",
      "dynamodb:PutItem",
      "dynamodb:Query",
      "dynamodb:Scan",
      "dynamodb:UpdateItem",
    ]
    resources = [
      aws_dynamodb_table.main.arn,
      "${aws_dynamodb_table.main.arn}/index/*",
    ]
  }
}

resource "aws_iam_policy" "lambda_read" {
  name   = "${local.name_prefix}-lambda-read"
  policy = data.aws_iam_policy_document.lambda_read.json
}

resource "aws_iam_policy" "lambda_write" {
  name   = "${local.name_prefix}-lambda-write"
  policy = data.aws_iam_policy_document.lambda_write.json
}

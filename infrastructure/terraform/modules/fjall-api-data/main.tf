locals {
  name_prefix = "${var.project_name}-${var.environment}"
  table_name  = local.name_prefix
}

data "aws_caller_identity" "current" {}
data "aws_region" "current" {}

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

# ─── SSM Parameter Store (Dagatal — per-user CalDAV app-password secrets) ─────

locals {
  ssm_dagatal_resource = "arn:aws:ssm:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:parameter/asgard-fjall/users/*"
}

data "aws_iam_policy_document" "lambda_ssm_read" {
  statement {
    sid       = "SsmDagatalRead"
    effect    = "Allow"
    actions   = ["ssm:GetParameter"]
    resources = [local.ssm_dagatal_resource]
  }
}

data "aws_iam_policy_document" "lambda_ssm_write" {
  statement {
    sid    = "SsmDagatalWrite"
    effect = "Allow"
    actions = [
      "ssm:GetParameter",
      "ssm:PutParameter",
      "ssm:DeleteParameter",
    ]
    resources = [local.ssm_dagatal_resource]
  }
}

resource "aws_iam_policy" "lambda_ssm_read" {
  name   = "${local.name_prefix}-lambda-ssm-read"
  policy = data.aws_iam_policy_document.lambda_ssm_read.json
}

resource "aws_iam_policy" "lambda_ssm_write" {
  name   = "${local.name_prefix}-lambda-ssm-write"
  policy = data.aws_iam_policy_document.lambda_ssm_write.json
}

# ─── Private media bucket (Audr receipts — presigned reads/writes) ────────────

resource "aws_s3_bucket" "private_media" {
  bucket = "${local.name_prefix}-private-media"

  tags = {
    Name = "${local.name_prefix}-private-media"
  }
}

resource "aws_s3_bucket_public_access_block" "private_media" {
  bucket                  = aws_s3_bucket.private_media.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_server_side_encryption_configuration" "private_media" {
  bucket = aws_s3_bucket.private_media.id
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_cors_configuration" "private_media" {
  bucket = aws_s3_bucket.private_media.id

  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["GET", "PUT"]
    allowed_origins = var.private_media_allowed_origins
    expose_headers  = ["ETag"]
    max_age_seconds = 3000
  }
}

resource "aws_s3_bucket_lifecycle_configuration" "private_media" {
  bucket = aws_s3_bucket.private_media.id

  rule {
    id     = "abort-incomplete-multipart"
    status = "Enabled"
    filter {}
    abort_incomplete_multipart_upload {
      days_after_initiation = 1
    }
  }
}

# ─── Public media bucket (Ordstirr companions — CloudFront reads) ─────────────

resource "aws_s3_bucket" "public_media" {
  bucket = "${local.name_prefix}-public-media"

  tags = {
    Name = "${local.name_prefix}-public-media"
  }
}

resource "aws_s3_bucket_public_access_block" "public_media" {
  bucket                  = aws_s3_bucket.public_media.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_server_side_encryption_configuration" "public_media" {
  bucket = aws_s3_bucket.public_media.id
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_cors_configuration" "public_media" {
  bucket = aws_s3_bucket.public_media.id

  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["PUT"]
    allowed_origins = var.private_media_allowed_origins
    expose_headers  = ["ETag"]
    max_age_seconds = 3000
  }
}

resource "aws_s3_bucket_lifecycle_configuration" "public_media" {
  bucket = aws_s3_bucket.public_media.id

  rule {
    id     = "abort-incomplete-multipart"
    status = "Enabled"
    filter {}
    abort_incomplete_multipart_upload {
      days_after_initiation = 1
    }
  }
}

data "aws_iam_policy_document" "lambda_s3_media" {
  statement {
    sid    = "S3PrivateMedia"
    effect = "Allow"
    actions = [
      "s3:GetObject",
      "s3:PutObject",
      "s3:DeleteObject",
      "s3:ListBucket",
    ]
    resources = [
      aws_s3_bucket.private_media.arn,
      "${aws_s3_bucket.private_media.arn}/*",
    ]
  }

  statement {
    sid    = "S3PublicMedia"
    effect = "Allow"
    actions = [
      "s3:GetObject",
      "s3:PutObject",
      "s3:DeleteObject",
      "s3:ListBucket",
    ]
    resources = [
      aws_s3_bucket.public_media.arn,
      "${aws_s3_bucket.public_media.arn}/*",
    ]
  }
}

resource "aws_iam_policy" "lambda_s3_media" {
  name   = "${local.name_prefix}-lambda-s3-media"
  policy = data.aws_iam_policy_document.lambda_s3_media.json
}

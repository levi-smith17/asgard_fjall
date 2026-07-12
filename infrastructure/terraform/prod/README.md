# Asgard Fjall prod Terraform

Creates:

- ACM cert (us-east-1) for `asgard.levismith.us`
- Private S3 + CloudFront SPA
- Route53 A/AAAA alias → CloudFront
- GitHub Actions OIDC deploy role

## Prerequisites

1. AWS account that owns public hosted zone `levismith.us`
2. Existing GitHub OIDC provider in that account (`token.actions.githubusercontent.com`) — Cairn prod already has this
3. S3 state bucket `asgard-fjall-terraform-state` (create once), or edit `providers.tf` backend

## Apply

```bash
cd infrastructure/terraform/prod
terraform init
terraform plan -var-file=prod.tfvars
terraform apply -var-file=prod.tfvars
```

Copy outputs into GitHub Actions secrets/vars:

- `AWS_ROLE_ARN` ← `github_actions_role_arn`
- `WEB_BUCKET` ← `web_bucket_name`
- `CLOUDFRONT_DISTRIBUTION_ID` ← `cloudfront_distribution_id`

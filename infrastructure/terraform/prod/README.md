# Asgard Fjall prod Terraform

## Accounts

| Resource | AWS account / profile |
|----------|------------------------|
| S3, CloudFront, ACM, GitHub OIDC role | **asgard** (`910896517350`) |
| Route53 `levismith.us` (ACM DNS + A/AAAA) | **cairn-prod** (zone owner) |
| State | `s3://asgard-terraform-state-910896517350/asgard-fjall/prod/terraform.tfstate` |

## Bootstrap (once, local)

```bash
cd infrastructure/terraform/prod
AWS_PROFILE=asgard terraform init
AWS_PROFILE=asgard terraform apply -var-file=prod.tfvars
```

Profiles in `prod.tfvars` must resolve (`asgard` + `cairn-prod`).

## CI

- **Web deploy** on every `main` push (OIDC → Asgard role → S3 sync + CF invalidate).
- **Terraform** is optional in CI for Asgard-account resources; DNS still needs `cairn-prod` credentials (or a cross-account assume role). Prefer applying DNS/infra locally until that role exists.

After apply, set GitHub Environment `prod`:

| Kind | Name | Value |
|------|------|--------|
| Secret | `AWS_ROLE_ARN` | `github_actions_role_arn` output |
| Variable | `WEB_BUCKET` | `web_bucket_name` |
| Variable | `CLOUDFRONT_DISTRIBUTION_ID` | `cloudfront_distribution_id` |

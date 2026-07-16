# Terragrunt (Phase C)

Greenfield Asgard-account stacks for Fjall cloud API / media. The existing
`infrastructure/terraform/prod` root (static web + passkey auth + CloudFront)
stays as-is until a deliberate state migration.

## Layout

```text
infrastructure/
  terragrunt/
    root.hcl                 # remote state + provider generation
    prod/
      env.hcl                # account / region / tags
      api/terragrunt.hcl     # API foundation stack
  terraform/
    modules/
      fjall-api-foundation/  # ECR + deploy role (first slice)
    prod/                    # live web root (unchanged)
```

## First slice (this)

`prod/api` creates:

- ECR repository `asgard-fjall-prod-api`
- IAM role for future GitHub Actions **Fjall API** deploys (OIDC, scoped to that ECR)

No Lambda/API Gateway/DNS yet — pick the API runtime next, then add
`api.asgard.levismith.us` (+ optional `media.asgard.levismith.us`) via
cairn-prod Route53 AssumeRole.

## Usage

```bash
cd infrastructure/terragrunt/prod/api
terragrunt init
terragrunt plan
terragrunt apply
```

Requires AWS credentials for the **asgard** account (same as the web Terraform
root). Prefer env vars / SSO over hard-coded profiles when running in CI.

## State

| Stack | Bucket | Key prefix |
|-------|--------|------------|
| Legacy web | `asgard-terraform-state-910896517350` | `asgard-fjall/prod/terraform.tfstate` |
| Terragrunt API | same bucket | `asgard-fjall/terragrunt/prod/api/terraform.tfstate` |

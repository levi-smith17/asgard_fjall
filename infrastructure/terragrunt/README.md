# Terragrunt (Phase C)

Greenfield Asgard-account stacks for the Fjall cloud API. Runtime is **Lambda +
HTTP API Gateway** (no containers / ECR). The existing
`infrastructure/terraform/prod` root (static web + passkey auth + CloudFront)
stays as-is until a deliberate state migration.

## Layout

```text
infrastructure/
  terragrunt/
    root.hcl
    prod/
      env.hcl
      api/terragrunt.hcl       # GitHub OIDC role for Lambda code deploys
      api-dns/terragrunt.hcl   # regional ACM for api.asgard.levismith.us
      api-data/terragrunt.hcl  # DynamoDB + media buckets + lambda IAM
      api-media/terragrunt.hcl # media.asgard.levismith.us CloudFront + ACM
      api-http/terragrunt.hcl  # HTTP API + Lambdas + custom domain
  terraform/
    modules/
      fjall-api-foundation/
      fjall-api-dns/
      fjall-api-data/
      fjall-api-media/
      fjall-api-http/
apps/api/                      # Lambda handlers (tsc → zip deploy)
```

## Slices

| Stack | What it owns |
|-------|----------------|
| `prod/api` | GitHub OIDC deploy role (`lambda:UpdateFunctionCode` on `asgard-fjall-prod-*`) |
| `prod/api-dns` | Regional ACM + DNS validation |
| `prod/api-data` | DynamoDB `asgard-fjall-prod`, private + public media buckets, IAM |
| `prod/api-media` | CloudFront + us-east-1 ACM + R53 for `media.asgard.levismith.us` |
| `prod/api-http` | HTTP API + Lambdas + custom domain |

Auth today validates **passkey session Bearer** (`v1.*`) and **API tokens** (`csk_*`) via the request authorizer. `FJALL_SESSION_SECRET` lives in SSM `/asgard-fjall/<env>/FJALL_SESSION_SECRET`.

## Usage

```bash
cd infrastructure/terragrunt/prod/api-data && terragrunt apply
cd ../api-media && terragrunt apply
cd ../api-http && terragrunt apply

pnpm --filter @asgard-fjall/api build
AWS_PROFILE=asgard pnpm --filter @asgard-fjall/api deploy:core
```

## State

| Stack | Key prefix |
|-------|------------|
| Legacy web | `asgard-fjall/prod/terraform.tfstate` |
| Terragrunt API foundation | `asgard-fjall/terragrunt/prod/api/terraform.tfstate` |
| Terragrunt API DNS | `asgard-fjall/terragrunt/prod/api-dns/terraform.tfstate` |
| Terragrunt API data | `asgard-fjall/terragrunt/prod/api-data/terraform.tfstate` |
| Terragrunt API media | `asgard-fjall/terragrunt/prod/api-media/terraform.tfstate` |
| Terragrunt API HTTP | `asgard-fjall/terragrunt/prod/api-http/terraform.tfstate` |

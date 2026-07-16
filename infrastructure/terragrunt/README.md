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
      api-data/terragrunt.hcl  # DynamoDB + lambda read/write IAM
      api-http/terragrunt.hcl  # HTTP API + Lambdas + custom domain
  terraform/
    modules/
      fjall-api-foundation/
      fjall-api-dns/
      fjall-api-data/
      fjall-api-http/
apps/api/                      # Lambda handlers (tsc → zip deploy)
```

## Slices

| Stack | What it owns |
|-------|----------------|
| `prod/api` | GitHub OIDC deploy role (`lambda:UpdateFunctionCode` on `asgard-fjall-prod-*`) |
| `prod/api-dns` | Regional ACM + DNS validation |
| `prod/api-data` | DynamoDB table `asgard-fjall-prod` + read/write IAM policies |
| `prod/api-http` | HTTP API + Lambdas (`/health`, auth, profile, thing, laufar, greinar, runir) |

Auth today validates JWTs against **Cairn prod Cognito** (IDs in `env.hcl`). New Cognito
in the asgard account lands at data cutover (passkey re-enroll).

## Usage

```bash
cd infrastructure/terragrunt/prod/api-data && terragrunt apply
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
| Terragrunt API HTTP | `asgard-fjall/terragrunt/prod/api-http/terraform.tfstate` |

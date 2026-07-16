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
      api-http/terragrunt.hcl  # health Lambda + HTTP API + custom domain
  terraform/
    modules/
      fjall-api-foundation/
      fjall-api-dns/
      fjall-api-http/
apps/api/                      # Lambda handlers (tsc → zip deploy)
```

## Slices

| Stack | What it owns |
|-------|----------------|
| `prod/api` | GitHub OIDC deploy role (`lambda:UpdateFunctionCode` on `asgard-fjall-prod-*`) |
| `prod/api-dns` | Regional ACM + DNS validation |
| `prod/api-http` | Health Lambda, HTTP API, `GET /health`, custom domain + Route53 alias |

Next: Cognito/authorizer, DynamoDB, port Cairn handlers, then cutover clients to
`https://api.asgard.levismith.us`.

## Usage

```bash
# Infra (asgard + cairn-prod profiles)
cd infrastructure/terragrunt/prod/api && terragrunt apply
cd ../api-dns && terragrunt apply
cd ../api-http && terragrunt apply

# App code
pnpm --filter @asgard-fjall/api build
AWS_PROFILE=asgard pnpm --filter @asgard-fjall/api deploy:health
```

## State

| Stack | Key prefix |
|-------|------------|
| Legacy web | `asgard-fjall/prod/terraform.tfstate` |
| Terragrunt API foundation | `asgard-fjall/terragrunt/prod/api/terraform.tfstate` |
| Terragrunt API DNS | `asgard-fjall/terragrunt/prod/api-dns/terraform.tfstate` |
| Terragrunt API HTTP | `asgard-fjall/terragrunt/prod/api-http/terraform.tfstate` |

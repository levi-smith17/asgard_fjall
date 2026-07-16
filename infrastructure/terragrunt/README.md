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
      env.hcl                # account / region / tags / api hostname
      api/terragrunt.hcl     # ECR + GitHub OIDC deploy role
      api-dns/terragrunt.hcl # regional ACM + DNS validation
  terraform/
    modules/
      fjall-api-foundation/  # ECR + deploy role
      fjall-api-dns/         # api.asgard.levismith.us cert
    prod/                    # live web root (unchanged)
```

## Slices

### `prod/api` (done)

- ECR repository `asgard-fjall-prod-api`
- IAM role for future GitHub Actions **Fjall API** deploys (OIDC, scoped to that ECR)

### `prod/api-dns` (this)

- Regional ACM certificate for `api.asgard.levismith.us` (us-east-2)
- DNS validation CNAMEs in the cairn-prod `levismith.us` zone (profile `cairn-prod`)
- No public A/AAAA yet — alias lands with the API Gateway / load balancer slice

Next: pick API runtime (container vs Lambda), then wire custom domain + alias.

## Usage

```bash
cd infrastructure/terragrunt/prod/api
terragrunt init && terragrunt apply

cd ../api-dns
terragrunt init && terragrunt apply
```

Requires AWS profiles:

- `asgard` — compute / ACM in the asgard account
- `cairn-prod` — Route53 for `levismith.us` (same as the web Terraform root)

## State

| Stack | Bucket | Key prefix |
|-------|--------|------------|
| Legacy web | `asgard-terraform-state-910896517350` | `asgard-fjall/prod/terraform.tfstate` |
| Terragrunt API foundation | same bucket | `asgard-fjall/terragrunt/prod/api/terraform.tfstate` |
| Terragrunt API DNS | same bucket | `asgard-fjall/terragrunt/prod/api-dns/terraform.tfstate` |

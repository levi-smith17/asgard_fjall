# Cairn integration checklist

## CORS (cairn-summit prod)

In `infrastructure/terraform/environments/prod/api_gateway.tf`, extend `allowed_origins`:

```hcl
allowed_origins = concat(
  [
    "https://${var.domain}",
    module.cloudfront.cloudfront_url,
    "https://asgard.levismith.us",
    "https://fjall.levismith.us",
  ],
  [for domain in var.manifest_web_domains : "https://${domain}"]
)
```

Mirror in `s3.tf` media `allowed_origins`.

Apply with Cairn prod Terraform.

## Auth

**Option A — Cognito (no Fjall backend)**  
- App client allowed callback / logout: `https://asgard.levismith.us`, `https://fjall.levismith.us` (+ trailing-slash / localhost variants)  
- Fjall stores tokens (memory / host-only cookie, not shared with `asgard_session`)  
- `Authorization: Bearer <id_token>` on `api.cairn.ing`

**Option B — Thin BFF**  
- Lambda holds existing Cairn API token (like private Asgard `/api/cairn`)  
- Fjall passkey session gates the BFF only  

Do not embed the SSM API token in the static bundle.

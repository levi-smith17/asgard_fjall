# Bootstrap checklist — Asgard Fjall pipeline

## Done automatically (this session)

- [x] Skidbladnir Fjall tab: sections rail removed (Asgard `main`)
- [x] Terraform applied in **asgard** account (S3, CloudFront, ACM, GitHub OIDC)
- [x] Route53 `asgard.levismith.us` A/AAAA → CloudFront (zone in **cairn-prod**)
- [x] State: `s3://asgard-terraform-state-910896517350/asgard-fjall/prod/terraform.tfstate`

## You must do (GitHub — `gh` is not logged in on this machine)

Create Environment **`prod`** on https://github.com/levi-smith17/asgard_fjall/settings/environments

| Type | Name | Value |
|------|------|--------|
| **Secret** | `AWS_ROLE_ARN` | `arn:aws:iam::910896517350:role/asgard-fjall-prod-github-actions` |
| **Variable** | `WEB_BUCKET` | `asgard-fjall-prod-web` |
| **Variable** | `CLOUDFRONT_DISTRIBUTION_ID` | `E1FXGRYGFKZMQB` |

Or after `gh auth login`:

```bash
gh secret set AWS_ROLE_ARN --env prod --repo levi-smith17/asgard_fjall \
  --body 'arn:aws:iam::910896517350:role/asgard-fjall-prod-github-actions'
gh variable set WEB_BUCKET --env prod --repo levi-smith17/asgard_fjall \
  --body 'asgard-fjall-prod-web'
gh variable set CLOUDFRONT_DISTRIBUTION_ID --env prod --repo levi-smith17/asgard_fjall \
  --body 'E1FXGRYGFKZMQB'
```

Then re-run the failed workflow (or push an empty commit on `main`).

## Terraform in the pipeline?

**Not yet for full apply.** DNS for `levismith.us` is in **cairn-prod**; CF/IAM are in **asgard**. CI OIDC can deploy to Asgard S3/CF today. Putting `terraform apply` in CI needs either:

1. Keep infra applies **local** (`AWS_PROFILE=asgard` + `cairn-prod` for DNS) — current recommendation, or
2. Later: cross-account role in cairn-prod that the Asgard GitHub role can assume for Route53 only.

Web **deploy** (build → S3 → invalidate) **is** in the pipeline once the env vars above are set.

## Optional next (Cairn CORS / Cognito)

Still required for live Basecamp data from the public site — see `docs/cairn-integration.md`.

#!/usr/bin/env node

import { buildSync } from 'esbuild'
import { execSync } from 'node:child_process'
import { existsSync, mkdirSync, rmSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const TMP = join(ROOT, '.deploy-tmp')
const ENVIRONMENT = process.env.ENVIRONMENT ?? 'prod'
const NAME_PREFIX = process.env.LAMBDA_NAME_PREFIX ?? `asgard-fjall-${ENVIRONMENT}`

const functions = process.argv.slice(2)

if (functions.length === 0) {
  console.error('Usage: node scripts/deploy.mjs <feature/method> [<feature/method> ...]')
  console.error('Example: node scripts/deploy.mjs profile/get settings/get')
  process.exit(1)
}

if (existsSync(TMP)) rmSync(TMP, { recursive: true })
mkdirSync(TMP, { recursive: true })

let failed = false

for (const fn of functions) {
  const [feature, method] = fn.split('/')
  if (!feature || !method) {
    console.error(`Invalid function format: "${fn}" — expected "feature/method"`)
    failed = true
    continue
  }

  const functionName = `${NAME_PREFIX}-${feature}-${method}`
  const entry = join(ROOT, 'functions', feature, method, 'handler.ts')
  const outDir = join(TMP, feature, method)
  const outfile = join(outDir, 'handler.js')
  const zipPath = join(TMP, `${feature}-${method}.zip`)

  if (!existsSync(entry)) {
    console.error(`Handler not found: ${entry}`)
    failed = true
    continue
  }

  console.log(`\nDeploying ${functionName}...`)

  try {
    mkdirSync(outDir, { recursive: true })
    buildSync({
      entryPoints: [entry],
      bundle: true,
      platform: 'node',
      target: 'node22',
      format: 'cjs',
      outfile,
      sourcemap: false,
      logLevel: 'warning',
    })

    execSync(`cd ${TMP} && zip -r ${zipPath} ${feature}/${method}/handler.js`, {
      stdio: 'inherit',
    })

    const profile = process.env.AWS_PROFILE ? `--profile ${process.env.AWS_PROFILE}` : ''
    const region = process.env.AWS_REGION ?? 'us-east-2'
    execSync(
      `aws lambda update-function-code --function-name ${functionName} --zip-file fileb://${zipPath} --region ${region} ${profile}`,
      { stdio: 'inherit' },
    )
    console.log(`Updated ${functionName}`)
  } catch (error) {
    console.error(`Failed to deploy ${functionName}`, error)
    failed = true
  }
}

if (existsSync(TMP)) rmSync(TMP, { recursive: true })
process.exit(failed ? 1 : 0)

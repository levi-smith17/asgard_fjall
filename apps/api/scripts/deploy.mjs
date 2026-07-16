#!/usr/bin/env node

import { execSync } from 'node:child_process'
import { existsSync, mkdirSync, rmSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const DIST = join(ROOT, 'dist')
const TMP = join(ROOT, '.deploy-tmp')
const ENVIRONMENT = process.env.ENVIRONMENT ?? 'prod'
const NAME_PREFIX = process.env.LAMBDA_NAME_PREFIX ?? `asgard-fjall-${ENVIRONMENT}`

const functions = process.argv.slice(2)

if (functions.length === 0) {
  console.error('Usage: node scripts/deploy.mjs <feature/method> [<feature/method> ...]')
  console.error('Example: node scripts/deploy.mjs health/get')
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
  const zipPath = join(TMP, `${feature}-${method}.zip`)
  const handlerDir = join(DIST, feature, method)
  const sharedDir = join(DIST, 'shared')

  if (!existsSync(handlerDir)) {
    console.error(`Handler not found: ${handlerDir} (run pnpm --filter @asgard-fjall/api build first)`)
    failed = true
    continue
  }

  console.log(`\nDeploying ${functionName}...`)

  try {
    const zipParts = [`${feature}/${method}`]
    if (existsSync(sharedDir)) zipParts.push('shared')
    execSync(`cd ${DIST} && zip -r ${zipPath} ${zipParts.join(' ')}`, { stdio: 'inherit' })

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

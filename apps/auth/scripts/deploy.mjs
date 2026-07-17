#!/usr/bin/env node

import { createRequire } from 'node:module'
import { execSync } from 'node:child_process'
import { existsSync, mkdirSync, rmSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const require = createRequire(import.meta.url)
const { buildSync } = require(join(
  dirname(fileURLToPath(import.meta.url)),
  '../../../apps/api/node_modules/esbuild',
))

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const TMP = join(ROOT, '.deploy-tmp')
const FUNCTION_NAME = process.env.AUTH_LAMBDA_NAME ?? 'asgard-fjall-prod-auth'

if (existsSync(TMP)) rmSync(TMP, { recursive: true })
mkdirSync(TMP, { recursive: true })

const outfile = join(TMP, 'handler.js')
const zipPath = join(TMP, 'auth.zip')

console.log(`Building ${FUNCTION_NAME}...`)
buildSync({
  entryPoints: [join(ROOT, 'src/handler.ts')],
  bundle: true,
  platform: 'node',
  target: 'node22',
  format: 'cjs',
  outfile,
  sourcemap: false,
  logLevel: 'warning',
})

execSync(`cd ${TMP} && zip -q auth.zip handler.js`, { stdio: 'inherit' })
console.log(`Uploading ${FUNCTION_NAME}...`)
execSync(
  `aws lambda update-function-code --function-name ${FUNCTION_NAME} --zip-file fileb://${zipPath} --region ${process.env.AWS_REGION ?? 'us-east-2'} --query CodeSha256 --output text`,
  { stdio: 'inherit', env: process.env },
)
console.log('Auth Lambda updated.')

// Stamps the service worker with a fresh version so every deploy is picked up.
import { readFile, writeFile } from 'node:fs/promises'
import { execSync } from 'node:child_process'

let version
try {
  version = execSync('git rev-parse --short HEAD', { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim()
} catch {
  version = Date.now().toString(36)
}
version = process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? version

const template = await readFile('scripts/sw.template.js', 'utf8')
await writeFile('public/sw.js', template.replace('__VERSION__', version))
console.log(`sw.js ${version}`)

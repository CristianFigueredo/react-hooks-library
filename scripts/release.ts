import { execSync } from 'child_process'
import consola from 'consola'
import { readFileSync, writeFileSync } from 'fs'
import { basename, resolve } from 'path'

import { findFunctions } from './utils/findFunctions'

const branch = execSync('git branch --show-current', {
  encoding: 'utf8'
}).trim()

if (branch !== 'main') {
  consola.error('You must be on the main branch to release')
  process.exit(1)
}

const { version: oldVersion } = JSON.parse(
  readFileSync('package.json', 'utf-8')
)

const { version } = JSON.parse(readFileSync('package.json', 'utf-8'))

if (oldVersion === version) {
  console.log('canceled')
  process.exit()
}

const rootDir = resolve(__dirname, '..')
const packagesDir = resolve(rootDir, 'packages')
let packages = findFunctions(packagesDir)

packages = [
  ...packages.map((p) => resolve(packagesDir, p)),
  resolve(rootDir, 'website')
]

for (const pkg of packages) {
  console.log(pkg)
  const packageJson = JSON.parse(readFileSync(`${pkg}/package.json`, 'utf-8'))
  packageJson.version = version
  if (packageJson.dependencies['@react-hooks-library/shared']) {
    packageJson.dependencies['@react-hooks-library/shared'] = version
  }

  writeFileSync(`${pkg}/package.json`, JSON.stringify(packageJson, null, 2))

  consola.success(
    `Bumped package version for @react-hooks-library/${basename(pkg)}`
  )
}

execSync('git add .', { stdio: 'inherit' })
execSync(`git commit -m "release: v${version}"`, { stdio: 'inherit' })
execSync(`git tag -a v${version} -m "v${version}"`, { stdio: 'inherit' })

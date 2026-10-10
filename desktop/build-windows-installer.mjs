import { existsSync, readFileSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const packageJson = JSON.parse(readFileSync(path.join(projectRoot, 'package.json'), 'utf8'))
const version = packageJson.version

if (process.platform !== 'win32') {
  console.error('The Windows installer must be built on Windows with Inno Setup installed.')
  process.exit(1)
}

if (typeof version !== 'string' || !/^\d+\.\d+\.\d+(?:[-+][\w.-]+)?$/.test(version)) {
  console.error('package.json must contain a valid application version.')
  process.exit(1)
}

const candidates = [
  process.env.ISCC_PATH,
  process.env['ProgramFiles(x86)'] && path.join(process.env['ProgramFiles(x86)'], 'Inno Setup 6', 'ISCC.exe'),
  process.env.ProgramFiles && path.join(process.env.ProgramFiles, 'Inno Setup 6', 'ISCC.exe'),
  process.env['ProgramFiles(x86)'] && path.join(process.env['ProgramFiles(x86)'], 'Inno Setup 7', 'ISCC.exe'),
  process.env.ProgramFiles && path.join(process.env.ProgramFiles, 'Inno Setup 7', 'ISCC.exe'),
].filter(Boolean)

const compiler = candidates.find(candidate => existsSync(candidate)) ?? 'ISCC.exe'
const installerScript = path.join(projectRoot, 'desktop', 'windows-installer.iss')
const result = spawnSync(compiler, [`/DMyAppVersion=${version}`, installerScript], {
  cwd: projectRoot,
  stdio: 'inherit',
  shell: false,
})

if (result.error) {
  console.error(`Could not start Inno Setup Compiler: ${result.error.message}`)
  process.exit(1)
}

if (result.status !== 0) process.exit(result.status ?? 1)

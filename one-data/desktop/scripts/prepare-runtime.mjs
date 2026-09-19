import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const desktopDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const buildDir = path.join(desktopDir, 'build')
const runtimeDir = path.join(buildDir, 'runtime')
const jarSource = path.resolve(desktopDir, '../backend/target/one-data-0.0.1-SNAPSHOT.jar')
const javaHome = process.env.JAVA_HOME

if (!javaHome) throw new Error('JAVA_HOME must point to a JDK 17 installation.')
if (!fs.existsSync(jarSource)) throw new Error('Backend jar is missing. Build the backend first.')
const jlink = path.join(javaHome, 'bin', process.platform === 'win32' ? 'jlink.exe' : 'jlink')
if (!fs.existsSync(jlink)) throw new Error('jlink was not found in JAVA_HOME. Use a full JDK 17.')

fs.mkdirSync(buildDir, { recursive: true })
const relative = path.relative(buildDir, runtimeDir)
if (relative !== 'runtime' || path.isAbsolute(relative)) throw new Error('Refusing to remove an unexpected runtime path.')
fs.rmSync(runtimeDir, { recursive: true, force: true })

execFileSync(jlink, [
  '--add-modules', 'java.se,jdk.unsupported,jdk.crypto.ec,jdk.zipfs',
  '--strip-debug', '--no-man-pages', '--no-header-files',
  '--output', runtimeDir
], { stdio: 'inherit' })
fs.copyFileSync(jarSource, path.join(buildDir, 'one-data.jar'))
console.log(`Bundled backend and Java runtime for ${process.platform}/${process.arch}.`)

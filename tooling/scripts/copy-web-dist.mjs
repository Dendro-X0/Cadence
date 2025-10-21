#!/usr/bin/env node
import { promises as fs } from 'fs'
import path from 'path'
import url from 'url'

const __filename = url.fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// This script is run from apps/desktop/src-tauri via: node ../../../tooling/scripts/copy-web-dist.mjs
// It copies ../../apps/web/dist into ../dist (relative to src-tauri)
async function main() {
  // Resolve paths relative to src-tauri directory
  // src-tauri -> .. (apps/desktop) -> .. (apps) -> web/dist
  const src = path.resolve(__dirname, '../../apps/web/dist')
  // src-tauri -> .. (apps/desktop) -> dist
  const dest = path.resolve(__dirname, '../../apps/desktop/dist').replace(/\\/g, '/')

  // When executed from src-tauri via the beforeBuildCommand, CWD is src-tauri.
  // But resolving from script dir keeps it robust.

  // Ensure source exists
  try {
    const stat = await fs.stat(src)
    if (!stat.isDirectory()) throw new Error('Source is not a directory')
  } catch (e) {
    console.error(`[copy-web-dist] Source not found: ${src}`)
    throw e
  }

  // Clean destination
  await fs.rm(dest, { recursive: true, force: true })
  await fs.mkdir(dest, { recursive: true })

  // Recursive copy
  await copyDir(src, dest)
  console.log(`[copy-web-dist] Copied web dist -> ${dest}`)
}

async function copyDir(from, to) {
  const entries = await fs.readdir(from, { withFileTypes: true })
  await fs.mkdir(to, { recursive: true })
  for (const entry of entries) {
    const srcPath = path.join(from, entry.name)
    const destPath = path.join(to, entry.name)
    if (entry.isDirectory()) {
      await copyDir(srcPath, destPath)
    } else if (entry.isSymbolicLink()) {
      const link = await fs.readlink(srcPath)
      await fs.symlink(link, destPath)
    } else {
      await fs.copyFile(srcPath, destPath)
    }
  }
}

main().catch((err) => {
  console.error('[copy-web-dist] Failed:', err)
  process.exit(1)
})

#!/usr/bin/env node
import { promises as fs } from 'fs'
import path from 'path'
import url from 'url'
import { Resvg } from '@resvg/resvg-js'

const __filename = url.fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const webRoot = path.resolve(__dirname, '..')
const publicDir = path.join(webRoot, 'public')
const iconsDir = path.join(publicDir, 'icons')
const svgPath = path.join(publicDir, 'favicon.svg')

async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true })
}

async function generate(size, outFile) {
  const svg = await fs.readFile(svgPath)
  const resvg = new Resvg(svg, { fitTo: { mode: 'width', value: size } })
  const png = resvg.render().asPng()
  await fs.writeFile(outFile, png)
}

async function main() {
  try {
    await ensureDir(iconsDir)
    await generate(192, path.join(iconsDir, 'icon-192.png'))
    await generate(512, path.join(iconsDir, 'icon-512.png'))
    await generate(180, path.join(iconsDir, 'apple-touch-icon-180.png'))
    console.log('[gen-icons] Generated 192/512/apple-touch-180 icons')
  } catch (err) {
    console.error('[gen-icons] Failed:', err)
    process.exit(1)
  }
}

main()

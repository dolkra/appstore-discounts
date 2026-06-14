#!/usr/bin/env node

import fs from 'fs'
import path from 'path'
import { spawn } from 'child_process'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// 复制数据文件
function copyDataFiles() {
  console.log('📁 Copying data files to dist...')
  const dataDir = path.join(__dirname, '..', 'data')
  const distDir = path.join(__dirname, '..', 'dist')

  if (fs.existsSync(dataDir)) {
    fs.readdirSync(dataDir).forEach((file) => {
      const src = path.join(dataDir, file)
      const dest = path.join(distDir, file)
      if (fs.lstatSync(src).isDirectory()) {
        copyDir(src, dest)
      } else {
        fs.copyFileSync(src, dest)
      }
    })
  }
  console.log('✅ Data files copied')
}

// 复制目录
function copyDir(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true })
  }
  fs.readdirSync(src).forEach((file) => {
    const srcFile = path.join(src, file)
    const destFile = path.join(dest, file)
    if (fs.lstatSync(srcFile).isDirectory()) {
      copyDir(srcFile, destFile)
    } else {
      fs.copyFileSync(srcFile, destFile)
    }
  })
}

// 检查是否支持浏览器环境
async function shouldPrerender() {
  // 环境变量检查
  if (process.env.CF_PAGES || process.env.VERCEL) {
    return false
  }

  // 检查 DISPLAY 环境变量
  if (!process.env.DISPLAY) {
    console.log('⚠️  No DISPLAY environment found, skipping prerender')
    return false
  }

  // 检查是否存在 Chrome
  try {
    const { execSync } = await import('child_process')
    execSync('which google-chrome || which chromium || which chrome', {
      stdio: 'ignore',
    })
    return true
  } catch (e) {
    console.log('⚠️  Chrome not found, skipping prerender')
    return false
  }
}

// 执行预渲染
async function runPrerender() {
  if (!(await shouldPrerender())) {
    console.log('⏭️  Skipping prerender step')
    return
  }

  try {
    console.log('🔄 Starting SSG prerendering...')

    const child = spawn('tsx', ['scripts/prerender.ts'], {
      stdio: 'inherit',
      cwd: path.join(__dirname, '..'),
    })

    await new Promise((resolve, reject) => {
      child.on('close', (code) => {
        if (code === 0) {
          console.log('✅ Prerendering completed')
          resolve()
        } else {
          console.log('❌ Prerendering failed with code:', code)
          reject(new Error(`Prerender failed with code ${code}`))
        }
      })

      child.on('error', (error) => {
        console.log('❌ Prerendering error:', error)
        reject(error)
      })
    })
  } catch (error) {
    console.log('❌ Prerendering failed:', error.message)
    process.exit(1)
  }
}

// 主函数
async function main() {
  try {
    copyDataFiles()
    await runPrerender()
    console.log('🎉 Post-build completed successfully')
  } catch (error) {
    console.error('❌ Post-build failed:', error.message)
    process.exit(1)
  }
}

main()

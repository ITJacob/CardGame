import { defineConfig, type Plugin, type Connect } from 'vite'
import { createReadStream, existsSync, readFileSync, statSync } from 'node:fs'
import { extname, join, normalize, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import { gitHead, readDataIndex, readFromFs, type LockFile } from './scripts/lib/data-index'
import type { DataVersion } from './src/data/version'

// 仓库根：game/ 的上一级（docs/ 与 site/ 都在那里）
const repoRoot = fileURLToPath(new URL('..', import.meta.url))

/** 构建时确定数据版本：读 lock + 实测当前数据哈希，判定是否已漂移 */
function computeDataVersion(): DataVersion {
  const docsDir = join(repoRoot, 'docs', 'json')
  const lockPath = join(repoRoot, 'game', 'data.lock.json')
  const lock = existsSync(lockPath) ? (JSON.parse(readFileSync(lockPath, 'utf8')) as LockFile) : null
  const idx = readDataIndex(readFromFs(docsDir))
  const sha = gitHead(repoRoot)
  return {
    docsRef: lock?.docsRef ?? sha,
    docsTag: lock?.docsTag ?? null,
    dataHash: idx.dataHash,
    lockHash: lock?.dataHash ?? '',
    stale: !!lock && lock.dataHash !== idx.dataHash,
    schemaVersion: idx.manifest.schemaVersion,
    sourceVersion: idx.manifest.sourceVersion,
    counts: lock?.counts ?? {},
    verifiedAt: lock?.verifiedAt ?? '',
    buildTime: new Date().toISOString(),
    gameSha: sha,
  }
}

const CONTENT_TYPES: Record<string, string> = {
  '.json': 'application/json; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
}

// 开发期把仓库根的 docs/ 与 site/ 按生产同布局挂上来，
// 使相对路径 ./docs/json/… 与 ./site/ 在 dev 与 prod 下都成立——全程不拷贝数据。
function serveRepoDir(mount: string, dir: string): Plugin {
  const root = join(repoRoot, dir)
  const handler: Connect.NextHandleFunction = (req, res, next) => {
    const urlPath = decodeURIComponent((req.url ?? '/').split('?')[0])
    const filePath = normalize(join(root, urlPath))
    if (!filePath.startsWith(root + sep) || !existsSync(filePath) || !statSync(filePath).isFile()) {
      next()
      return
    }
    res.setHeader('Content-Type', CONTENT_TYPES[extname(filePath).toLowerCase()] ?? 'application/octet-stream')
    createReadStream(filePath).pipe(res)
  }
  return {
    name: `serve-repo-${mount}`,
    configureServer(server) {
      server.middlewares.use(mount, handler)
    },
    configurePreviewServer(server) {
      server.middlewares.use(mount, handler)
    },
  }
}

export default defineConfig(({ command }) => ({
  // 生产部署在 Pages 根 /CardGame/；dev 用 / 以便与中间件路径一致。
  // 运行时一律走相对路径（./docs/…、./site/），两种 base 下都解析正确。
  base: command === 'build' ? '/CardGame/' : '/',
  plugins: [serveRepoDir('/docs', 'docs'), serveRepoDir('/site', 'site')],
  define: {
    __DATA_VERSION__: JSON.stringify(computeDataVersion()),
  },
  build: {
    target: 'es2022',
    outDir: 'dist',
    emptyOutDir: true,
  },
}))

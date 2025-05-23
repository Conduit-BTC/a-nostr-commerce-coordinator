import path from 'path'
import fs from 'fs/promises'

/**
 * Traverses src/subscriptions and loads each
 */
export async function loadSubscriptions(container: NCCAppContainer) {
  const subDir = path.resolve(__dirname, '../subscriptions')
  const files = await fs.readdir(subDir)

  for (const file of files) {
    if (file.endsWith('.ts') && !file.includes('.test.')) {
      const mod = await import(path.join(subDir, file))
      const Cls = mod.default
      const instance = new Cls(container)
      instance.subscribe()
    }
  }
}

import path from 'path'
import { readdir, stat } from 'fs/promises'
import type Config from '@/config'
import type { EventBus } from '@/events/NCCEventBus'
import { postgresPersistenceFactory } from '@/services/postgres'

export async function loadModules({
  config,
  eventBus
}: {
  config: typeof Config
  eventBus: typeof EventBus
}): Promise<NCCModule<any>[]> {
  console.log('[load-modules] -> Loading modules...')
  const modulesDir = path.resolve(__dirname, '../modules')
  const moduleNames = await getSubdirectories(modulesDir)
  const modules: NCCModule<any>[] = []

  for (const name of moduleNames) {
    const base = path.join(modulesDir, name)

    const createModule = await importDefault<
      (args: {
        container: NCCModuleContainer<any>
        loaders?: NCCLoader[]
        lazyLoaders?: NCCLoader[]
        persistence: Record<string, any> // Type can be improved
      }) => NCCModule<any>
    >(`${base}/index.ts`)

    const ServiceClass = await importDefault<any>(`${base}/service.ts`)
    const models = await importAllExports(`${base}/models`)
    const loaders = await importAllDefaults(`${base}/loaders`)
    const lazyLoaders = await importAllDefaults(`${base}/loaders/lazy`)

    const container: NCCModuleContainer<any> = {
      config,
      eventBus,
      models,
      service: {} as any
    }

    const persistence: Record<string, any> = {}
    for (const modelName in models) {
      const schema = models[modelName]
      persistence[modelName] = postgresPersistenceFactory({
        modelName,
        schema,
        moduleName: name,
        dbPath: '' // now unused
      })
    }

    const service = new ServiceClass({ container })
    container.service = service

    const mod = createModule({
      container,
      loaders,
      lazyLoaders,
      persistence
    })
    container.module = mod
    modules.push(mod)
  }

  return modules
}

async function getSubdirectories(dir: string): Promise<string[]> {
  const items = await readdir(dir)
  return Promise.all(
    items.map(async (item) => {
      const fullPath = path.join(dir, item)
      return (await stat(fullPath)).isDirectory() ? item : null
    })
  ).then((dirs) => dirs.filter(Boolean) as string[])
}

async function importDefault<T = any>(filePath: string): Promise<T> {
  try {
    const mod = await import(filePath)
    return mod.default as T
  } catch (err) {
    throw new Error(`Failed to import ${filePath}: ${err}`)
  }
}

async function importAllDefaults(dir: string): Promise<NCCLoader[]> {
  try {
    const files = (await readdir(dir)).filter((f) => f.endsWith('.ts'))
    return Promise.all(
      files.map(
        async (f) => (await import(path.join(dir, f))).default as NCCLoader
      )
    )
  } catch {
    return []
  }
}

async function importAllExports(dir: string): Promise<Record<string, any>> {
  try {
    const files = (await readdir(dir)).filter((f) => f.endsWith('.ts'))
    const all = await Promise.all(files.map((f) => import(path.join(dir, f))))
    return Object.assign({}, ...all)
  } catch {
    return {}
  }
}

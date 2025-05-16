import path from "path";
import { readdir, stat } from "fs/promises";
import { fileURLToPath } from "url";
import type Config from "@/config";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const modulesDir = path.resolve(__dirname, "../modules");

export async function loadModules({
  config,
}: {
  config: typeof Config;
}): Promise<NCCModule[]> {
  console.log("[load-modules] -> Loading modules...");
  const moduleNames = await getSubdirectories(modulesDir);
  const modules: NCCModule[] = [];

  for (const name of moduleNames) {
    const base = path.join(modulesDir, name);

    const mod = await importDefault<NCCModule>(`${base}/index.ts`);

    if (!mod) {
      throw new Error(`Missing or invalid index.ts for module "${name}"`);
    }

    const ServiceClass = await importDefault<any>(`${base}/service.ts`);
    if (!ServiceClass) throw new Error(`Missing service for module "${name}"`);

    const models = await importAllExports(`${base}/models`);
    const loaders = await importAllDefaults(`${base}/loaders`);
    const lazyLoaders = await importAllDefaults(`${base}/loaders/lazy`);

    mod.name = name;
    mod.loaders = loaders;
    mod.lazyLoaders = lazyLoaders;
    mod.container = {
      config,
      service: new ServiceClass(),
      models,
    };

    console.log("[load-modules] > Module loaded: ", mod.name);
    modules.push(mod);
  }

  console.log("[load-modules] -> All modules loaded");
  return modules;
}

async function getSubdirectories(dir: string): Promise<string[]> {
  const items = await readdir(dir);
  return Promise.all(
    items.map(async (item) => {
      const fullPath = path.join(dir, item);
      return (await stat(fullPath)).isDirectory() ? item : null;
    })
  ).then((dirs) => dirs.filter(Boolean) as string[]);
}

async function importDefault<T = any>(filePath: string): Promise<T> {
  try {
    const mod = await import(filePath);
    return mod.default as T;
  } catch (err) {
    throw new Error(`Failed to import ${filePath}: ${err}`);
  }
}

async function importAllDefaults(dir: string): Promise<NCCLoader[]> {
  try {
    const files = (await readdir(dir)).filter((f) => f.endsWith(".ts"));
    return Promise.all(
      files.map(
        async (f) => (await import(path.join(dir, f))).default as NCCLoader
      )
    );
  } catch {
    return [];
  }
}

async function importAllExports(dir: string): Promise<Record<string, any>> {
  try {
    const files = (await readdir(dir)).filter((f) => f.endsWith(".ts"));
    const all = await Promise.all(files.map((f) => import(path.join(dir, f))));
    return Object.assign({}, ...all);
  } catch {
    return {};
  }
}

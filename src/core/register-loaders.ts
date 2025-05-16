/**
 * Runs all eager loaders in all modules
 */
export async function runEagerLoaders(modules: NCCModule[]) {
  console.log("[register-loaders] > Firing loaders...");
  for (const mod of modules) {
    if (!mod || !Array.isArray(mod.loaders)) {
      console.warn("Invalid module detected:", mod);
      continue;
    }

    for (const loader of mod.loaders) {
      if (typeof loader !== "function") {
        console.warn(`Non-function loader in module "${mod.name}":`, loader);
        continue;
      }

      await loader({ container: mod.container });
    }
  }
}

/**
 * Runs all lazy loaders in all modules
 */
export async function runLazyLoaders(modules: NCCModule[]) {
  console.log("[register-loaders] > Firing lazy loaders...");

  for (const mod of modules) {
    if (!mod || !Array.isArray(mod.lazyLoaders)) {
      console.warn("Invalid module detected:", mod);
      continue;
    }

    for (const loader of mod.lazyLoaders) {
      if (typeof loader !== "function") {
        console.warn(`Non-function loader in module "${mod.name}":`, loader);
        continue;
      }

      await loader({ container: mod.container });
    }
  }
}

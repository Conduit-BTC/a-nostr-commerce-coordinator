/**
 * Runs all eager loaders in provided modules
 */
export async function runEagerLoaders<
  T extends NCCModule<any> = NCCModule<any>
>(modules: T[]) {
  console.log('[register-loaders] > Registering eager loaders...')
  for (const mod of modules) {
    if (!mod?.loaders?.length) continue

    for (const loader of mod.loaders) {
      await loader({ container: mod.container })
    }
  }
  console.log('[register-loaders] > Eager loaders ready.')
}

/**
 * Runs all lazy loaders in provided modules
 */
export async function runLazyLoaders<T extends NCCModule<any> = NCCModule<any>>(
  modules: T[]
) {
  console.log('[register-loaders] > Registering lazy loaders...')
  for (const mod of modules) {
    if (!mod?.lazyLoaders?.length) continue

    for (const loader of mod.lazyLoaders) {
      await loader({ container: mod.container })
    }
  }
  console.log('[register-loaders] > Lazy loaders ready.')
}

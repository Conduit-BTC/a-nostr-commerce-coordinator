import Config from "./config";
import { loadModules } from "./core/load-modules";
import { runEagerLoaders, runLazyLoaders } from "./core/register-loaders";

console.log("[main.ts] > Starting NCC...");

const modules = await loadModules({ config: Config });

// Register all the subscribers

await runEagerLoaders(modules);
await runLazyLoaders(modules);

// Start the webhook server

console.log("[main.ts] > NCC load complete");

/// <reference types="vite/client" />

import type NCCService from "./NCCService";

export {};

declare global {
  type NCCLoader = ({
    container,
  }: {
    container: NCCModuleContainer;
  }) => Promise<void>;
  type NCCService = typeof NCCService;

  interface NCCModuleContainer {
    config: typeof import("@/config").default;
    service: NCCService;
    models: Record<string, any>;
  }

  interface NCCModule {
    name: string;
    loaders: NCCLoader[];
    lazyLoaders: NCCLoader[];
    service: NCCService;
    container: NCCModuleContainer;
  }

  interface ImportMeta {
    glob<T = unknown>(
      pattern: string,
      options?: {
        eager?: boolean;
        import?: string;
      }
    ): Record<string, T>;
  }
}

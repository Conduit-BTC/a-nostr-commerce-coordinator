import { defineModule } from '@/modules/define-module'
import type {
  DirectMessagesModule,
  DirectMessagesModuleContainer
} from './types'

export const DirectMessagesModuleName = 'direct-messages-module'

type DirectMessagesFactoryArgs = {
  container: DirectMessagesModuleContainer
  loaders?: NCCLoader[]
  lazyLoaders?: NCCLoader[]
}

export default function createDirectMessagesModule({
  container,
  loaders = [],
  lazyLoaders = []
}: DirectMessagesFactoryArgs): DirectMessagesModule {
  return defineModule({
    name: DirectMessagesModuleName,
    container,
    loaders,
    lazyLoaders
  })
}

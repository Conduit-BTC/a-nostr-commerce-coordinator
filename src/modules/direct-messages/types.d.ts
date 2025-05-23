import type DirectMessageService from './service'
import type DirectMessagesModule from './index'

export interface DirectMessagesModule extends NCCModule {
  container: DirectMessagesModuleContainer<DirectMessageService>
}

export interface DirectMessagesModuleContainer
  extends NCCModuleContainer<DirectMessageService> {}

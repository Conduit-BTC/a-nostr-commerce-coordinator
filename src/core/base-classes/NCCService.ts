export default abstract class NCCService<
  TService,
  TModule extends NCCModule = NCCModule
> {
  public readonly container: NCCModuleContainer<TService>
  public readonly module: TModule

  constructor({ container }: { container: NCCModuleContainer<TService> }) {
    this.container = container
    this.module = container.module as TModule
  }
}

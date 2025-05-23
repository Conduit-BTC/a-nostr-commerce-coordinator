export default abstract class NCCService<T> {
  container

  constructor({ container }: { container: NCCModuleContainer<T> }) {
    this.container = container
  }
}

import { DriverOptionsMap, Engine } from './engine'

export abstract class AbsConnector<Name extends Engine.Drivers> {
  protected constructor(
    protected readonly options: DriverOptionsMap[Name]
  ) {
    this.options = options
  }
}

export namespace Connector {
}

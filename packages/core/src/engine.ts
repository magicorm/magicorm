import { Connector } from './connector'
import { Model } from './model'

export interface DriverOptionsMap {
  [p: string]: any
}

export interface DriverConstructor<Name extends Engine.Drivers> {
  new(options?: DriverOptionsMap[Name]): Driver<Name>
}

export interface Driver<Name extends Engine.Drivers> {
  name: Name
  options?: DriverOptionsMap[Name]
}

export abstract class AbsDriver<Name extends Engine.Drivers> {
  protected constructor(
    public name: Name, public options?: DriverOptionsMap[Name]
  ) {
    this.name = name
    this.options = options
  }
  /**
   * Drop table by model
   */
  abstract drop: (m: Model) => Promise<void>
  /**
   * Create table by model
   */
  abstract create: (m: Model) => Promise<void>
  /**
   * Search results by query
   */
  abstract search: () => Promise<void>
  /**
   * Insert data to model
   */
  abstract insert: (m: Model) => Promise<void>
  /**
   * Update data for model
   */
  abstract update: (m: Model) => Promise<void>
  /**
   * Update or Insert data to model
   */
  abstract upsert: (m: Model) => Promise<void>
  /**
   * Delete data for model
   */
  abstract delete: (m: Model) => Promise<void>
}

export function createDriver<Name extends Engine.Drivers>(
  name: Name, options?: DriverOptionsMap[Name]
): Driver<Name> {
  return new (Driver.resolve(name))(options)
}

export namespace Driver {
  export const resolve = <Name extends Engine.Drivers>(name: Name): DriverConstructor<Name> => {
    if (typeof name === 'string') {
      if (name.startsWith('.') || name.startsWith('@')) {
        return require(name)
      }
      let n: string | undefined
      const names = [
        `@magicorm/driver-${name}`,
        `magicorm-driver-${name}`
      ]
      while (n = names.shift()) {
        try {
          return require(n)
        } catch (e) {}
      }
      throw new Error(`Driver ${name} is not found`)
    } else {
      throw new Error('Driver name must be a string')
    }
  }
}

export class Engine<DriverName extends Engine.Drivers> {
  driver: Driver<DriverName>
  connector: Connector | null = null

  constructor(public options: Engine.Options<DriverName>) {
    this.options = Object.assign({}, options)
    this.driver = createDriver(this.options.driver, this.options.driverOptions)
  }

  connect() {
  }
}

export function createEngine<DriverName extends Engine.Drivers>(options: Engine.Options<DriverName>) {
  return new Engine(options)
}

export namespace Engine {
  export type Drivers = keyof DriverOptionsMap
  export interface Options<DriverName extends Drivers> {
    driver: DriverName
    driverOptions?: DriverOptionsMap[DriverName]
  }
}

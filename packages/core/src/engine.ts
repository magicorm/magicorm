import { AbsConnector } from './connector'
import { Model, modelsCache } from './model'

export interface DriverOptionsMap {
  [p: string]: any
}

export interface DriverConstructor<Name extends Engine.Drivers> {
  new(options?: DriverOptionsMap[Name]): Driver<Name>
}

export interface Driver<
  Name extends Engine.Drivers,
  Connector extends AbsConnector<Name> = AbsConnector<Name>
  > {
  name: Name
  options?: DriverOptionsMap[Name]
  connect(options?: DriverOptionsMap[Name]): Awaited<Connector>
  /**
   * Remove table from db
   */
  remove: (m: Model, conn: Connector) => Awaited<void>
  /**
   * Create table from db
   */
  create: (m: Model, conn: Connector) => Awaited<void>
  /**
   * Search results by query
   */
  // search: () => Awaited<void>
  /**
   * Insert data to model
   */
  // insert: (m: Model) => Awaited<void>
  /**
   * Update data for model
   */
  // update: (m: Model) => Awaited<void>
  /**
   * Update or Insert data to model
   */
  // upsert: (m: Model) => Awaited<void>
  /**
   * Delete data for model
   */
  // delete: (m: Model) => Awaited<void>
}

export abstract class AbsDriver<Name extends Engine.Drivers> {
  protected constructor(
    public name: Name, public options?: DriverOptionsMap[Name]
  ) {
    this.name = name
    this.options = options
  }
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

export const engines = [] as Engine<any>[]

export class Engine<DriverName extends Engine.Drivers> {
  driver: Driver<DriverName>
  models: Model<this>[] = []

  constructor(public options: Engine.Options<DriverName>) {
    this.options = Object.assign({}, options)
    this.driver = createDriver(this.options.driver, this.options.driverOptions)
    engines.push(this)
    modelsCache.forEach(m => this.registerModel(m as Model<this>))
    modelsCache.splice(0, modelsCache.length)
  }

  registerModel(model: Model<this>) {
    this.models.push(model)
  }

  async connect() {
    await this.driver.connect(this.options)
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
    /**
     * Generate DDL for model
     *
     * * `none` - no DDL
     * * `drop` - drop table
     * * `drop-create` - drop table and create
     * * `create` - create table
     * * `update` - update table when model changed
     * * `validate` - validate table by model
     */
    m2ddl?:
      | 'none'
      | 'drop'
      | 'drop-create'
      | 'create'
      // | 'update'
      // | 'validate'
  }
}

import {
  AbsConnector,
  AbsDriver,
  Driver, Engine,
  Entity,
  EntityModelSymbol,
  Model,
  Selector
} from '@magicorm/core'

declare module '@magicorm/core' {
  interface DriverOptionsMap {
    'foo': Options
  }
}

interface Options {
  dbName: string
}

const dbs = new Map<string, Record<string, any[]>>()

class Connector extends AbsConnector<'foo'> {
  public db: Record<string, any[]>
  constructor(options: Options) {
    super(options)
    const db = dbs.get(this.options.dbName)
    if (db === undefined) {
      dbs.set(this.options.dbName, this.db = {})
    } else {
      this.db = db
    }
  }
}

class FooDriver extends AbsDriver<'foo'> implements Driver<'foo', Connector> {
  static dbs = dbs

  constructor(options?: Options) {
    super('foo', options)
  }
  connect() {
    return new Connector(Object.assign({
      dbName: 'default'
    }, this.options))
  }
  remove(m: Model, conn: Connector) {
    delete conn.db[m.name]
  }
  create(m: Model, conn: Connector) {
    conn.db[m.name] = []
  }
  insert<M extends Model>(entities: Entity<M>[], conn: Connector) {
    if (entities.length > 0) {
      const m = entities[0][EntityModelSymbol]
      conn.db[m.name].push(...entities)
    }
    return entities
  }
  search<Schemas extends readonly Model.Schema[]>(
    conn: Connector,
    opts?: Driver.OperateOptions,
    ...properties: Schemas
  ) {
    return new Selector(async sel => {
      const { offset, limit } = sel.options
      const query = Selector.resolveQuery(sel.queries)
      const models = Object.entries(sel.properties).reduce((acc, [key, prop]) => {
        console.log('acc:', acc)
        // acc.push(prop[OriginModelSymbol])
        return acc
      }, [])
      return []
    }, ...properties)
  }

  delete<Models extends Model[]>(models: Models, query: Engine.Models2Query<Models>, conn: Connector, opts?: Driver.OperateOptions) {
    return 0
  }

  update<Models extends Model[]>(models: Models, query: Engine.Models2Query<Models>, conn: Connector, opts?: Driver.OperateOptions) {
  }

  upsert<Models extends Model[]>(models: Models, query: Engine.Models2Query<Models>, conn: Connector, opts?: Driver.OperateOptions) {
  }
}

export = FooDriver

import { AbsConnector, AbsDriver, Driver, DriverOptionsMap, Model } from '@magicorm/core'

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
  constructor(options?: Options) {
    super('foo', options)
  }
  connect(options?: DriverOptionsMap['foo']) {
    return new Connector(Object.assign({
      dbName: 'default'
    }, options))
  }
  remove(m: Model, conn: Connector) {
    delete conn.db[m.name]
  }
  create(m: Model, conn: Connector) {
    conn.db[m.name] = []
  }
}

export = FooDriver

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
  db = dbs.get(this.options.dbName)
  constructor(options: Options) {
    super(options)
    if (this.db === undefined) {
      dbs.set(this.options.dbName, this.db = {})
    }
  }
}

class FooDriver extends AbsDriver<'foo'> implements Driver<'foo'> {
  constructor(options?: Options) {
    super('foo', options)
  }

  connect(options?: DriverOptionsMap['foo']) {
    return new Connector(Object.assign({
      dbName: 'default'
    }, options))
  }

  drop(m: Model) {
    return Promise.resolve(undefined)
  }

  create(m: Model) {
    return Promise.resolve(undefined)
  }
}

export = FooDriver

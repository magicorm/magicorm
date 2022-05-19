import { Connection, ConnectionConfig } from 'mysql'
import {
  AbsConnector,
  AbsDriver,
  Driver,
  Engine,
  Entity, EntityModelSymbol,
  Model,
  Selector,
  UnconnectedDatabaseError, UnknownDatabaseError
} from '@magicorm/core'

interface Options extends ConnectionConfig {
  uri?: string
}

declare module '@magicorm/core' {
  interface DriverOptionsMap {
    'mysql': Options
  }
}

const { createConnection } = require('@vlasky/mysql')

class Connector extends AbsConnector<'mysql'> {
  onConnect: Promise<void>
  inner: Connection
  constructor(options: Options) {
    super(options)
    if (options.uri)
      this.inner = createConnection(options.uri)
    else
      this.inner = createConnection(options)

    this.onConnect = new Promise<void>((resolve, reject) => {
      this.inner.connect(err => {
        if (err) {
          if (err.code === 'ER_BAD_DB_ERROR') {
            const [, dbName] = /Unknown database '(.+)'/[Symbol.match](err.sqlMessage ?? '') ?? []
            if (dbName) {
              reject(new UnknownDatabaseError(dbName))
            }
          }
          reject(err)
        } else
          resolve()
      })
    })
  }
  close() {
    return new Promise<void>((resolve, reject) => {
      this.inner.end(err => {
        if (err)
          reject(err)
        else
          resolve()
      })
    })
  }
}

class MysqlDriver extends AbsDriver<'mysql'> implements Driver<'mysql', Connector> {
  constructor(options: Options) {
    super('mysql', options)
  }

  exec(conn: Connector, sql: string, values?: any[]) {
    return new Promise((resolve, reject) => {
      conn.inner.query(sql, values, (err, results) => {
        if (err) {
          if (err.message === 'Cannot enqueue Query after invoking quit.') {
            reject(new UnconnectedDatabaseError())
            return
          }
          reject(err)
        } else
          resolve(results)
      })
    })
  }

  connect() {
    return new Connector(this.options)
  }

  remove(m: Model, conn: Connector) {
    return this.exec(conn, `drop table ${m.name};`)
  }

  static resolveSchema(name: string, schema: Model.Schema) {
    let prePrimaryKey = ''
    const propertiesDef = Object.entries(schema)
      .map(([key, value]) => {
        if (value.$content.primary) {
          if (prePrimaryKey)
            throw new Error(`Primary key '${ prePrimaryKey }' is already defined.`)
          prePrimaryKey = key
        }
        return MysqlDriver.resolveSchemaProperty(name, key, value.$content)
      })
      .join(', ')
    return `create table \`${ name }\` (${ propertiesDef });`
  }

  static resolveSchemaProperty(
    name: string,
    key: string,
    $content: Model.PropDesc<Model.Prop>['$content']
  ) {
    let def = `\`${ key }\``
    let type = {
      string: 'varchar'
    }[$content.type as string] ?? $content.type
    // set default size when type is string
    if ($content.type === 'string' && $content.size === undefined)
      $content.size = 255
    if ($content.size)
      type += `(${ $content.size })`
    def += ` ${ type }`
    if ($content.notnull)
      def += ' not null'
    if ($content.autoinc) {
      if (!$content.primary)
        throw new Error(`Autoincrement property '${ key }' must be primary`)
      def += ' auto_increment'
    }
    if ($content.unique)
      def += ' unique'
    if ($content.comment)
      def += ` comment '${ $content.comment }'`
    if ($content.primary)
      def += `, constraint ${ name }_pk primary key (${ key })`
    return def
  }

  create(m: Model, conn: Connector) {
    return this.exec(conn, MysqlDriver.resolveSchema(m.name, m.schema))
  }

  static resolveEntities<M extends Model>(entities: Entity<M>[]) {
    const m = entities[0][EntityModelSymbol]
    const keys = Object.keys(m.schema)
    return [
      `insert into \`${ m.name }\` (${
        keys.map(key => `\`${ key }\``).join(', ')
      }) values (${
        entities.map(() => keys.map(() => '?').join(', ')).join('), (')
      });`,
      entities.reduce((acc, e) => acc.concat(keys.map(k => e[k])), [] as any[])
    ]
  }

  insert<M extends Model>(entities: Entity<M>[], conn: Connector) {
    return []
  }

  delete<
    Models extends Model[]
  >(models: Models, query: Engine.Models2Query<Models>, conn: Connector, opts?: Driver.OperateOptions) {
  }

  update<Models extends Model[]>(models: Models, query: Engine.Models2Query<Models>, conn: Connector, opts?: Driver.OperateOptions) {
  }

  upsert<Models extends Model[]>(models: Models, query: Engine.Models2Query<Models>, conn: Connector, opts?: Driver.OperateOptions) {
  }

  search<
    Schemas extends readonly Model.Schema[]
  >(conn: Connector, opts?: Driver.OperateOptions, ...properties: Schemas) {
    return new Selector(async () => [], ...properties)
  }
}

export = MysqlDriver

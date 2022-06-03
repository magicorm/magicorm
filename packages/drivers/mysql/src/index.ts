import { Connection, ConnectionConfig } from 'mysql'
import {
  AbsConnector,
  AbsDriver, createEntity,
  Driver, DuplicatedDatabaseError,
  Engine,
  Entity, EntityModelSymbol,
  Model, OriginModelSymbol,
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
  static Connector = Connector
  constructor(options: Options) {
    super('mysql', options)
  }

  exec<T extends 'ok' | 'row-data' = 'ok'>(conn: Connector, sql: string, values?: any[]) {
    return new Promise<{
      ok: {
        fieldCount: number
        affectedRows: number
        insertId: number
        serverStatus: number
        warningCount: number,
        message: string
        protocol41: boolean
        changedRows: number
      }
      'row-data': any[]
    }[T]>((resolve, reject) => {
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
    const keys = Object.keys(m.schema) as (keyof Entity<M>)[]
    return [
      `insert into \`${ m.name }\` (${
        keys.map(key => `\`${ key as string }\``).join(', ')
      }) values (${
        entities.map(() => keys.map(() => '?').join(', ')).join('), (')
      });`,
      entities.reduce(
        (acc, e) => acc.concat(keys.map(k => e[k])),
        [] as any[]
      )
    ] as const
  }

  async insert<M extends Model>(entities: Entity<M>[], conn: Connector) {
    if (entities.length === 0)
      return []

    const [sql, values] = MysqlDriver.resolveEntities(entities)
    try {
      const okPk = await this.exec(conn, sql, values)
      let id = okPk.insertId
      return entities.map(e => {
        const primaryKey = Object.entries(e[EntityModelSymbol].schema)
          .find(([, value]) => value.$content.primary && value.$content.autoinc)
          ?.shift() as keyof Entity<M>
        if (primaryKey) {
          if (e[primaryKey]) {
            id = e[primaryKey] + 1
          } else {
            e[primaryKey] = id++
          }
        }
        return e
      })
    } catch (e) {
      if (e instanceof Error) {
        if (e.message.startsWith('ER_DUP_ENTRY')) {
          const [, v, k] = /entry (.*) for key '(.+)'/[Symbol.match](e.message) ?? []
          throw new DuplicatedDatabaseError(k, v)
        }
        throw e
      }
      throw e
    }
  }

  static resolveQueryProp(key: string, val: any, options = {
    not: false
  }): [string, any[]] {
    const type = typeof val
    if (['string', 'number'].includes(type))
      return this.resolveQueryProp(key, { $eq: val })
    if (val === null)
      return this.resolveQueryProp(key, { $eq: null })
    if (val instanceof RegExp)
      return this.resolveQueryProp(key, { $regex: val.source })
    const wheres: string[] = []
    const values: any[] = []
    if (type === 'object') {
      const opts = {
        $eq: '=',
        $ne: '!=',
        $gt: '>',
        $gte: '>=',
        $lt: '<',
        $lte: '<=',
        $regex: 'regexp',
        $like: 'like'
      }
      Object.entries(opts)
        .filter(([propKey]) => val[propKey] !== undefined)
        .forEach(([porpKey, opt]) => {
          const prop = val[porpKey]
          const propType = typeof prop
          // resolve operator
          if (prop === null) {
            if (porpKey === '$eq') {
              opt = 'is'
            } else if (porpKey === '$ne') {
              opt = 'is not'
            }
          }
          // resolve value
          if (['string', 'number'].includes(propType)) {
            values.push(prop)
          } else if (prop instanceof Date) {
            values.push(prop.toISOString())
          } else if (prop instanceof RegExp) {
            values.push(prop.source)
          }
          wheres.push(`\`${ key }\`${ options.not ? ' not' : '' } ${ opt } ?`)
        })
      if (val['$not']) {
        return this.resolveQueryProp(key, val['$not'], { not: true })
      }
      return [
        ['', wheres[0]][wheres.length] ?? `(${ wheres.join(' and ') })`,
        values
      ]
    }
    throw new Error(`Unsupported query property type: ${ type }`)
  }

  static resolveQuery<Models extends Model[]>(query: Engine.Models2Query<Models>) {
    const values: any[] = []
    const where: string = Object.entries(query).reduce((acc, [key, val]) => {
      if (val === undefined)
        return acc

      if (['$and', '$or'].includes(key)) {
        if (!Array.isArray(val)) {
          throw new Error(`'${ key }' must be an array`)
        }

        const wheres: string[] = []
        val.forEach(v => {
          const [ _w, _values ] = MysqlDriver.resolveQuery(v)
          values.push(..._values)
          wheres.push(_w)
        })
        return acc.concat([`(${ wheres.join({
          $and: ' and ',
          $or: ' or '
        }[key]) })`])
      }
      if (key === '$not') {
        if (val === undefined)
          return acc
        const [ _w, _values ] = MysqlDriver.resolveQuery(val as any)
        values.push(..._values)
        return acc.concat([`!(${ _w })`])
      }
      const [_w, _values] = MysqlDriver.resolveQueryProp(key, val)
      if (_w.length > 0) {
        values.push(..._values)
        return acc.concat([_w])
      } else {
        return acc
      }
    }, [] as string[]).join(' and ')
    return [where, values] as [string, any[]]
  }

  async delete<
    Models extends Model[]
  >(models: Models, query: Engine.Models2Query<Models>, conn: Connector, opts?: Driver.OperateOptions) {
    const [where, values] = MysqlDriver.resolveQuery(query)
    const tables = models.map(m => `\`${ m.name }\``).join(', ')
    const sql = `delete from ${ tables } where ${ where }`
    const { affectedRows } = await this.exec(conn, sql, values)
    return affectedRows
  }

  update<Models extends Model[]>(models: Models, query: Engine.Models2Query<Models>, conn: Connector, opts?: Driver.OperateOptions) {
  }

  upsert<Models extends Model[]>(models: Models, query: Engine.Models2Query<Models>, conn: Connector, opts?: Driver.OperateOptions) {
  }

  search<
    Schemas extends readonly Model.Schema[]
  >(conn: Connector, opts?: Driver.OperateOptions & {
    offsetLimit?: number
  }, ...properties: Schemas) {
    return new Selector(async sel => {
      const [where, values] = MysqlDriver.resolveQuery(
        sel.queries.length <= 1
          ? sel.queries[0]
          : { $and: sel.queries }
      )
      const tableSet = new Set<Model>()
      properties.forEach(schemaProps => {
        Object.entries(schemaProps).forEach(([_, value]) => {
          const table = value.$content[OriginModelSymbol]
          if (table)
            tableSet.add(table)
        })
      })
      const tables = [...tableSet]

      if (tables.length === 0)
        throw new Error('No table found')

      let sql = `select * from ${ tables.map(t => t.name).join(', ') }`
      if (where.length > 0) {
        sql += ` where ${ where }`
      }
      if (sel.options.limit !== undefined)
        sql += ` limit ${ sel.options.limit }`
      if (sel.options.offset !== undefined) {
        sql += `${
          sel.options.limit !== undefined
            ? ''
            : ` limit ${opts?.offsetLimit ?? 281_474_976_710_655}`
        } offset ${sel.options.offset}`
      }

      sql += ';'
      const rows = await this.exec<'row-data'>(conn, sql, values)
      if (tables.length === 1) {
        const [ t ] = tables
        return rows.map(row => createEntity(t, row))
      } else {
      }
      return []
    }, ...properties)
  }
}

export = MysqlDriver

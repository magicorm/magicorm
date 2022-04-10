import { createDesc, Desc } from './desc'

export class Model<S = Model.Schema> {
  constructor(public schema: S) {
    this.schema = schema
  }
}

export const createModel = <S extends Model.Schema>(schema: S) => {
  return new Model<S>(schema)
}

export const defineProp = <S extends string>(s: S) => {
  const [t, size] = /^(.+)\((.+)\)$/.exec(s) ?? [s, undefined]
  if (!t) throw new Error(`Invalid prop type: ${s}`)

  const desc = createDesc<{
    type: string
    size: number
  }>().type(t)
  if (size && Model.ableConfigSize.includes(t) && !isNaN(Number(size))) {
    desc.size(+size)
  }

  return desc as Model.PropDesc<
    Model.Prop<
      Model.PropTypeWithSize<S>['type']
      >
    >
}

export const dp = defineProp

export namespace Model {
  export type Schema = Record<string, Pick<PropDesc<Prop>, '$content'>>

  export namespace Types {
    export type Number =
      | 'number'
      | 'int'
      | 'integer'
      | 'tinyint'
      | 'smallint'
      | 'mediumint'
      | 'bigint'
      | 'decimal'
      | 'float'
      | 'double'
    export type String =
      | 'string'
      | 'char'
      | 'varchar'
      | 'tinytext'
      | 'text'
      | 'mediumtext'
      | 'longtext'
    export type Date =
      | 'date'
      | 'datetime'
      | 'timestamp'
      | 'time'
      | 'year'
    export type Boolean = 'boolean'
  }

  export const ableConfigSize = [
    // Number
    'number',
    'tinyint',
    'smallint',
    'mediumint',
    'bigint',
    'int',
    'integer',
    'decimal',
    'float',
    'double',
    // String
    'string',
    'char',
    'varchar',
    'tinytext',
    'text',
    'mediumtext',
    'longtext'
  ]

  export type PropDesc<P> = Desc<P, Omit<P, 'type'>>

  export type PropDescType =
    | string
    | Types.Number
    | Types.String
    | Types.Boolean
    | Types.Date

  export type PropDescTypeMap = Record<string, any> & {
    [K in Types.Number]: number
  } & {
    [K in Types.String]: string
  } & {
    [K in Types.Boolean]: boolean
  } & {
    [K in Types.Date]: Date
  }

  export interface Prop<T extends PropDescType = string> {
    type: T
    size: number
    unique: boolean
    default: PropDescTypeMap[T]
    comment: string
    notnull: boolean
    autoinc: boolean
    required: boolean
  }

  export type PropTypeWithSize<T extends string> =
    T extends `${PropDescType}(${ infer Size })`
      ? { type: T; size: Size }
      : { type: T }
}

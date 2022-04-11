import { createDesc, Desc } from './desc'
import { Engine, engines } from './engine'

export class Model<E extends Engine<any> = Engine<any>, S = Model.Schema> {
  constructor(public schema: S, public engine?: E) {
    this.schema = schema
    this.engine = engine
  }
}

export const modelsCache: Model[] = []

export const createModel = <S extends Model.Schema>(schema: S, engine?: Engine<any>) => {
  engine = engine || engines[0]
  const model = new Model(schema, engine)
  if (engine) {
    engine.registerModel(model)
  } else {
    modelsCache.push(model)
  }
  return model
}

export const defineProp = <S extends `${Model.PropDescType}(${number})` | Model.PropDescType>(s: S) => {
  const [, t, , size] = /^(.+?)(\((.+)\))?$/.exec(s) ?? [s, undefined]
  if (!t) throw new Error(`Invalid prop type: "${s}"`)

  const desc = createDesc<{
    type: string
    size: number
  }>().type(t)
  if (size) {
    if (!Model.ableConfigSize.includes(t)) {
      console.warn(`Prop "${s}" has size but type "${t}" is not able to config size.`)
    } else {
      if (isNaN(Number(size)))
        throw new Error(`Invalid prop size: "${s}"`)
      desc.size(+size)
    }
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
    T extends `${infer Type}(${ infer Size })`
      ? { type: Type; size: Size }
      : { type: T }
}

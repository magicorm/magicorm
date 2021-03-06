import { createDesc, Desc } from './desc'
import { Engine, engines } from './engine'

export class Model<E extends Engine<any> = Engine<any>, S extends Model.Schema = Model.Schema>
  extends Function {
  constructor(
    public name: string,
    public schema: S,
    public engine?: E
  ) {
    super()
    this.name = name
    this.schema = this.resolveSchema(schema)
    this.engine = engine
  }
  private resolveSchema(schema: S): S {
    Object.entries(schema).forEach(([_, prop]) => {
      prop.$content[OriginModelSymbol] = this
    })
    return schema
  }
}

export const EntityModelSymbol = Symbol('EntityModel')

export const OriginModelSymbol = Symbol('OriginModel')

export type Entity<M extends Model> = {
  [EntityModelSymbol]: M
} & EntityProperties<M>

export type EntityProperties<M extends Model> = {
  [k in keyof Model.InferSchemaData<M['schema']>]: any
}

export interface EntityConstructor<M extends Model, D = Model.InferSchemaData<M['schema']>>
  extends Model<Exclude<M['engine'], undefined>, M['schema']> {
  [OriginModelSymbol]: M
  new(data: D): Entity<M> & D
}

export const createEntity = (model: Model, data: any) => {
  const entity: Record<string | symbol, any> = {}
  entity[EntityModelSymbol] = model
  return Object.assign(entity, data)
}

export const modelsCache: EntityConstructor<Model>[] = []

export const createModel = <
  E extends Engine<any> = Engine<any>,
  S extends Model.Schema = Model.Schema,
  >(name: string, schema: S, engine?: Engine<any>): EntityConstructor<Model<E, S>> => {
  engine = engine || engines[0]
  const model = new Proxy(new Model(name, schema, engine) as EntityConstructor<Model<E, S>>, {
    get(target, p) {
      if (p === OriginModelSymbol)
        return target
      // @ts-ignore
      return target[p]
    },
    construct(target, [data]) {
      return createEntity(target, data)
    }
  })
  if (engine) {
    engine.registerModel(model)
  } else {
    modelsCache.push(model as EntityConstructor<Model>)
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
  export type InferSchema<M> = M extends Model<any, infer S> ? S : never
  export type GetOptionalKeys<S extends Schema> = {
    [K in keyof S]: S[K]['$content'] extends { primary: true } ? never : K
  }[keyof S]
  export type InferSchemaData<
    S extends Schema,
    OptionalKeys extends keyof S = GetOptionalKeys<S>,
    RequiredKeys extends keyof S = Exclude<keyof S, OptionalKeys>
  > = (
    [OptionalKeys] extends [never]
      ? {}
      : {
        [K in OptionalKeys]?: GetPropKey<S[K], 'default'>
      }
  ) & (
    [RequiredKeys] extends [never]
      ? {}
      : {
        [K in RequiredKeys]: GetPropKey<S[K], 'default'>
      }
  )
  export type GetPropKey<
    P extends Pick<PropDesc<Prop>, '$content'>,
    Key extends keyof P['$content']
  > = Exclude<P['$content'][Key], undefined>
  export type GetPropType<P extends Pick<PropDesc<Prop>, '$content'>> = Exclude<P['$content']['type'], undefined>

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
    primary: boolean
    default: PropDescTypeMap[T]
    comment: string
    notnull: boolean
    autoinc: boolean
    required: boolean
    [OriginModelSymbol]: Model
  }

  export type PropTypeWithSize<T extends string> =
    T extends `${infer Type}(${ infer Size })`
      ? { type: Type; size: Size }
      : { type: T }
}

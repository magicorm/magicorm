import { Entity, Model } from './model'
import { Engine } from './engine'

type U2I<U> = (U extends any ? (k: U) => void : never) extends (k: infer I) => void ? I : never

export type Query<S extends Model.Schema | unknown> = {
  $or?: Query<S>[]
  $and?: Query<S>[]
} & {
  [K in keyof S]?: S[K] extends Pick<Model.PropDesc<Model.Prop>, '$content'>
    ? Model.GetPropType<S[K]> extends infer T
      // @ts-ignore
      ? Model.PropDescTypeMap[T] | Query.Prop<T>
      : never
    : never
}

export namespace Query {
  export type Prop<T extends Model.PropDescType, VT = Model.PropDescTypeMap[T]> = {
    $not?: Prop<T, VT>
  } & (
    T extends Model.Types.String | Model.Types.Number | Model.Types.Date ? {
      $eq?: VT
      $ne?: VT
      $gt?: VT
      $lt?: VT
      $gte?: VT
      $lte?: VT
    } : {}
  ) & (
    T extends Model.Types.String ? {
      $like?: VT
    } : {}
  )
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface Selector<
  Schemas extends readonly Model.Schema[],
  Props = U2I<Schemas[number]>,
  E extends Engine<any> = Engine<any>,
  // @ts-ignore
  _E = Entity<Model<E, Props>>
> extends Promise<_E[]> {
}

export class Selector<
  Schemas extends readonly Model.Schema[],
  Props = U2I<Schemas[number]>,
  E extends Engine<any> = Engine<any>,
  // @ts-ignore
  _E = Entity<Model<E, Props>>
> {
  options: {
    limit?: number;
    offset?: number;
  } = {}
  queries: Query<Props>[] = []
  properties: Model.Schema
  constructor(
    fn?: (sel: Selector<Schemas, Props, E, _E>) => Promise<_E[]>,
    ...schemas: Schemas
  ) {
    this.properties = Object.assign({}, ...schemas)
    return new Proxy(this as this & Promise<_E[]>, {
      get: (target, p: string) => {
        if (['then', 'catch', 'finally'].includes(p)) {
          return (...args: any[]) => Promise.resolve(fn?.(this)).then(...args)
        }
        // @ts-ignore
        return this[p]
      }
    })
  }
  where(...queries: Query<Props>[]) {
    this.queries.push(...queries)
    return this
  }
  limit(limit: number) {
    this.options.limit = limit
    return this
  }
  offset(offset: number) {
    this.options.offset = offset
    return this
  }
}

export namespace Selector {
  export function resolveQueryProp(v: any) {
    switch (typeof v) {
      case 'object':
        return v
      case 'undefined':
        return undefined
      default:
        return { $eq: v }
    }
  }
  export function resolveQuery<S extends Model.Schema, Queries extends readonly Query<S>[]>(queries: Queries): Query<S> {
    type RType = Query<S>
    switch (queries.length) {
      case 0:
        return <RType>{}
      case 1:
        return <RType>Object.entries(queries[0]).reduce((acc: Query<S>, [k, v]) => {
          acc[k as keyof Query<S>] = resolveQueryProp(v)
          return acc
        }, {})
      default:
        return <RType>{
          $or: queries.reduce((acc: Query<Model.Schema>[], query) => {
            return acc.concat(resolveQuery([query]))
          }, [])
        }
    }
  }
}

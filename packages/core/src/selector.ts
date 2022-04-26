import { Model } from './model'

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

export class Selector<
  Schemas extends readonly Model.Schema[], Props = U2I<Schemas[number]>,
> {
  options: {
    limit?: number;
    offset?: number;
  } = {}
  queries: Query<Props>[] = []
  properties = [] as any as Schemas
  constructor(...properties: Schemas) {
    this.properties = properties
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
  export function resolveQuery<S extends Model.Schema, Queries extends readonly Query<S>[]>(s: S, queries: Queries): Query<S> {
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
            return acc.concat(resolveQuery(s, [query]))
          }, [])
        }
    }
  }
}

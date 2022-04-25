import { Model } from './model'

export type Query<S extends Model.Schema | unknown> = {
  $or?: Query<S>[]
  $and?: Query<S>[]
} & S extends unknown
  ? Record<string, any | any[] | Query.Prop<'any'>>
  : {
    [K in keyof S]?: S[K] extends Pick<Model.PropDesc<Model.Prop>, '$content'>
      ? Model.GetPropType<S[K]> extends infer T
        // @ts-ignore
        ? Model.PropDescTypeMap[T] | Model.PropDescTypeMap[T][] | Query.Prop<T>
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

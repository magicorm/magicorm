import { Model } from './model'

export interface Alias<T extends Model.PropDescType> {
  as(alias: string): this
  expr: Query.Prop<T>
}

export type Query<
  T extends Model.PropDescType,
  Props = Query.Prop<T>
> = {
  [K in keyof Props]: (v: Props[K]) => Alias<T>
}

// export const createQuery = <P extends Model.PropDesc<Model.Prop>['$content']>(
//   name: string, prop: P
// ) => {
//   return new Proxy({} as Query<Exclude<P['type'], undefined>>, {
//     get (t, p) {
//       return (...args: any[]) => ({
//       })
//     }
//   })
// }

export namespace Query {
  export type Prop<T extends Model.PropDescType, VT = Model.PropDescTypeMap[T]> = {
  } & (
    T extends Model.Types.String | Model.Types.Number | Model.Types.Date ? {
      eq: VT
      ne: VT
      gt: VT
      lt: VT
      gte: VT
      lte: VT
    } : {}
  ) & (
    T extends Model.Types.String ? {
      like: VT
    } : {}
  )
}

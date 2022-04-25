import { Query } from './query'
import { Model } from './model'

type U2I<U> = (U extends any ? (k: U) => void : never) extends (k: infer I) => void ? I : never;

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

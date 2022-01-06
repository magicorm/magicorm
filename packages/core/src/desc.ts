export type Desc<Options extends Record<string, any>, ROptions = Options> =
  Desc.Prototype<Options> & Desc.Configures<Options, ROptions>

const verifyKeyDefined = (desc: Desc<any>, key: string) => {
  if (desc.$content[key] !== undefined)
    throw new Error(`Property '${key}' is already defined`)
}

export const createConfigure = (desc: Desc<any>, prop: string) => new Proxy(() => {}, {
  get(_, key: string) {
    verifyKeyDefined(desc, key)
    desc.$content[prop] = true
    return desc[key]
  },
  apply(_, __, args) {
    verifyKeyDefined(desc, prop)
    desc.$content[prop] = args[0]
    return desc
  }
})

export const createDesc = <Options extends Record<string, any>>(options?: Partial<Options>) => {
  const desc: Desc<Options> = new Proxy(<Desc<Options>>{
    $content: Object.assign({}, options)
  }, {
    get(target, p: string) {
      if (p.startsWith('$'))
        return target[p]

      return createConfigure(desc, p)
    }
  })
  return desc
}

export namespace Desc {
  export type Prototype<Options extends Record<string, any>> = {
    $content: Partial<Options>
  }
  type CreateDesc<Options, ROptions, K extends keyof ROptions, V> = Desc<
    Omit<Options, K> & { [P in K]: V }, Omit<ROptions, K>
  >
  export type Configure<Options, ROptions, K extends keyof ROptions> = ROptions[K] extends boolean
    ? CreateDesc<Options, ROptions, K, true>
    : <V extends ROptions[K]>(v: V) => CreateDesc<Options, ROptions, K, V>
  export type Configures<Options, ROptions> = {
    [K in keyof ROptions]: Desc.Configure<Options, ROptions, K>
  }
}

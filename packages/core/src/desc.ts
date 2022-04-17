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
    desc.$content[prop] = args[0]
    return desc
  }
})

export const createDesc = <Options extends Record<string | symbol, any>>(options?: Partial<Options>) => {
  const desc: Desc<Options> = new Proxy(<Desc<Options>>{
    $content: Desc.resolveContent(Object.assign({}, options))
  }, {
    get(target, p: string | symbol) {
      if (typeof p === 'symbol' || p.startsWith('$'))
        return target[p]

      return createConfigure(desc, p)
    }
  })
  return desc
}

export namespace Desc {
  const Types = [String, Number, Boolean, Date, RegExp]
  export const resolveContent = <O extends Record<string, any>>(options: O) => {
    for (const key in Object.keys(options)) {
      if (Types.includes(options[key]))
        // @ts-ignore
        options[key] = undefined
    }
    return options
  }

  export type Prototype<Options extends Record<string, any>> = {
    $content: Partial<Options>
  }
  type CreateDesc<Options, ROptions, K extends keyof ROptions, V> = Desc<
    Omit<Options, K> & { [P in K]: V }, Omit<ROptions, K>
  >
  export type Configure<Options, ROptions, K extends keyof ROptions, Prop = ROptions[K]> =
    [Prop] extends [boolean]
      ? CreateDesc<Options, ROptions, K, true>
      : <T extends Prop>(v: T) => CreateDesc<Options, ROptions, K, T>
  export type Configures<Options, ROptions> = {
    [K in keyof ROptions]: ROptions[K] extends abstract new (...args: any) => infer R
      ? Configure<Options, ROptions, K, R>
      : Configure<Options, ROptions, K, ROptions[K]>
  }
}

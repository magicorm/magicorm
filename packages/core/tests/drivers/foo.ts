import { AbsDriver, Driver } from '@magicorm/core'

declare module '@magicorm/core' {
  interface DriverOptionsMap {
    'foo': Options
  }
}

interface Options {
  none: string
}

class FooDriver extends AbsDriver<'foo'> implements Driver<'foo'> {
  constructor(options?: Options) {
    super('foo', options)
  }
}

export = FooDriver

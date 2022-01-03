import MockRequire from 'mock-require'
import { createDriver, createEngine, Driver } from '@magicorm/core'
import { expect } from 'chai'
import './drivers/foo'

describe('Driver', () => {
  it('should resolve right path.', () => {
    // @ts-ignore
    expect(Driver.resolve.bind(null, 1))
      .to.throw('Driver name must be a string')

    let path: string | undefined
    const name = 'foo'
    const paths = [
      `@magicorm/driver-${name}`,
      `magicorm-driver-${name}`
    ]
    while (path = paths.shift()) {
      MockRequire(path, { prototype: 'bar' })
      expect(Driver.resolve(name).prototype).to.equal('bar', `${path} should be resolved`)
      MockRequire.stop(path)
    }

    // @ts-ignore
    expect(Driver.resolve.bind(null, 'foo'))
      .to.throw('Driver foo is not found')
  })
  describe('Foo', () => {
    before(() => {
      MockRequire('@magicorm/driver-foo', require('./drivers/foo'))
    })
    after(() => {
      MockRequire.stop('@magicorm/driver-foo')
    })
    it('should create target driver by driver name.', () => {
      const d = createDriver('foo', { none: 'test' })
      expect(d.options?.none).to.equal('test')
    })
  })
})

describe('Engine', () => {
  before(() => {
    MockRequire('@magicorm/driver-foo', require('./drivers/foo'))
  })
  after(() => {
    MockRequire.stop('@magicorm/driver-foo')
  })

  it('should create Engine.', () => {
    const engine = createEngine({
      driver: 'foo',
      driverOptions: { none: 'none' }
    })

    expect(engine.driver.options?.none).to.equal('none')
  })
})

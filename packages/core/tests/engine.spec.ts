import MockRequire from 'mock-require'
import { createDriver, createEngine, createModel, dp, Driver, engines, modelsCache } from '@magicorm/core'
import { expect } from 'chai'
import FooDriver from './drivers/foo'

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
      MockRequire('@magicorm/driver-foo', FooDriver)
    })
    after(() => {
      MockRequire.stop('@magicorm/driver-foo')
    })
    it('should create target driver by driver name.', () => {
      const d = createDriver('foo', { dbName: 'test' })
      expect(d.options?.dbName).to.equal('test')
    })
  })
})

describe('Engine', () => {
  before(() => {
    MockRequire('@magicorm/driver-foo', FooDriver)
  })
  after(() => {
    MockRequire.stop('@magicorm/driver-foo')
  })

  it('should create Engine.', () => {
    const engine = createEngine({
      driver: 'foo',
      driverOptions: { dbName: 'none' }
    })
    expect(engine.driver.options?.dbName)
      .to.be.equal('none')
    expect(engine.options.m2ddl)
      .to.be.equal('create')
    expect(engines[0])
      .to.be.equal(engine)
  })
  it('should create call `Driver` create method when engine connect.', async () => {
   const User = createModel('user', {
      id: dp('number').primary.unique.autoinc,
      username: dp('string').unique
    })
    const engine = createEngine({
      driver: 'foo',
      driverOptions: { dbName: 'bar' }
    })
    await engine.connect()
    expect(modelsCache.length)
      .to.be.equal(0)
    expect(FooDriver.dbs.get('bar'))
      .to.be.deep.equal({ user: [] })
    expect(User.engine)
      .to.be.equal(engine)
  })
})

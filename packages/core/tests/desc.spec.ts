import { createDesc } from '../src/desc'
import { expect } from 'chai'

describe('Desc', () => {
  it('should configure base type.', () => {
    let desc
    desc = createDesc<{
      foo: string
      fuu: number
    }>().foo('foo').$content
    expect(desc.foo).to.be.eq('foo')
    expect(desc.fuu).to.be.eq(undefined)
    desc = createDesc<{
      foo: string
      fuu: number
    }>().fuu(100).$content
    expect(desc.foo).to.be.eq(undefined)
    expect(desc.fuu).to.be.eq(100)
    desc = createDesc<{
      foo: boolean
    }>().foo.$content
    expect(desc.foo).to.be.eq(true)
  })
  it('should configure by chain.', () => {
    const desc0 = createDesc<{
      foo: string
      fuu: number
    }>().foo('foo').fuu(100).$content
    expect(desc0.foo).to.be.eq('foo')
    expect(desc0.fuu).to.be.eq(100)
    const desc1 = createDesc<{
      foo: boolean
      fuu: number
    }>().foo.fuu(100).$content
    expect(desc1.foo).to.be.eq(true)
    expect(desc1.fuu).to.be.eq(100)
  })
  it('should throw already defined error.', () => {
    try {
      // @ts-ignore
      createDesc<{foo: boolean}>().foo.foo
    } catch (e) {
      // @ts-ignore
      expect(e.message).to.be.eq('Property \'foo\' is already defined')
    }
  })
  it('should reveal default variable.', () => {
    const desc0 = createDesc<{
      foo: string
      fuu: number
    }>({
      foo: 'foo'
    }).fuu(100).$content
    expect(desc0.foo).to.be.eq('foo')
    expect(desc0.fuu).to.be.eq(100)
    const desc1 = createDesc({
      foo: 'foo'
    }).foo('bar').$content
    expect(desc1.foo).to.be.eq('bar')
  })
  it('should create desc by Type Constructor.', () => {
    expect(createDesc({ foo: String }).foo('foo').$content.foo)
      .to.be.eq('foo')
    const desc = createDesc({
      foo: String,
      fuu: Number
    }).foo('foo').fuu(100).$content
    expect(desc.foo).to.be.eq('foo')
    expect(desc.fuu).to.be.eq(100)
  })
})

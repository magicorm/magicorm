import { dp, Selector } from '@magicorm/core'
import { expect } from 'chai'

describe('Selector', function () {
  it('should create selector.', () => {
    const selector = new Selector(undefined, {
      foo: dp('string')
    })
    selector.where({
      foo: {
        $eq: 'bar'
      }
    }).limit(10).offset(10)
    expect(selector.queries[0]).to.be.deep.equal({
      foo: {
        $eq: 'bar'
      }
    })
    expect(selector.options).to.be.deep.equal({
      limit: 10,
      offset: 10
    })
  })
  it('should query multi properties.', () => {
    const selector = new Selector(undefined, {
      foo: dp('string')
    }, {
      bar: dp('number')
    })
    selector.where({
      foo: { $eq: 'bar' },
      bar: { $eq: 2 }
    }, {
      bar: { $eq: 1 }
    })
    expect(selector.queries[0]).to.be.deep.equal({
      foo: { $eq: 'bar' },
      bar: { $eq: 2 }
    })
    expect(selector.queries[1]).to.be.deep.equal({
      bar: { $eq: 1 }
    })
  })
  it('should as promise to run.', async () => {
    let runFn = false
    const sel = new Selector(async () => {
      runFn = true
      return []
    }, {
      foo: dp('int')
    })
    expect(runFn).to.be.false
    await sel
    expect(runFn).to.be.true

    expect(
      await new Selector(async sel => {
        return [sel.queries[0], sel.options.limit, sel.options.offset] as any
      }, {
        foo: dp('int')
      })
        .where({ foo: 1 })
        .limit(2)
        .offset(3)
    ).to.be.deep.equal([{ foo: 1 }, 2, 3])
  })
  it('should resolve queries.', () => {
    const r = Selector.resolveQuery({
      foo: dp('number'),
      bar: dp('string')
    }, [{
      foo: 1
    }, {
      bar: {
        $eq: 'ber'
      }
    }] as const)
    expect(r.$or).to.be.deep.equal([{
      foo: { $eq: 1 }
    }, {
      bar: { $eq: 'ber' }
    }])
  })
})

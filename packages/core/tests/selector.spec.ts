import { dp, Selector } from '@magicorm/core'
import { expect } from 'chai'

describe('Selector', function () {
  it('should create selector.', () => {
    const selector = new Selector({
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

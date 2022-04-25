import { Selector } from '@magicorm/core'
import { expect } from 'chai'

describe('Selector', function () {
  it('should create selector.', () => {
    const selector = new Selector({
      foo: {
        $content: { type: 'string' as const }
      }
    })
    selector.where({
      foo: {
        $eq: 'bar'
      }
    })
    expect(selector.queries[0]).to.deep.equal({
      foo: {
        $eq: 'bar'
      }
    })
  })
})

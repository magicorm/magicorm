import { createModel, dp } from '@magicorm/core'
import { expect } from 'chai'

describe('Model', function () {
  it('should create model with prop.', () => {
    const UModel = createModel({
      id: dp('int'),
      nickname: dp('varchar(72)'),
      username: dp('varchar(72)').unique
    })
    expect(UModel.schema.id.$content.type)
      .to.be.equal('int')
    expect(UModel.schema.id.$content.size)
      .to.be.equal(undefined)
    expect(UModel.schema.nickname.$content.type)
      .to.be.equal('varchar')
    expect(UModel.schema.nickname.$content.size)
      .to.be.equal(72)
    expect(UModel.schema.username.$content.type)
      .to.be.equal('varchar')
    expect(UModel.schema.username.$content.size)
      .to.be.equal(72)
    expect(UModel.schema.username.$content.unique)
      .to.be.equal(true)
  })
  it('should throw error when define prop.', () => {
    expect(dp.bind(null, ''))
      .to.be.throw('Invalid prop type: ""')
    expect(dp.bind(null, 'int(none)'))
      .to.be.throw('Invalid prop size: "int(none)"')
  })
})

import { createModel, dp, EntityModelSymbol, modelsCache, OriginModelSymbol } from '@magicorm/core'
import { expect } from 'chai'

describe('Model', function () {
  it('should create model with prop.', () => {
    const UModel = createModel('User', {
      id: dp('int'),
      nickname: dp('varchar(72)'),
      username: dp('varchar(72)').unique
    })
    expect(UModel.schema.username.$content[OriginModelSymbol])
      .to.be.equal(UModel[OriginModelSymbol])
    expect(UModel.name)
      .to.be.equal('User')
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
    expect(modelsCache[0])
      .to.be.equal(UModel)
    const u0 = new UModel({
      id: 1,
      nickname: 'test',
      username: 'test'
    })
    expect(u0.id)
      .to.be.equal(1)
    expect(u0.nickname)
      .to.be.equal('test')
    expect(u0.username)
      .to.be.equal('test')
  })
  it('should create entity from model.', () => {
    const UModel = createModel('User', {
      id: dp('int').primary,
      nickname: dp('varchar(72)'),
      username: dp('varchar(72)').unique
    })
    const u0 = new UModel({
      nickname: 'test',
      username: 'test'
    })
    expect(u0.id)
      .to.be.equal(undefined)
    expect(u0.nickname)
      .to.be.equal('test')
    expect(u0[EntityModelSymbol])
      .to.be.equal(UModel[OriginModelSymbol])
  })
  it('should throw error when define prop.', () => {
    expect(dp.bind(null, ''))
      .to.be.throw('Invalid prop type: ""')
    expect(dp.bind(null, 'int(none)'))
      .to.be.throw('Invalid prop size: "int(none)"')
  })
})

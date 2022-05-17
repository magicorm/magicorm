import { expect, use } from 'chai'
import cap from 'chai-as-promised'
import { createModel, dp, UnconnectedDatabaseError } from '@magicorm/core'
import MysqlDriver from '@magicorm/driver-mysql'

use(cap)

after(() => {
  process.exit(0)
})

const connectDriver = async () => {
  const driver = new MysqlDriver({
    user: 'root',
    host: 'localhost',
    port: 3306,
    password: 'rYy(sql,1values,;4(err,',
    database: 'magicorm_unit_test'
  })
  const ctor = driver.connect()
  await ctor.onConnect
  return [driver, ctor] as const
}

describe('Mysql', function () {
  const User = createModel('user', {
    id: dp('int').primary.autoinc,
    name: dp('string').notnull.unique,
    age: dp('int').notnull
  })
  it('should connect.', async () => {
    const [driver, ctor] = await connectDriver()
    expect(await driver.exec(ctor, 'select 1 as A'))
      .to.be.deep.equal([{ A: 1 }])
    expect(await driver.exec(ctor, 'select ? as A', [2]))
      .to.be.deep.equal([{ A: 2 }])

    await ctor.close()
    await expect(driver.exec(ctor, 'select ? as A', [2]))
      .to.be.eventually.rejectedWith(UnconnectedDatabaseError)
  })
  it('should create table and drop it.', async () => {
    const [driver, ctor] = await connectDriver()
    driver.create(User, ctor)
  })
  describe('Static', function () {
    it('should generate create table sql.', () => {
      expect(MysqlDriver.resolveSchema(User.name, User.schema))
        .to.be.eq(
          'create table `user` (`id` int auto_increment, constraint user_pk primary key (id), `name` varchar(255) not null, `age` int not null);'
        )
      const Temp0 = createModel('temp', {
        foo: dp('int').primary,
        bar: dp('int').primary
      })
      expect(MysqlDriver.resolveSchema.bind(MysqlDriver, Temp0.name, Temp0.schema))
        .to.be.throw('Primary key \'foo\' is already defined')
      const Temp1 = createModel('temp', {
        foo: dp('int').primary,
        bar: dp('int').autoinc
      })
      expect(MysqlDriver.resolveSchema.bind(MysqlDriver, Temp1.name, Temp1.schema))
        .to.be.throw('Autoincrement property \'bar\' must be primary')
    })
  })
})

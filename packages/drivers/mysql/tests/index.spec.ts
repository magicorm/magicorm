import { expect, use } from 'chai'
import cap from 'chai-as-promised'
import { createModel, dp, UnconnectedDatabaseError } from '@magicorm/core'
import MysqlDriver from '@magicorm/driver-mysql'

use(cap)

after(() => {
  process.exit(0)
})

const driverOptions: ConstructorParameters<typeof MysqlDriver>[0] = {
  user: 'root',
  host: 'localhost',
  port: 3306,
  password: 'rYy(sql,1values,;4(err,',
  database: 'magicorm_unit_test'
}

const connectDriver = async () => {
  const driver = new MysqlDriver(driverOptions)
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
    await driver.create(User, ctor)
    expect(
      await driver.exec(ctor, `select TABLE_NAME from information_schema.TABLES where TABLE_SCHEMA='${ driverOptions.database }';`)
    ).to.be.lengthOf(1)
    await driver.remove(User, ctor)
    expect(
      await driver.exec(ctor, `select TABLE_NAME from information_schema.TABLES where TABLE_SCHEMA='${ driverOptions.database }';`)
    ).to.be.lengthOf(0)
  })
  describe('Static', function () {
    it('should generate create table sql.', () => {
      expect(MysqlDriver.resolveSchema(User.name, User.schema))
        .to.be.eq(
          'create table `user` (`id` int auto_increment, constraint user_pk primary key (id), `name` varchar(255) not null unique, `age` int not null);'
        )
      const Temp00 = createModel('temp', {
        foo: dp('int').primary,
        bar: dp('string').notnull,
        baz: dp('int(10)').unique
      })
      expect(MysqlDriver.resolveSchema(Temp00.name, Temp00.schema))
        .to.be.eq(
        'create table `temp` (`foo` int, constraint temp_pk primary key (foo), `bar` varchar(255) not null, `baz` int(10) unique);'
      )
      const Temp01 = createModel('temp', {
        foo: dp('int').comment('test comment')
      })
      expect(MysqlDriver.resolveSchema(Temp01.name, Temp01.schema))
        .to.be.eq(
        'create table `temp` (`foo` int comment \'test comment\');'
      )
      const Temp10 = createModel('temp', {
        foo: dp('int').primary,
        bar: dp('int').primary
      })
      expect(MysqlDriver.resolveSchema.bind(MysqlDriver, Temp10.name, Temp10.schema))
        .to.be.throw('Primary key \'foo\' is already defined')
      const Temp11 = createModel('temp', {
        foo: dp('int').primary,
        bar: dp('int').autoinc
      })
      expect(MysqlDriver.resolveSchema.bind(MysqlDriver, Temp11.name, Temp11.schema))
        .to.be.throw('Autoincrement property \'bar\' must be primary')
    })
    it('should resolve entities.', () => {
      let [ sql, values ] = MysqlDriver.resolveEntities([
        new User({ id: 1, name: 'foo', age: 10 }),
        new User({ id: 2, name: 'foo', age: 10 })
      ])
      expect(sql)
        .to.be.eq('insert into `user` (`id`, `name`, `age`) values (?, ?, ?), (?, ?, ?);')
      expect(values)
        .to.be.deep.eq([ 1, 'foo', 10, 2, 'foo', 10 ])
      ;[ sql, values ] = MysqlDriver.resolveEntities([
        new User({ name: 'foo', age: 10 }),
        new User({ name: 'foo', age: 10 })
      ])
      expect(sql)
        .to.be.eq('insert into `user` (`id`, `name`, `age`) values (?, ?, ?), (?, ?, ?);')
      expect(values)
        .to.be.deep.eq([ 1, 'foo', 10, 2, 'foo', 10 ])
    })
  })
})

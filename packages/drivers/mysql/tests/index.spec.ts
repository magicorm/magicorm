import { expect, use } from 'chai'
import cap from 'chai-as-promised'
import { UnconnectedDatabaseError } from '@magicorm/core'
import MysqlDriver from '@magicorm/driver-mysql'

use(cap)

after(() => {
  process.exit(0)
})

describe('Mysql', function () {
  it('should connect mysql', async () => {
    const driver = new MysqlDriver({
      user: 'root',
      host: 'localhost',
      port: 3306,
      password: 'rYy(sql,1values,;4(err,',
      database: 'magicorm_unit_test'
    })
    const ctor = driver.connect()
    await ctor.onConnect
    expect(await driver.exec(ctor, 'select 1 as A'))
      .to.be.deep.equal([{ A: 1 }])
    expect(await driver.exec(ctor, 'select ? as A', [2]))
      .to.be.deep.equal([{ A: 2 }])

    await ctor.close()
    await expect(driver.exec(ctor, 'select ? as A', [2]))
      .to.be.eventually.rejectedWith(UnconnectedDatabaseError)
  })
})

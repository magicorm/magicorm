# 保姆级指南

## 安装

## 使用

```ts
import { createEngine, createModel, dp } from 'magicorm'
import '@magicorm/driver-mysql'

const User = createModel({
  id: dp('int')
    .comment('用户 id')
    .primary.notnull.autoinc,
  username: dp('varchar(16)')
    .comment('用户名')
    .unique.notnull,
  nickname: dp('varchar')
    .comment('昵称')
    .notnull
})

const engine = createEngine({
  driver: 'mysql',
  driverOptions: {
    url: 'mysql://root:@localhost/demo'
  }
})

await engine.connect()

const u1 = new User({
  nickname: 'test001',
  username: 'test001'
})

const users0 = engine.exec('search')
  .where([User.nickname.eq('test001'), User.username.eq('test001')])
// user.nickname = 'test001' && user.username = 'test001'

const users1 = engine.exec('search')
  .where(User.nickname.eq('test001'), User.username.eq('test001'))
// user.nickname = 'test001' || user.username = 'test001'

const users2 = engine.exec('search')
  .where(
    User.nickname.eq('test001'), [
      User.username.eq('test002'), User.nickname.eq('test002')
    ]
  )
// user.nickname = 'test001' && (
//   user.username = 'test002' || user.nickname = 'test002'
// )
```

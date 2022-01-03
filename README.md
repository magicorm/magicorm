<h1 align="center">
  <a href="https://nwylzw.github.io/magicorm/">Magic Orm</a>
</h1>

```ts
import { createConn, createModel, defineProp as dp } from 'magicorm'
import '@magicorm/driver-mysql'

const User = createModel({
  id: dp<number>('int')
    .comment('用户 id')
    .primary.notnull.autoinc,
  username: dp<string>('varchar(16)')
    .comment('用户名')
    .unique.notnull,
  nickname: dp<string>('varchar')
    .comment('昵称')
    .notnull
})

createConn('mysql://root:@localhost/demo')
  .then(async conn => {
    new User({
      nickname: 'test001',
      username: 'test001'
    })
    const u2 = new User({
      nickname: 'test002',
      username: 'test002'
    }, false)

    const u = await User.query
      .where(User.id.gte(1))
      .first()

    await u.update({ nickname: 'demo001' })

    u.nickname = 'demo002'
    await u.save()
  })
```

## 目标

兼容 sqlite, mongodb, postgresql, mysql

调用足够简单，使用要符合直觉

目的是给一个统配化的 ORM ，目前想到的应用场景有：

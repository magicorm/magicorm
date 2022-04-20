const path = require('path')

module.exports = {
  extends: '@vuepress/theme-default',
  plugins: [
    ['@vuepress/register-components', {
      components: {}
    }]
  ]
}

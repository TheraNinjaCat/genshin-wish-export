import * as IconComponents from "@element-plus/icons-vue";
const { shell } = require('electron')

const IconInstaller = (app) => {
  Object.values(IconComponents).forEach(component => {
    app.component(component.name, component)
  })
}

const openLink = (link) => shell.openExternal(link)

export {
  IconInstaller
}
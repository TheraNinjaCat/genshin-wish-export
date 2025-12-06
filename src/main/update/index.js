const { app, ipcMain, shell } = require('electron')
const fetch = require('electron-fetch').default
const semver = require('semver')
const util = require('util')
const path = require('path')
const OriginalFs = require('original-fs')
const fs = require('fs-extra')
const AdmZip = require('adm-zip')
const { version } = require('../../../package.json')
const { hash, sendMsg, userPath } = require('../utils')
const config = require('../config')
const i18n = require('../i18n')

async function download(url) {
  return fetch(url).then((response) => {
      if (!response.ok) throw new Error(`Unexpected response ${response.statusText}`);
      return response.arrayBuffer()
    })
    .then((body) => {
      return Buffer.from(body)
    })
}

const updateInfo = {
  status: 'init',
  error: null
}

const updateURL = `${process.npm_package_homepage}/releases/latest`
const patchURL = `${updateURL}/download`
const isDev = !app.isPackaged
const appPath = isDev ? path.resolve(__dirname, '../../', 'update-dev/app.asar'): app.getAppPath()
const updatePath = isDev ? path.resolve(__dirname, '../../', 'update-dev/download') : path.resolve(userPath, 'update')

const update = async () => {
  if (isDev) {updateInfo.status = 'dev'; return}
  try {
    const res = await fetch(`${patchURL}/manifest.json?t=${Math.floor(Date.now() / (1000 * 60 * 10))}`)
    if (res.status !== 200) throw new Error(`Update manifest error: HTTP ${res.status}`)
    const data = await res.json()
    if (!data.active) return
    if (semver.gt(data.version, version) && semver.gte(version, data.from)) {
      if (!config.autoUpdate) {
        updateInfo.status = 'available'
        return
      }
      try { // Exit if unable to write to appPath
        OriginalFs.accessSync(appPath, fs.constants.W_OK)
      } catch (err) {
        updateInfo.status = 'available'
        return
      }

      await fs.ensureDir(updatePath)
      await fs.emptyDir(updatePath)
      const filePath = path.join(updatePath, data.name)
      updateInfo.status = 'downloading'
      const zipBuffer = await download(`${patchURL}/${data.name}`)
      const sha256 = hash(zipBuffer)
      if (sha256 !== data.hash) return
      const zip = AdmZip(zipBuffer, { fs: OriginalFs })
      if (!zip.getEntry("app.asar")) throw new Error(`Invalid update zip: no app.asar`)
      zip.extractEntryTo("app.asar", updatePath, false, true, false)

      const asarPath = path.resolve(updatePath, 'app.asar')
      OriginalFs.chmodSync(asarPath, '644')

      updateInfo.status = 'moving'
      OriginalFs.rmSync(appPath)
      OriginalFs.copyFileSync(asarPath, appPath)
      OriginalFs.rmSync(asarPath)
      updateInfo.status = 'finished'
    }
    updateInfo.status = 'latest'
  } catch (err) {
    updateInfo.status = 'failed'
    updateInfo.error = err
  }
}

ipcMain.handle('CHECK_UPDATE', async () => {
  await update()
  if (updateInfo.error) sendMsg(updateInfo.error, 'ERROR')
  return updateInfo.status
})

ipcMain.handle('OPEN_DOWNLOAD', async () => {
  shell.openExternal(updateURL)
})

const getUpdateInfo = () => updateInfo

exports.getUpdateInfo = getUpdateInfo


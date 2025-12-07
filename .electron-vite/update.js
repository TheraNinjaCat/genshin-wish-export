const fs = require('fs-extra')
const path = require('path')
const crypto = require('crypto')
const AdmZip = require('adm-zip')
const { version } = require('../package.json')

const hash = (data, type = 'sha256') => {
  const hmac = crypto.createHmac(type, 'hk4e')
  hmac.update(data)
  return hmac.digest('hex')
}

const createZip = (filePath, dest) => {
  const zip = new AdmZip()
  zip.addLocalFile(filePath)
  zip.toBuffer()
  zip.writeZip(dest)
}

const start = async () => {
  const appPath = `./build/win-unpacked/resources/app.asar`
  const name = 'app.zip'
  const outputPath = path.resolve('./build/win')
  const zipPath = path.resolve(outputPath, name)
  await fs.ensureDir(outputPath)
  createZip(appPath, zipPath)
  const buffer = await fs.readFile(zipPath)
  const sha256 = hash(buffer)
  const hashName = sha256.slice(7, 12)
  await fs.copy(zipPath, path.resolve(outputPath, `${hashName}.zip`))
  await fs.remove(zipPath)
  await fs.outputJSON(path.join(outputPath, 'manifest.json'), {
    active: true,
    version,
    from: '0.1.5',
    name: `${hashName}.zip`,
    hash: sha256
  })
}

start()
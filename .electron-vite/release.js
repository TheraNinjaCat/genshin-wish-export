const fs = require('fs-extra')
const path = require('path')
const glob = require('glob')
const { version } = require('../package.json')
let patchZip
try {
  let { name } = require('../build/manifest.json')
  patchZip = name
} catch (e) {}

const releaseFiles = {
  'win': [
    {
      buildName: `Genshin Wish Export-${version}-win.zip`,
      releaseName: 'Genshin-Wish-Export.zip'
    },
    {
      buildName: `Genshin-Wish-Export-${version}-win.exe`,
      releaseName: 'Genshin-Wish-Export.exe'
    },
    {
      buildName: 'manifest.json',
      releaseName: 'manifest.json'
    },
    {
      buildName: patchZip,
      releaseName: patchZip
    }
  ],
  'linux': [
    {
      buildName: `Genshin Wish Export-${version}-linux.tar.gz`,
      releaseName: 'Genshin-Wish-Export.tar.gz'
    },
    {
      buildName: `Genshin-Wish-Export-${version}-linux.pacman`,
      releaseName: 'Genshin-Wish-Export.pacman'
    },
    {
      buildName: `Genshin-Wish-Export-${version}-linux.deb`,
      releaseName: 'Genshin-Wish-Export.deb'
    }
  ]
}

const start = async () => {
  let target = 'win'
  if (process.argv[2] === 'linux') target = 'linux'
  const releaseDir = path.resolve('./build', target)
  await fs.ensureDir(releaseDir)
  for (const file of releaseFiles[target]) {
    const src = path.resolve('./build', file.buildName)
    const dest = path.resolve(releaseDir, file.releaseName)
    await fs.move(src, dest)
  }
}

start()
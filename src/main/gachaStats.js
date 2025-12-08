const { initLookupTable, saveLookupTable, getItemId } = require('./UIGFApi.js')

const stndBannerChars = new Map([
    ['10000003', new Date('2020-09-28T10:00+08:00')], // Version 1.0, Jean
    ['10000016', new Date('2020-09-28T10:00+08:00')], // Version 1.0, Diluc
    ['10000035', new Date('2020-09-28T10:00+08:00')], // Version 1.0, Qiqi
    ['10000041', new Date('2020-09-28T10:00+08:00')], // Version 1.0, Mona
    ['10000042', new Date('2020-09-28T10:00+08:00')], // Version 1.0, Keqing
    ['10000069', new Date('2022-09-28T07:00+08:00')], // Version 3.1, Tighnari
    ['10000079', new Date('2023-04-12T07:00+08:00')], // Version 3.6, Dehya
    ['10000109', new Date('2025-03-26T07:00+08:00')] // Version 5.5, Yumemizuki Mizuki
])

const capturingRadianceStartDate = new Date("2024-08-28T11:00+08:00")

const weaponTypeNames = new Set([
  '武器', 'Weapon', '무기', 'Arma', 'Arme', 'Оружие', 'อาวุธ', 'Vũ Khí', 'Waffe', 'Senjata'
])

const characterTypeNames = new Set([
  '角色', 'Character', '캐릭터', 'キャラクター', 'Personaje', 'Personnage', 'Персонажи', 'ตัวละคร', 'Nhân Vật', 'Figur', 'Karakter', 'Personagem'
])

const cosmeticCatNames = new Set([
  '装扮形录', 'Cosmetic Catalog'
])

const cosmeticSetNames = new Set([
  '装扮套装', 'Cosmetic Set'
])

const cosmeticComNames = new Set([
  '装扮部件', 'Cosmetic Component'
])

const expressionNames = new Set([
  '互动表情', 'Interactive Expressions'
])

const actionNames = new Set([
  '互动动作', 'Interactive Actions'
])

const isCharacter = (name) => characterTypeNames.has(name)
const isWeapon = (name) => weaponTypeNames.has(name)
const isCosmeticCat = (name)=> cosmeticCatNames.has(name)
const isCosmeticSet = (name)=> cosmeticSetNames.has(name)
const isCosmeticCom = (name)=> cosmeticComNames.has(name)
const isExpression = (name)=> expressionNames.has(name)
const isAction = (name)=> actionNames.has(name)

const itemCount = (map, name) => {
  if (!map.has(name)) {
    map.set(name, 1)
  } else {
    map.set(name, map.get(name) + 1)
  }
}

// TODO: allow capturingRadiance to survive if uigf api is down/not working nicely, perhaps store all std banner chars separately and ship funciton for them?
const gachaStats = async(gacha, lang) => {
    await initLookupTable()
    const stats = new Map()
    for (const [gachaType, gachaLog] of gacha) {
        let gachaDetail = {
            count2: 0, count3: 0, count4: 0, count5: 0, // Totals count
            count3weap: 0, count4weap: 0, count5weap: 0, // 3*, 4*, 5* Weapons
            count4char: 0, count5char: 0, // 4*, 5* Characters
            count2ccat: 0, count3ccat: 0, count4ccat: 0, // 2*, 3*, 4* Cosmetic Catalog
            count4cset: 0, count5cset: 0, // 4*, 5* Cosmetic Set
            count3ccom: 0, // 3* Cosmetic Component
            count3exp: 0, // 3* Interactive Expressions
            count3act: 0, // 3* Interactive Actions
            weapon3: new Map(), weapon4: new Map(), weapon5: new Map(),
            char4: new Map(), char5: new Map(),
            cosmeticCat2: new Map(), cosmeticCat3: new Map(), cosmeticCat4: new Map(),
            cosmeticSet4: new Map(), cosmeticSet5: new Map(),
            cosmeticCom3: new Map(),
            expressions3: new Map(),
            actions3: new Map(),
            date: [],
            ssrPos: [], countMio: 0, total: gachaLog.length,
            capturingRadiance: gachaType === '301' ? 1 : undefined
        }
        let lastSSR = 0
        let dateMin = Infinity
        let dateMax = 0
        const calculateCapturingRadiance = capturingRadianceFunction(lang)
        for (let index = 0; index < gachaLog.length; index++) {
            const [time, name, type, rank, wishType] = gachaLog[index]
            const timestamp = new Date(time).getTime()
            dateMin = Math.min(timestamp, dateMin)
            dateMax = Math.max(timestamp, dateMax)
            if (rank === 2) {
                gachaDetail.count2++
                gachaDetail.countMio++
                if (isCosmeticCat(type)) {
                    gachaDetail.count2ccat++
                    itemCount(gachaDetail.cosmeticCat2, name)
                }
            } else if (rank === 3) {
                gachaDetail.count3++
                gachaDetail.countMio++
                if (isWeapon(type)) {
                    gachaDetail.count3weap++
                    itemCount(gachaDetail.weapon3, name)
                } else if (isCosmeticCat(type)) {
                    gachaDetail.count3ccat++
                    itemCount(gachaDetail.cosmeticCat3, name)
                } else if (isCosmeticCom(type)) {
                    gachaDetail.count3ccom++
                    itemCount(gachaDetail.cosmeticCom3, name)
                } else if (isExpression(type)) {
                    gachaDetail.count3exp++
                    itemCount(gachaDetail.expressions3, name)
                } else if (isAction(type)) {
                    gachaDetail.count3act++
                    itemCount(gachaDetail.actions3, name)
                }
            } else if (rank === 4) {
                if (gachaType === '1000') {
                    gachaDetail.ssrPos.push([
                        name,
                        index + 1 - lastSSR,
                        time,
                        wishType
                    ])
                    lastSSR = index + 1
                    gachaDetail.count4++
                    gachaDetail.countMio = 0
                } else {
                    gachaDetail.count4++
                    gachaDetail.countMio++
                }
                if (isWeapon(type)) {
                    gachaDetail.count4weap++
                    itemCount(gachaDetail.weapon4, name)
                } else if (isCharacter(type)) {
                    gachaDetail.count4char++
                    itemCount(gachaDetail.char4, name)
                } else if (isCosmeticCat(type)) {
                    gachaDetail.count4ccat++
                    itemCount(gachaDetail.cosmeticCat4, name)
                } else if (isCosmeticSet(type)) {
                    gachaDetail.count4cset++
                    itemCount(gachaDetail.cosmeticSet4, name)
                }
            } else if (rank === 5) {
                if (gachaType === '301') {
                    gachaDetail.capturingRadiance = await calculateCapturingRadiance(time, name)
                }
                gachaDetail.ssrPos.push([
                    name,
                    index + 1 - lastSSR,
                    time,
                    wishType
                ])
                lastSSR = index + 1
                gachaDetail.count5++
                gachaDetail.countMio = 0
                if (isWeapon(type)) {
                    gachaDetail.count5weap++
                    itemCount(gachaDetail.weapon5, name)
                } else if (isCharacter(type)) {
                    gachaDetail.count5char++
                    itemCount(gachaDetail.char5, name)
                }else if (isCosmeticSet(type)) {
                    detail.count5cset++
                    itemCount(detail.cosmeticSet5, name)
                }
            }
        }
        gachaDetail.date = [dateMin, dateMax]
        if (gachaDetail.total > 0) stats.set(gachaType, gachaDetail)
    }
    await saveLookupTable()
    return stats
}

const capturingRadianceFunction = (lang) => {
    let counter = 1
    let guarantee = 0
    return async (time, name) => {
        const itemDate = new Date(time)
        const itemId = await(getItemId(lang, name))
        const isStandardCharacter = stndBannerChars.get(itemId) < itemDate
        if (isStandardCharacter) {
            // Lost 50/50, set guarantee, and increment radiance counter
            guarantee = 1
            if (itemDate > capturingRadianceStartDate) {
                counter = Math.min(3, counter + 1)
            }
        } else { // Limited Character
            if (guarantee) {
                // Guarantee, no change to radiance counter
            } else {
                // Won 50/50, reset/decrement radiance counter
                if (itemDate > capturingRadianceStartDate) {
                    counter = counter > 1 ? 1 : 0
                }
            }
            guarantee = 0
        }
        return counter
    }
}

module.exports = { gachaStats }
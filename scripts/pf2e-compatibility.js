// https://gitlab.com/hooking/foundry-vtt---pathfinder-2e/-/blob/master/src/module/actor/sheet/base.ts#L1048
import { whisperToSelfIfCtrlIsHeld } from './keybindings.js'
import { createFakeMouseEvent } from './create-fake-mouse-event.js'

export const pf2eInitializeDummyActor = async (compendiumRollActor) => {
  // setting to Level 0, for total Trained modifier of +2.  (-2 is no longer possible)
  await compendiumRollActor.update({ data: { details: { level: { value: 0 } } } })
  await createSpellcastingEntry(compendiumRollActor)
  return compendiumRollActor
}

const createSpellcastingEntry = (compendiumRollActor) => {
  const spellcastingType = 'innate'
  const tradition = 'arcane'
  const ability = 'int'
  const flexible = false

  // note:  an old "(Quick Roll To Chat; Spellcasting)" may exist, but I don't think anyone minds
  const name = '(Quick Send To Chat; Spellcasting)'

  // Define new spellcasting entry
  const spellcastingEntry = {
    ability: { value: ability },
    spelldc: { value: 0, dc: 0, mod: 0 },
    tradition: { value: tradition },
    prepared: { value: spellcastingType, flexible: flexible ?? undefined },
    showUnpreparedSpells: { value: true },
  }

  const data = {
    name,
    type: 'spellcastingEntry',
    data: spellcastingEntry,
  }

  return compendiumRollActor.createEmbeddedDocuments('Item', [data])
}

const getSpellcasting = (actor, dummyActor) => {
  const existingSpellcasting = actor.spellcasting.filter(sc => sc)[0]
  if (existingSpellcasting) return existingSpellcasting
  else return dummyActor?.spellcasting.getName('(Quick Send To Chat; Spellcasting)')
}

/**
 * KNOWN BUG:  Casting spells with "variants" (e.g. Acid Splash, Heal) will not show buttons.
 * https://github.com/foundryvtt/pf2e/issues/3382
 *
 * KNOWN BUG: heightening no longer works
 */
export const pf2eCastSpell = async (item, actor, dummyActor) => {
  const spellcasting = getSpellcasting(actor, dummyActor)
  Object.defineProperty(item, 'spellcasting', {
    value: spellcasting,
    configurable: true,
  })
  const shiftPressed = game.keyboard.isModifierActive(KeyboardManager.MODIFIER_KEYS.SHIFT)
  const overrideSpellLevel = shiftPressed ? await upcastSpellLevel(item) : undefined

  const originalAutoHeightenLevel = item.system.location.autoHeightenLevel
  item.system.location.autoHeightenLevel = overrideSpellLevel || originalAutoHeightenLevel
  item.isFromConsumable = true // to make it embed data
  const fakeMouseEvent = createFakeMouseEvent()
  const chatMessage = await item.toMessage(fakeMouseEvent, { create: false, data: { spellLvl: overrideSpellLevel } })

  const dataItemId = `data-item-id="${item.id}"`
  item.system.location.value = spellcasting.id
  const dataEmbeddedItem = `data-embedded-item="${escapeHtml(JSON.stringify(item.toObject(false)))}"`
  chatMessage.content = chatMessage.content.replace(dataItemId, `${dataItemId} ${dataEmbeddedItem}`)

  return ChatMessage.create(chatMessage)
}

export const pf2eItemToMessage = async (item) => {
  const originalItemDataType = item.type
  if (['ancestry', 'background', 'class', 'deity'].includes(originalItemDataType)) {
    item.type = 'feat'
  }
  const fakeMouseEvent = createFakeMouseEvent()
  const chatMessage = await item.toMessage(fakeMouseEvent)
  item.type = originalItemDataType // undo change

  if (['effect', 'condition'].includes(originalItemDataType) && !!item.sourceId) {
    // add an extra chat message for draggable effects
    // e.g. @UUID[Actor.mcnoyziJ3Je4nVoU.Item.3UpSQ68WFokLJ8kh]{Effect: Inspiring Presence}
    // or @UUID[Compendium.pf2e.bestiary-effects.wX9L6fbqVMLP05hn]{Effect: Stench}
    let contentStr = item.link
    if (originalItemDataType === 'condition') {
      // add condition value to this draggable, because it will actually apply the same condition number (e.g. Sickened 5)
      const valueNum = item.value
      if (valueNum) {
        contentStr = contentStr.replace('}', ` ${valueNum}}`)
      }
    }
    await ChatMessage.create({
      ...whisperToSelfIfCtrlIsHeld(),
      user: game.user.id,
      speaker: { user: game.user, alias: `Draggable ${originalItemDataType}:` },
      content: contentStr,
    })
  }

  return chatMessage
}

function escapeHtml (string) {
  const replacements = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    '\'': '&#39;',
    '/': '&#x2F;',
    '`': '&#x60;',
    '=': '&#x3D;',
  }
  return String(string).replace(/[&<>"'`=\/]/g, function (s) {
    return replacements[s]
  })
}

const upcastSpellLevel = async (item) => {
  let content = `
<div>
    <div class="form-group">
        <select id="selectedLevel">`
  for (const spellLevel of [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]) {
    if (spellLevel === item.level) {
      content += `<option value="${spellLevel}" selected>
${spellLevel}${th(spellLevel)} Level (Base)
</option>`
    } else if (spellLevel > item.level) {
      content += `<option value="${spellLevel}">
${spellLevel}${th(spellLevel)} Level (+${spellLevel - item.level})
</option>`
    }
  }
  content += `</select>
    </div>
</div>`

  return new Promise((resolve, reject) => {
    new Dialog({
      title: `Upcast ${item.name}`,
      content: content,
      buttons: {
        cast: {
          label: 'Cast',
          callback: html => {
            const spellLevel = parseInt(html.find('#selectedLevel')[0].value)
            resolve(spellLevel)
          },
        },
        cancel: {
          label: 'Cancel',
          callback: () => {
            reject()
          },
        },
      },
      default: 'cancel',
    }).render(true)
  })
}

const th = (num) => {
  if (num % 10 === 1 && num % 100 !== 11) {
    return 'st'
  } else if (num % 10 === 2 && num % 100 !== 12) {
    return 'nd'
  } else if (num % 10 === 3 && num % 100 !== 13) {
    return 'rd'
  } else {
    return 'th'
  }
}

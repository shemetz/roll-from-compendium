// https://gitlab.com/hooking/foundry-vtt---pathfinder-2e/-/blob/master/src/module/actor/sheet/base.ts#L1048
export const pf2eInitializeDummyActor = async (compendiumRollActor) => {
  // setting to Level -2, for total Trained modifier of +0
  await compendiumRollActor.update({ data: { details: { level: { value: -2 } } } })
  await createSpellcastingEntry(compendiumRollActor)
  return compendiumRollActor
}

const createSpellcastingEntry = (compendiumRollActor) => {
  const spellcastingType = 'innate'
  const tradition = 'arcane'
  const ability = 'int'
  const flexible = false

  const name = '(Compendium Roll Spellcasting)'

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
  else return dummyActor.spellcasting.getName('(Compendium Roll Spellcasting)')
}

export const pf2eCastSpell = (item, actor, dummyActor) => {
  const spellcasting = getSpellcasting(actor, dummyActor)
  Object.defineProperty(item, 'spellcasting', {
    value: spellcasting,
    configurable: true,
  })
  return item.toMessage(undefined, { create: false }).then(async chatMessage => {
    const dataItemId = `data-item-id="${item.id}"`
    item.data.data.location.value = spellcasting.id
    const dataEmbeddedItem = `data-embedded-item="${escapeHtml(JSON.stringify(item.toObject(false)))}"`
    const editedContent = chatMessage.data.content.replace(dataItemId, `${dataItemId} ${dataEmbeddedItem}`)
    await chatMessage.data.update({ content: editedContent })
    return ChatMessage.create(chatMessage.data)
  })
}

export const pf2eItemToMessage = (item) => {
  const originalItemDataType = item.data.type
  if (['ancestry', 'background', 'class'].includes(originalItemDataType)) {
    item.data.type = 'feat'
  }
  return item.toMessage().then(async chatMessage => {
    item.data.type = originalItemDataType
    return chatMessage
  })
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

import { DUMMY_ACTOR_NAME } from './consts.js'

export const dnd5eRollItem = (item, actor, actorHasItem) => {
  if (item.system?.preparation?.mode !== undefined && !actorHasItem) {
    // setting preparation mode to innate so that it doesn't try to consume slots
    // (this also prevents upcasting, but that's okay for most use cases anyways)
    item.system.preparation.mode = 'innate'
  }
  if (!actorHasItem && item.system?.save?.ability) {
    // adding a saving throw DC to spells rolled from a compendium
    const dc = getProperty(actor.data, 'data.attributes.spelldc')
    if (!item.system?.save?.dc)
      item.system.save.dc = dc
    if (item.labels?.save && item.labels.save.includes('DC  '))
      item.labels.save = item.labels.save.replace('DC  ', `DC ${dc} `)
  }
  if (!event?.altKey && window.BetterRolls) {
    const customRollItem = BetterRolls.rollItem(item, { event: event, preset: 0 })
    customRollItem.consumeCharge = () => Promise.resolve(true)
    return customRollItem.toMessage()
  }
  return item.use().then(chatDataOrMessage => {
    if (!chatDataOrMessage) return chatDataOrMessage
    // embed the item data in the chat message
    chatDataOrMessage.setFlag('dnd5e', 'itemData', item.toObject(false))
    return chatDataOrMessage
  })
}

export const dnd5eInitializeDummyActor = async (compendiumRollActor) => {
  await compendiumRollActor.update({
    // Level 0
    'data.details.level.value': 0,
    // 999/999 hp
    'data.attributes.hp.max': 999,
    'data.attributes.hp.value': 999,
    // 0/1 spell slots of each level (users must toggle "consume spell slot" off each time)
    'data.spells.spell1.override': 1,
    'data.spells.spell1.value': 0,
    'data.spells.spell2.override': 1,
    'data.spells.spell2.value': 0,
    'data.spells.spell3.override': 1,
    'data.spells.spell3.value': 0,
    'data.spells.spell4.override': 1,
    'data.spells.spell4.value': 0,
    'data.spells.spell5.override': 1,
    'data.spells.spell5.value': 0,
    'data.spells.spell6.override': 1,
    'data.spells.spell6.value': 0,
    'data.spells.spell7.override': 1,
    'data.spells.spell7.value': 0,
    'data.spells.spell8.override': 1,
    'data.spells.spell8.value': 0,
    'data.spells.spell9.override': 1,
    'data.spells.spell9.value': 0,
  })
  return compendiumRollActor
}

export const abilityUseRenderHook = (app, html, data) => {
  if (app.item?.actor?.name !== DUMMY_ACTOR_NAME) return

  // Ensure no spell slots are disabled
  const options = html[0].querySelectorAll('[name="consumeSpellLevel"] option')
  options.forEach(o => o.disabled = false)

  // Uncheck consume spell slots
  const consumeSpellSlot = html[0].querySelector('[name="consumeSpellSlot"]')
  if (consumeSpellSlot) consumeSpellSlot.checked = false

  // Replace error with quick roll message
  const message = 'Quick Roll To Chat: no real slots will be used'
  let error = html[0].querySelector('.notification.error')
  if (!error) {
    error = document.createElement('p')
    error.classList.add('notification', 'error')
    const insertPoint = html[0].querySelector('.form-group')
    insertPoint.insertAdjacentElement('beforestart', error)
  }
  error.innerText = message
}
export const abilityUseQuickCastingHook = (item, config, options) => {
  if (item.actor?.name === DUMMY_ACTOR_NAME) {
    config.consumeSpellSlot = false
  }
}

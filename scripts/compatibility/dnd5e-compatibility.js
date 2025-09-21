import { DUMMY_ACTOR_NAME } from '../consts.js'
import { createFakeMouseEvent } from '../create-fake-mouse-event.js'

const { KeyboardManager } = foundry.helpers.interaction

export const dnd5eRollItem = (item, actor, actorHasItem) => {
  if (item.system?.preparation?.mode !== undefined && !actorHasItem) {
    // setting preparation mode to innate so that it doesn't try to consume slots
    // (this also prevents upcasting, but that's okay for most use cases anyway)
    item.system.preparation.mode = 'innate'
  }
  if (actor && !actorHasItem && item.system?.save?.ability) {
    // adding a saving throw DC to spells rolled from a compendium
    const dc = getProperty(actor.data, 'data.attributes.spelldc')
    if (!item.system?.save?.dc)
      item.system.save.dc = dc
    if (item.labels?.save && item.labels.save.includes('DC  '))
      item.labels.save = item.labels.save.replace('DC  ', `DC ${dc} `)
  }
  if (!game.keyboard.isModifierActive(KeyboardManager.MODIFIER_KEYS.ALT) && window.BetterRolls) {
    const customRollItem = BetterRolls.rollItem(item, { event: event, preset: 0 })
    customRollItem.consumeCharge = () => Promise.resolve(true)
    const fakeMouseEvent = createFakeMouseEvent()
    return customRollItem.toMessage(fakeMouseEvent)
  }
  return item.use().then(chatDataOrMessage => {
    const message = chatDataOrMessage?.message ?? chatDataOrMessage
    if (!message) return message
    // embed the item data in the chat message
    message.setFlag('dnd5e', 'itemData', item.toObject(false))
    return message
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

const abilityUseRenderHook = (app, html, _data) => {
  // if it's the dummy actor or if the item doesn't belong to the actor - avoid consuming resources and allow upcasting
  if (app.item?.actor?.name !== DUMMY_ACTOR_NAME && app.item?.clone_prevDefinitions === undefined) {
    return
  }
  // Uncheck consume spell slots, usage, etc
  for (const consumeString of [
    'consumeQuantity',
    'consumeRecharge',
    'consumeResource',
    'consumeSpellLevel',
    'consumeSpellSlot',
    'consumeUsage',
  ]) {
    const consumeElem = html[0].querySelector(`[name="${consumeString}"]`)
    if (consumeElem) {
      consumeElem.checked = false
    }
  }
  // Ensure all spell slots of the actor are enabled (will be up to 9th level spells, for dummy)
  const options = html[0].querySelectorAll('[name="consumeSpellLevel"] option')
  options?.forEach(o => o.disabled = false)
  // delete "You have no available Nth Level spell slots with which to cast S"
  const errorNode = html[0].querySelector(`.notification.error`)
  if (errorNode?.textContent.includes('no available')) {
    errorNode?.remove()
  }
}

const abilityPreUseItemHook = (item, config, _options) => {
  if (item.actor?.name === DUMMY_ACTOR_NAME) {
    config.consumeQuantity = false
    config.consumeRecharge = false
    config.consumeResource = false
    config.consumeSpellLevel = null
    config.consumeSpellSlot = false
    config.consumeUsage = false
  }
  if (!!item.pack) {
    // items from packs should never reduce any resource, except spell slots
    config.consumeQuantity = false
    config.consumeRecharge = false
    config.consumeResource = false
    config.consumeUsage = false
  }
  if (config.needsConfiguration) {
    // recalculate config.needsConfiguration after the changes
    config.needsConfiguration = config.createMeasuredTemplate
      || config.consumeRecharge
      || config.consumeResource
      || config.consumeSpellSlot
      || config.consumeUsage
  }
}

Hooks.once('setup', function () {
  if (game?.dnd5e?.applications?.item?.AbilityUseDialog?._getSpellData) {
    Hooks.on('renderAbilityUseDialog', abilityUseRenderHook)
    Hooks.on('dnd5e.preUseItem', abilityPreUseItemHook)
  }
});

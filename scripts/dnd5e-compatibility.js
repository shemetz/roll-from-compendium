export const dnd5eRollItem = (item, actor, actorHasItem) => {
  if (item.data?.data?.preparation?.mode !== undefined && !actorHasItem) {
    // setting preparation mode to innate so that it doesn't try to consume slots
    // (this also prevents upcasting, but that's okay for most use cases anyways)
    item.data.data.preparation.mode = 'innate'
  }
  if (!actorHasItem && item.data?.data?.save?.ability) {
    // adding a saving throw DC to spells rolled from a compendium
    const dc = getProperty(actor.data, 'data.attributes.spelldc')
    if (!item.data?.data?.save?.dc)
      item.data.data.save.dc = dc
    if (item.labels?.save && item.labels.save.includes('DC  '))
      item.labels.save = item.labels.save.replace('DC  ', `DC ${dc} `)
  }
  if (!event.altKey && window.BetterRolls) {
    const customRollItem = BetterRolls.rollItem(item, { event: event, preset: 0 })
    customRollItem.consumeCharge = () => Promise.resolve(true)
    return customRollItem.toMessage()
  }
  return item.roll().then(chatDataOrMessage => {
    if (!chatDataOrMessage) return chatDataOrMessage
    // embed the item data in the chat message
    chatDataOrMessage.setFlag('dnd5e', 'itemData', item.data)
    return chatDataOrMessage
  })
}
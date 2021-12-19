import { rollFromCompendium, rollItem } from './roll-from-compendium.js'
import { MODULE_ID } from './hooks.js'

export function _getHeaderButtons__Item_Override (wrapped) {
  const buttons = wrapped.bind(this)()
  const setting = game.settings.get(MODULE_ID, 'window-header-button')
  if (setting === 'Hide') return buttons

  // Add a Roll button
  buttons.unshift({
    label: setting === 'Only icon' ? '' : 'Roll',
    class: 'roll-from-sheet',
    icon: 'fas fa-dice-d20',
    onclick: ev => {
      return rollItem(this.item, ev)
    },
  })
  return buttons
}

export function _getHeaderButtons__Journal_Override (wrapped) {
  const buttons = wrapped.bind(this)()
  const setting = game.settings.get(MODULE_ID, 'window-header-button')
  if (setting === 'Hide') return buttons

  // Add a Show in chat button
  buttons.unshift({
    label: setting === 'Only icon' ? '' : 'Show in chat',
    class: 'roll-from-sheet',
    icon: 'fas fa-dice-d20',
    onclick: ev => {
      return rollFromCompendium(this.object, ev)
    },
  })
  return buttons
}

export function _getEntryContextOptions__Item_Override (wrapped) {
  const buttons = wrapped.bind(this)()

  // Add a Roll button
  buttons.unshift({
    name: 'Roll',  // is "Roll" in game.i18n
    class: 'roll-from-sheet',
    icon: '<i class="fas fa-dice-d20"></i>',
    callback: li => {
      const item = game.items.get(li.data("documentId"));
      return rollItem(item, event)  // don't worry, event DOES exist
    },
  })
  return buttons
}
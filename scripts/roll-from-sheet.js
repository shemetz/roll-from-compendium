import { rollFromCompendium, rollItem } from './roll-from-compendium.js'

export function _getHeaderButtons__Item_Override (wrapped) {
  const buttons = wrapped()

  // Add a Roll button
  buttons.unshift({
    label: 'Roll',
    class: 'roll-from-sheet',
    icon: 'fas fa-dice-d20',
    onclick: ev => {
      return rollItem(this.item, ev)
    },
  })
  return buttons
}

export function _getHeaderButtons__Journal_Override (wrapped) {
  const buttons = wrapped()

  // Add a Show in chat button
  buttons.unshift({
    label: 'Show in chat',
    class: 'roll-from-sheet',
    icon: 'fas fa-dice-d20',
    onclick: ev => {
      return rollFromCompendium(this.object, ev)
    },
  })
  return buttons
}
import {
  getRollActionName,
  guessCompendiumSubtype,
  quickRollToChat,
} from './quick-roll-to-chat.js'
import { MODULE_ID } from './consts.js'
import { COMPATIBLE_DOCUMENT_TYPES } from './consts.js'

export function addButtonToSheetHeader (sheet, buttons) {
  const setting = game.settings.get(MODULE_ID, 'window-header-button')
  if (setting === 'Hide') return buttons
  if (
    // special case:  hide button if it's a journal temporarily shown to the players
    sheet.document.documentName === 'JournalEntry'
    && !sheet.object.testUserPermission(game.user, 'OBSERVER')
    && !sheet.object.pack
  ) return buttons

  // Add a Sheet To Chat button
  buttons.unshift({
    label: setting === 'Only icon' ? '' : getRollActionName(sheet.document.documentName, sheet.document.type),
    class: 'sheet-to-chat',
    icon: 'fas fa-dice-d20',
    onclick: async ev => {
      return quickRollToChat(sheet.object, ev)
    },
  })
  return buttons
}

export function Compendium__getEntryContextOptions_Wrapper (wrapped) {
  const buttons = wrapped.bind(this)()
  const documentName = this.collection.documentName
  if (!COMPATIBLE_DOCUMENT_TYPES.includes(documentName)) {
    return buttons
  }

  // Add a Sheet To Chat button
  buttons.unshift({
    name: getRollActionName(documentName, guessCompendiumSubtype(this.collection.metadata)),
    class: 'sheet-to-chat',
    icon: '<i class="fas fa-dice-d20"></i>',
    callback: async li => {
      const mouseEvent = event
      const entryId = li.data('documentId')
      const thumbImg = this.collection.index.get(entryId).thumb
      return this.collection.getDocument(entryId).then(async item => {
        if (item.img?.includes('default-icons') && thumbImg) {
          // little trick to use the trick that PF2e modules use, which updates thumbnail images but not data images
          await quickRollToChat(item, mouseEvent, thumbImg)
        } else await quickRollToChat(item, mouseEvent)
        return false
      })
    },
  })
  return buttons
}

export function SidebarDirectory__getEntryContextOptions_Wrapper (wrapped) {
  const buttons = wrapped.bind(this)()
  const documentName = this.constructor.documentName
  if (!COMPATIBLE_DOCUMENT_TYPES.includes(documentName)) {
    return buttons
  }

  // Add a Sheet To Chat button
  buttons.unshift({
    name: getRollActionName(documentName, undefined),
    class: 'sheet-to-chat',
    icon: '<i class="fas fa-dice-d20"></i>',
    callback: async li => {
      const mouseEvent = event
      const entryId = li.data('documentId')
      const item = game.collections.get(documentName).get(entryId)
      await quickRollToChat(item, mouseEvent)
      return false
    },
  })
  return buttons
}

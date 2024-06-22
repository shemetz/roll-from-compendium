import {
  getRollActionName,
  guessCompendiumSubtype,
  quickSendToChat,
} from './quick-send-to-chat.js'
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

  // Add a Send To Chat button
  buttons.unshift({
    label: setting === 'Only icon' ? '' : getRollActionName(sheet.document.documentName, sheet.document.type),
    class: 'send-to-chat',
    icon: 'fas fa-comment-alt',
    onclick: async () => {
      return quickSendToChat(sheet.object)
    },
  })
  return buttons
}

export function addSidebarContextOptions (application, buttons) {
  const pack = application.collection?.applicationClass?.name === 'Compendium' ? application.collection : undefined
  const documentName = application.entryType
  if (
    !COMPATIBLE_DOCUMENT_TYPES.includes(documentName)
    || documentName === 'RollTable' // Roll tables have a "Roll" button added to them in core foundry, but only in sidebar and not in compendium list
  ) return

  // Add a Send To Chat button
  buttons.unshift({
    name: getRollActionName(documentName, pack ? guessCompendiumSubtype(pack.metadata) : undefined),
    class: 'send-to-chat',
    icon: '<i class="fas fa-comment-alt"></i>',
    callback: async li => {
      const entryId = li.data('documentId')
      let item
      if (pack) {
        const thumbImg = pack.index.get(entryId).thumb
        item = await pack.getDocument(entryId)
        if (item.img?.includes('default-icons') && thumbImg) {
          // little trick to use the trick that PF2e modules use, which updates thumbnail images but not data images
          await quickSendToChat(item, thumbImg)
        }
      } else {
        item = game.collections.get(documentName).get(entryId)
      }
      await quickSendToChat(item, undefined)
      return false
    },
  })
}

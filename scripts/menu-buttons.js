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
    onclick: async ev => {
      return quickSendToChat(sheet.object, ev)
    },
  })
  return buttons
}

export function addCompendiumContextOptions (application, buttons) {
  const pack = game.packs.get(application[0].dataset.pack)
  const documentName = pack?.metadata.type
  if (!pack || !COMPATIBLE_DOCUMENT_TYPES.includes(documentName)) return

  // Add a Send To Chat button
  buttons.unshift({
    name: getRollActionName(documentName, guessCompendiumSubtype(pack.metadata)),
    class: 'send-to-chat',
    icon: '<i class="fas fa-comment-alt"></i>',
    callback: async li => {
      const mouseEvent = event
      const entryId = li.data('documentId')
      const thumbImg = pack.index.get(entryId).thumb
      return pack.getDocument(entryId).then(async item => {
        if (item.img?.includes('default-icons') && thumbImg) {
          // little trick to use the trick that PF2e modules use, which updates thumbnail images but not data images
          await quickSendToChat(item, mouseEvent, thumbImg)
        } else await quickSendToChat(item, mouseEvent)
        return false
      })
    },
  })
}

export function addSidebarContextOptions (application, buttons) {
  const tab = ui[application[0].dataset.tab]
  const documentName = tab?.constructor.documentName
  if (
    !COMPATIBLE_DOCUMENT_TYPES.includes(documentName)
    || documentName === 'RollTable' // Roll tables have a "Roll" button added to them in core foundry, but only in sidebar and not in compendium list
  ) return

  // Add a Send To Chat button
  buttons.unshift({
    name: getRollActionName(documentName, undefined),
    class: 'send-to-chat',
    icon: '<i class="fas fa-comment-alt"></i>',
    callback: async li => {
      const mouseEvent = event
      const entryId = li.data('documentId')
      const item = game.collections.get(documentName).get(entryId)
      await quickSendToChat(item, mouseEvent)
      return false
    },
  })
}

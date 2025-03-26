import {
  getRollActionName,
  guessCompendiumSubtype,
  quickSendToChat, rollSimple,
} from './quick-send-to-chat.js'
import { MODULE_ID } from './consts.js'
import { COMPATIBLE_DOCUMENT_TYPES } from './consts.js'
import { whisperToSelfIfCtrlIsHeld } from './keybindings.js'

export function addButtonToSheetHeader (sheet, buttons) {
  const setting = game.settings.get(MODULE_ID, 'window-header-button')
  if (setting === 'Hide')
    return buttons
  if (game.settings.get(MODULE_ID, 'ignored-document-names').split(',').includes(sheet.document.documentName))
    return buttons
  if (
    // special case:  hide button if it's a journal temporarily shown to the players
    sheet.document.documentName === 'JournalEntry'
    && !sheet.object.testUserPermission(game.user, 'OBSERVER')
    && !sheet.object.pack
  )
    return buttons

  // Add a Send To Chat button
  buttons.unshift({
    label: setting === 'Only icon' ? '' : getRollActionName(sheet.document.documentName, sheet.document.type),
    icon: '<i class="fa-solid fa-comment-alt"></i>',
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
    icon: '<i class="fa-solid fa-comment-alt"></i>',
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

export function addJournalContextOptions (application, buttons) {
  // Add a Send To Chat button
  buttons.push({
    name: 'Contents To Chat',
    icon: '<i class="fa-solid fa-comment-alt"></i>',
    callback: async li => {
      const page = application.object.pages.get(li.dataset.pageId)
      await ChatMessage.create({
        ...whisperToSelfIfCtrlIsHeld(),
        content: page.text.content,
      })
    },
  })
}

export function addButtonToImagePopoutHeader (imagePopout, buttons) {
  const setting = game.settings.get(MODULE_ID, 'window-header-button')
  if (setting === 'Hide')
    return buttons
  if (game.settings.get(MODULE_ID, 'ignored-document-names').split(',').includes('ImagePopout'))
    return buttons

  // Add a Send To Chat button
  buttons.unshift({
    label: setting === 'Only icon' ? '' : getRollActionName('ImagePopout', undefined),
    icon: '<i class="fa-solid fa-comment-alt"></i>',
    onclick: async () => {
      return rollSimple({ img: imagePopout.object, name: imagePopout.options.title })
    },
  })
  return buttons
}
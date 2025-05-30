import {
  getRollActionName,
  guessCompendiumSubtype,
  quickSendToChat, rollSimple,
} from './quick-send-to-chat.js'
import { MODULE_ID } from './consts.js'
import { COMPATIBLE_DOCUMENT_TYPES } from './consts.js'
import { whisperToSelfIfCtrlIsHeld } from './keybindings.js'

const { ChatMessage } = foundry.documents

export function addButtonToSheetHeader (sheet, buttons) {
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
  // put it second-from-last, because with application v1 the last button is Close
  buttons.splice(buttons.length - 1, 0, {
    class: 'quick-send-to-chat',
    label: getRollActionName(sheet.document.documentName, sheet.document.type),
    icon: 'fa-solid fa-comment-alt',
    onclick: async () => {
      return quickSendToChat(sheet.object)
    },
  })
  return buttons
}

/**
 * Used for sidebar entries and also for entries in compendium -- item, actor, etc
 */
export function addContextOptions (application, buttons) {
  const pack = application.collection?.applicationClass?.name === 'Compendium' ? application.collection : undefined
  const documentName = application.documentName
  if (
    !COMPATIBLE_DOCUMENT_TYPES.includes(documentName)
    // Roll tables have a "Roll" button added to them in core foundry, but only in sidebar and not in compendium list
    || (documentName === 'RollTable' && !pack)
  ) return

  // Add a Send To Chat button
  buttons.push({
    name: getRollActionName(documentName, pack ? guessCompendiumSubtype(pack.metadata) : undefined),
    icon: '<i class="fa-solid fa-comment-alt"></i>',
    callback: async li => {
      const entryId = li.dataset['entryId']
      let item
      if (pack) {
        const thumbImg = pack.index.get(entryId).thumb
        item = await pack.getDocument(entryId)
        if (item.img?.includes('default-icons') && thumbImg) {
          // little trick to use the trick that PF2e modules use, which updates thumbnail images but not data images
          await quickSendToChat(item, thumbImg)
        }
      } else {
        item = application.collection.get(entryId)
      }
      await quickSendToChat(item, undefined)
      return false
    },
  })
}

export function addJournalEntryContextOptions (application, buttons) {
  // Add a Send To Chat button
  buttons.push({
    name: 'Contents To Chat',
    icon: '<i class="fa-solid fa-comment-alt"></i>',
    callback: async li => {
      const journal = application.collection.get(li.dataset['entryId'])
      const firstPageContents = journal.pages.contents[0]?.text.content ?? '(Empty journal)'
      await ChatMessage.create({
        ...whisperToSelfIfCtrlIsHeld(),
        content: `<h1>${journal.name}</h1>` + firstPageContents,
      })
    },
  })
}

export function addJournalEntryPageContextOptions (application, buttons) {
  // Add a Send To Chat button
  buttons.push({
    name: 'Contents To Chat',
    icon: '<i class="fa-solid fa-comment-alt"></i>',
    callback: async li => {
      const page = application.document.pages.get(li.dataset['pageId'])
      await ChatMessage.create({
        ...whisperToSelfIfCtrlIsHeld(),
        content: `<h1>${page.name}</h1>` + page.text.content,
      })
    },
  })
}

export function addButtonToImagePopoutHeader (imagePopout, buttons) {
  if (game.settings.get(MODULE_ID, 'ignored-document-names').split(',').includes('ImagePopout'))
    return buttons

  // Add a Send To Chat button
  buttons.push({
    class: 'quick-send-to-chat',
    label: getRollActionName('ImagePopout', undefined),
    icon: 'fa-solid fa-comment-alt',
    onclick: async () => {
      return rollSimple({ img: imagePopout.options.src, name: imagePopout.options.window.title })
    },
  })
  return buttons
}
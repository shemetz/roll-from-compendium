import {
  addButtonToImagePopoutHeader,
  addButtonToSheetHeader,
  addContextOptions,
  addJournalEntryPageContextOptions,
  addJournalEntryContextOptions,
} from './menu-buttons.js'
import { MODULE_ID, MODULE_NAME } from './consts.js'

Hooks.once('init', function () {
  game.settings.register(MODULE_ID, 'use-dummy-actor', {
    name: 'Use dummy "(Quick Send To Chat)" actor',
    hint: 'A "dummy" actor is necessary in some game systems (like dnd5e, pf2e...) to allow sending items to chat,' +
      ' or to roll damage for spells.  The dummy actor will be created only once (and recreated if you delete it); ' +
      ' Feel free to move it into a folder.  Some systems (like Custom System Builder) don\'t need' +
      ' it and will have errors if they detect such an unusual actor;  if that happens to you, disable this setting' +
      ' and delete that actor.',
    scope: 'world',
    config: true,
    type: Boolean,
    default: (() => {
      if (game.system.id === 'pf2e') return true
      if (game.system.id === 'dnd5e') return true
      if (game.system.id === 'custom-system-builder') return false
      // probably true for most other systems?  I don't know
      return true
    })(),
  })
  game.settings.register(MODULE_ID, 'ignored-document-names', {
    name: 'Ignored document names',
    hint: 'comma-separated list of document names that you don\'t want to see the header button in.  Example: "JournalEntry,Scene"',
    scope: 'world',
    config: true,
    type: String,
    default: '',
  })
})

Hooks.once('setup', function () {
  // TODO I'm really not sure which of these sets of hooks should be used... I'm guessing it's about Application V1/V2
  Hooks.on('getItemSheetHeaderButtons', addButtonToSheetHeader)
  Hooks.on('getActorSheetHeaderButtons', addButtonToSheetHeader)
  Hooks.on('getJournalSheetHeaderButtons', addButtonToSheetHeader)
  Hooks.on('getSceneConfigHeaderButtons', addButtonToSheetHeader)
  Hooks.on('getImagePopoutHeaderButtons', addButtonToImagePopoutHeader)

  Hooks.on('getHeaderControlsItemSheet', addButtonToSheetHeader)
  Hooks.on('getHeaderControlsActorSheet', addButtonToSheetHeader)
  Hooks.on('getHeaderControlsJournalSheet', addButtonToSheetHeader)
  Hooks.on('getHeaderControlsSceneConfig', addButtonToSheetHeader)
  Hooks.on('getHeaderControlsImagePopout', addButtonToImagePopoutHeader)
  // not hooking for macros or roll tables;  they already have a button to use them from the sheet

  Hooks.on('getJournalEntryContextOptions', addJournalEntryContextOptions)
  Hooks.on('getJournalEntryPageContextOptions', addJournalEntryPageContextOptions)
  Hooks.on('getItemContextOptions', addContextOptions)
  Hooks.on('getActorContextOptions', addContextOptions)
  Hooks.on('getSceneContextOptions', addContextOptions)
  Hooks.on('getRollTableContextOptions', addContextOptions)
  Hooks.on('getMacroContextOptions', addContextOptions)
  console.log(`${MODULE_NAME} | Done setting up.`)
})

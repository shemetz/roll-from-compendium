import {
  addButtonToImagePopoutHeader,
  addButtonToSheetHeaderAppV1,
  addButtonToSheetHeaderAppV2,
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
  Hooks.on('getHeaderControlsActorSheetV2', addButtonToSheetHeaderAppV2) // TODO, ActorSheetV2 or BaseActorSheet, which is better?  or CharacterActorSheet even?
  Hooks.on('getHeaderControlsItemSheet5e', addButtonToSheetHeaderAppV2) // 5e-specific
  Hooks.on('getHeaderControlsItemSheet', addButtonToSheetHeaderAppV2) // TODO hope this actually gets used for other systems
  Hooks.on('getHeaderControlsSceneConfig', addButtonToSheetHeaderAppV2)
  Hooks.on('getHeaderControlsCardConfig', addButtonToSheetHeaderAppV2)
  Hooks.on('getHeaderControlsJournalEntrySheet', addButtonToSheetHeaderAppV2)
  Hooks.on('getHeaderControlsJournalEntryPageTextSheet', addButtonToSheetHeaderAppV2)

  Hooks.on('getHeaderControlsImagePopout', addButtonToImagePopoutHeader)

  Hooks.on('getJournalSheetHeaderButtons', addButtonToSheetHeaderAppV1) // still used in dnd5e
  Hooks.on('getActorSheetHeaderButtons', addButtonToSheetHeaderAppV1) // still used in pf2e
  Hooks.on('getItemSheetHeaderButtons', addButtonToSheetHeaderAppV1) // still used in pf2e
  // not hooking header buttons for macros or roll tables;  they already have a button to use them from the sheet

  Hooks.on('getJournalEntryPageContextOptions', addJournalEntryPageContextOptions)
  Hooks.on('getJournalEntryContextOptions', addJournalEntryContextOptions)
  Hooks.on('getItemContextOptions', addContextOptions)
  Hooks.on('getActorContextOptions', addContextOptions)
  Hooks.on('getSceneContextOptions', addContextOptions)
  Hooks.on('getRollTableContextOptions', addContextOptions)
  Hooks.on('getMacroContextOptions', addContextOptions)

  console.log(`${MODULE_NAME} | Done setting up.`)
})

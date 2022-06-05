import {
  addButtonToSheetHeader,
  Compendium__getEntryContextOptions_Wrapper,
  SidebarDirectory__getEntryContextOptions_Wrapper,
} from './menu-buttons.js'
import { MODULE_ID, MODULE_NAME } from './consts.js'
import {
  DND5e_AbilityUseDialog__getSpellData_Wrapper,
  DND5e_AbilityUseDialog_create_Wrapper
} from './dnd5e-compatibility.js'

Hooks.once('init', function () {
  game.settings.register(MODULE_ID, 'window-header-button', {
    name: 'Window header button',
    hint: 'Affects how the added header button looks in sheet windows',
    scope: 'client',
    config: true,
    type: String,
    choices: {
      'Full': 'Default: will look like "🎲 Quick Roll To Chat"',
      'Only icon': '"🎲"',
      'Hide': 'Will not add any header button to sheets',
    },
    default: 'Full',
  })
})

Hooks.once('setup', function () {
  libWrapper.register(
    MODULE_ID,
    'Compendium.prototype._getEntryContextOptions',
    Compendium__getEntryContextOptions_Wrapper,
    'WRAPPER',
  )
  libWrapper.register(
    MODULE_ID,
    `SidebarDirectory.prototype._getEntryContextOptions`,
    SidebarDirectory__getEntryContextOptions_Wrapper,
    'WRAPPER',
  )
  if (game?.dnd5e?.applications?.AbilityUseDialog?._getSpellData) {
    libWrapper.register(
      MODULE_ID,
      `game.dnd5e.applications.AbilityUseDialog._getSpellData`,
      DND5e_AbilityUseDialog__getSpellData_Wrapper,
      'WRAPPER',
    )
    libWrapper.register(
      MODULE_ID,
      `game.dnd5e.applications.AbilityUseDialog.create`,
      DND5e_AbilityUseDialog_create_Wrapper,
      'WRAPPER',
    )
  }
  Hooks.on('getItemSheetHeaderButtons', addButtonToSheetHeader)
  Hooks.on('getActorSheetHeaderButtons', addButtonToSheetHeader)
  Hooks.on('getJournalSheetHeaderButtons', addButtonToSheetHeader)
  console.log(`${MODULE_NAME} | Done setting up.`)
})

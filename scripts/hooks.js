import {
  addButtonToSheetHeader,
  addCompendiumContextOptions,
  addSidebarContextOptions,
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
      'Full': 'Full (default): will look like "🎲 Quick Roll To Chat"',
      'Only icon': 'Only icon: "🎲"',
      'Hide': 'Hide: will not add any header button to sheets',
    },
    default: 'Full',
  })
})

Hooks.once('setup', function () {
  if (dnd5e?.applications?.item?.AbilityUseDialog?._getSpellData) {
    libWrapper.register(
      MODULE_ID,
      `dnd5e.applications.item.AbilityUseDialog._getSpellData`,
      DND5e_AbilityUseDialog__getSpellData_Wrapper,
      'WRAPPER',
    )
    libWrapper.register(
      MODULE_ID,
      `dnd5e.applications.item.AbilityUseDialog.create`,
      DND5e_AbilityUseDialog_create_Wrapper,
      'WRAPPER',
    )
  }
  Hooks.on('getItemSheetHeaderButtons', addButtonToSheetHeader)
  Hooks.on('getActorSheetHeaderButtons', addButtonToSheetHeader)
  Hooks.on('getJournalSheetHeaderButtons', addButtonToSheetHeader)
  Hooks.on("getCompendiumEntryContext", addCompendiumContextOptions)
  Hooks.on("getSidebarTabEntryContext", addSidebarContextOptions)
  console.log(`${MODULE_NAME} | Done setting up.`)
})

import {
  addButtonToSheetHeader,
  addCompendiumContextOptions,
  addSidebarContextOptions,
} from './menu-buttons.js'
import { MODULE_ID, MODULE_NAME } from './consts.js'
import {
  abilityUseRenderHook,
  abilityPreUseItemHook
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
  if (game?.dnd5e?.applications?.item?.AbilityUseDialog?._getSpellData) {
    Hooks.on('renderAbilityUseDialog', abilityUseRenderHook)
    Hooks.on('dnd5e.preUseItem', abilityPreUseItemHook)
  }
  Hooks.on('getItemSheetHeaderButtons', addButtonToSheetHeader)
  Hooks.on('getActorSheetHeaderButtons', addButtonToSheetHeader)
  Hooks.on('getJournalSheetHeaderButtons', addButtonToSheetHeader)
  Hooks.on('getCompendiumEntryContext', addCompendiumContextOptions)
  Hooks.on('getSidebarTabEntryContext', addSidebarContextOptions)
  console.log(`${MODULE_NAME} | Done setting up.`)
})

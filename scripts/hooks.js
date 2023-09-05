import {
  addButtonToSheetHeader,
  addCompendiumContextOptions,
  addSidebarContextOptions,
} from './menu-buttons.js'
import { MODULE_ID, MODULE_NAME } from './consts.js'
import {
  abilityUseRenderHook,
  abilityPreUseItemHook,
} from './dnd5e-compatibility.js'

Hooks.once('init', function () {
  game.settings.register(MODULE_ID, 'window-header-button', {
    name: 'Window header button',
    hint: 'Affects how the added header button looks in sheet windows',
    scope: 'client',
    config: true,
    type: String,
    choices: {
      'Full': 'Full (default): will look like "💬 To Chat"',
      'Only icon': 'Only icon: "💬"',
      'Hide': 'Hide: will not add any header button to sheets',
    },
    default: 'Full',
  })
  game.settings.register(MODULE_ID, 'use-dummy-actor', {
    name: 'Use dummy "(Quick Send To Chat)" actor?',
    hint: 'A "dummy" actor is necessary in some game systems (like dnd5e, pf2e...) to allow special item automation, such' +
      ' as rolling damage for a fireball spell.  The dummy actor will be created only once (and recreated if you delete it);  it' +
      ' will be as "empty" as possible, and you can put it in whichever directory you want.  However, some systems (like' +
      ' Custom System Builder) don\'t need' +
      ' it and will have errors if they detect such an unusual actor, which is why you might wish to toggle this off and' +
      ' delete that actor.',
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

import { libWrapper } from './libwrapper-shim.js'
import { _contextMenu_Override } from './roll-from-compendium.js'
import {
  _getEntryContextOptions__Item_Override,
  _getHeaderButtons__Item_Override,
  _getHeaderButtons__Journal_Override,
} from './menu-buttons.js'

export const MODULE_ID = 'roll-from-compendium'

Hooks.once('init', function () {
  game.settings.register(MODULE_ID, 'window-header-button', {
    name: 'Window header button',
    hint: 'Affects how the added header button looks in windows',
    scope: 'client',
    config: false,
    type: String,
    choices: {
      'Full': 'Default: will look like "🎲Roll"',
      'Only icon': '"🎲"',
      'Hide': 'Will not add any header button to your sheets.',
    },
    default: 'Full',
  })
})

Hooks.once('setup', function () {
  libWrapper.register(
    MODULE_ID,
    'Compendium.prototype._contextMenu',
    _contextMenu_Override,
    'OVERRIDE',
  )
  libWrapper.register(
    MODULE_ID,
    'ItemSheet.prototype._getHeaderButtons',
    _getHeaderButtons__Item_Override,
    'WRAPPER',
  )
  libWrapper.register(
    MODULE_ID,
    `JournalSheet.prototype._getHeaderButtons`,
    _getHeaderButtons__Journal_Override,
    'WRAPPER',
  )
  libWrapper.register(
    MODULE_ID,
    `ItemDirectory.prototype._getEntryContextOptions`,
    _getEntryContextOptions__Item_Override,
    'WRAPPER',
  )
  console.log('Roll From Compendium | Done setting up.')
})
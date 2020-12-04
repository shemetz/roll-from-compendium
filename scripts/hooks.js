import { libWrapper } from './libwrapper-shim.js'
import { _contextMenu_Override } from './roll-from-compendium.js'
import { _getHeaderButtons__Item_Override, _getHeaderButtons__Journal_Override } from './roll-from-sheet.js'

const MODULE_ID = 'roll-from-compendium'

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
  console.log('Roll From Compendium | Done setting up.')
})
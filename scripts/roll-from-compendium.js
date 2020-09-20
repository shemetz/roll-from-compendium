import { libWrapper } from './libwrapper-shim.js'

const MODULE_ID = 'roll-from-compendium'

function rollItemFromCompendium(item) {
  console.log(`Rolling item from compendium: ${item.name}`)
  item.roll()
}

function _contextMenu_Override (html) {
  new ContextMenu(html, '.directory-item', [
    rollFromCompendiumContextMenuItem.bind(this)(),
    ...coreFoundryContextMenuItems.bind(this)()
  ])
}

function rollFromCompendiumContextMenuItem () {
  return {
    name: 'Roll',
    icon: '<i class="fas fa-dice-d20"></i>',
    callback: li => {
      const entryId = li.attr('data-entry-id')
      this.getEntity(entryId).then(rollItemFromCompendium)
    }
  }
}

function coreFoundryContextMenuItems () {
  return [
    {
      name: 'Import',
      icon: '<i class="fas fa-download"></i>',
      callback: li => {
        const entryId = li.attr('data-entry-id')
        const entities = this.cls.collection
        return entities.importFromCollection(this.collection, entryId, {}, { renderSheet: true })
      }
    },
    {
      name: 'Delete',
      icon: '<i class="fas fa-trash"></i>',
      callback: li => {
        let entryId = li.attr('data-entry-id')
        this.getEntity(entryId).then(entry => {
          new Dialog({
            title: `Delete ${entry.name}`,
            content: '<h3>Are you sure?</h3>' +
              '<p>This compendium entry and its data will be deleted.</p>' +
              '<p>If you do not own this compendium, your change could be reverted by future updates.</p>',
            buttons: {
              yes: {
                icon: '<i class="fas fa-trash"></i>',
                label: 'Delete',
                callback: () => this.deleteEntity(entryId)
              },
              no: {
                icon: '<i class="fas fa-times"></i>',
                label: 'Cancel'
              }
            },
            default: 'yes'
          }).render(true)
        })
      }
    }
  ]
}

Hooks.once('setup', function () {
  libWrapper.register(
    MODULE_ID,
    'Compendium.prototype._contextMenu',
    (html) => {
      return _contextMenu_Override(html)
    },
    'OVERRIDE'
  )
  console.log('Done setting up Zoom/Pan Options.')
})

import { libWrapper } from './libwrapper-shim.js'

const MODULE_ID = 'roll-from-compendium'

let dummyActor = null

async function rollItemFromCompendium (item) {
  console.log(`Rolling item from compendium: ${item.name}`)
  if (dummyActor === null) {
    dummyActor = await findOrCreateDummyActor()
  }
  const actor = canvas.tokens.controlled[0]?.actor || dummyActor
  actor.getOwnedItem = getOwnedItemOrCompendiumItem.bind(actor)(actor.getOwnedItem, item)
  item.options.actor = actor
  item._getChatCardActor = () => actor
  if (actor?.sheet?._onItemRoll) {
    // a hack, to be compatible with 5e sheet's _onItemRoll
    const pseudoEvent = {
      preventDefault: () => {},
      currentTarget: {
        closest: () => {
          return {
            dataset: {
              itemId: item.id
            }
          }
        }
      }
    }
    actor.sheet._onItemRoll(pseudoEvent)
  } else {
    item.roll()
  }
}

function getOwnedItemOrCompendiumItem (getOwnedItem, compendiumItem) {
  return function (itemId) {
    if (itemId === compendiumItem.id) return compendiumItem
    else return getOwnedItem.bind(this)(itemId)
  }
}

async function findOrCreateDummyActor () {
  const dummyActorName = "(Compendium Roll)"
  const foundActor = game.actors.find(a => a.name === dummyActorName)
  if (foundActor !== null) {
    return foundActor
  }

  const ent = 'Actor'
  const cls = CONFIG.Actor.entityClass
  const types = game.system.entityTypes[ent]

  // Setup entity data
  const createData = {
    name: dummyActorName,
    img: 'icons/svg/d20-highlight.svg',
    type: types[0],
    types: types[0],
  }
  return cls.create(createData, { renderSheet: false })
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
    _contextMenu_Override,
    'OVERRIDE'
  )
  console.log('Done setting up Zoom/Pan Options.')
})

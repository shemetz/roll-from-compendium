const COMPENDIUM_ROLL_IMAGE = 'icons/svg/d20-highlight.svg'
const DUMMY_ACTOR_NAME = '(Compendium Roll)'
let dummyActor = null

export async function rollFromCompendium (item, event) {
  console.log(`Roll From Compendium | Rolling from compendium: ${item.name}`)
  if (item instanceof JournalEntry) return rollSimple(item, item.data.content)
  if (item instanceof Actor) return rollSimple(item)
  if (item instanceof Scene) return rollSimple(item)
  if (item instanceof Macro) return rollMacro(item)
  if (item instanceof RollTable) return rollRollableTable(item)
  if (item instanceof Item) return rollItem(item, event)
  console.error(`Roll From Compendium | Unknown class for ${item.name}: ${item.constructor.name}`)
}

async function rollSimple (item, extraContents) {
  const img = item.img || item.data.img || COMPENDIUM_ROLL_IMAGE
  const content =
    `<div class="${game.system.id} chat-card item-card">
          <header class="card-header flexrow">
          <img src="${img}" width="36" height="36"/>
          <h3 class="item-name">${item.name}</h3>
          </header>
      </div>
      ${extraContents || ''}
      `
  return await ChatMessage.create({ content })
}

async function rollMacro (item) {
  return await item.execute()
}

async function rollRollableTable (item) {
  return await item.draw()
}

export async function rollItem (item, event) {
  if (dummyActor === null) {
    dummyActor = await findOrCreateDummyActor()
  }
  const actor = canvas.tokens.controlled[0]?.actor || dummyActor
  actor.getOwnedItem = getOwnedItemOrCompendiumItem.bind(actor)(actor.getOwnedItem, item)
  item.options.actor = actor
  item._getChatCardActor = () => actor
  if (BetterRolls !== undefined) {
    const customRollItem = BetterRolls.rollItem(item, { event: event, preset: 0 })
    customRollItem.consumeCharge = () => Promise.resolve(true)
    return customRollItem.toMessage()
  }
  if (actor?.sheet?._onItemRoll) {
    // a hack, to be compatible with 5e sheet's _onItemRoll
    const pseudoEvent = {
      preventDefault: () => {},
      currentTarget: {
        closest: () => {
          return {
            dataset: {
              itemId: item.id,
            },
          }
        },
      },
    }
    actor.sheet._onItemRoll(pseudoEvent)
  } else {
    item.roll()
  }
}

export function getOwnedItemOrCompendiumItem (getOwnedItem, compendiumItem) {
  return function (itemId) {
    if (itemId === compendiumItem.id) return compendiumItem
    else return getOwnedItem.bind(this)(itemId)
  }
}

async function findOrCreateDummyActor () {
  const foundActor = game.actors.find(a => a.name === DUMMY_ACTOR_NAME)
  if (foundActor !== null) {
    return foundActor
  }

  const ent = 'Actor'
  const cls = CONFIG.Actor.entityClass
  const types = game.system.entityTypes[ent]

  // Setup entity data
  const createData = {
    name: DUMMY_ACTOR_NAME,
    img: COMPENDIUM_ROLL_IMAGE,
    type: types[0],
    types: types[0],
  }
  return cls.create(createData, { renderSheet: false })
}

export function _contextMenu_Override (html) {
  new ContextMenu(html, '.directory-item', [
    rollFromCompendiumContextMenuItem.bind(this)(),
    ...coreFoundryContextMenuItems.bind(this)(),
  ])
}

function rollFromCompendiumContextMenuItem () {
  return {
    name: 'Roll',
    icon: '<i class="fas fa-dice-d20"></i>',
    callback: li => {
      const mouseEvent = event
      const entryId = li.attr('data-entry-id')
      this.getEntity(entryId).then(item => {
        rollFromCompendium(item, mouseEvent)
      })
    },
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
      },
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
                callback: () => this.deleteEntity(entryId),
              },
              no: {
                icon: '<i class="fas fa-times"></i>',
                label: 'Cancel',
              },
            },
            default: 'yes',
          }).render(true)
        })
      },
    },
  ]
}

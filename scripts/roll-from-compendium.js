import { dnd5eRollItem } from './dnd5e-compatibility.js'
import { pf2eInitializeDummyActor, pf2eCastSpell } from './pf2e-compatibility.js'

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
          <img src="${img}" width="36" height="36" alt="${item.name || img}"/>
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
  event && event.preventDefault()
  if (dummyActor === null) {
    dummyActor = await findOrCreateDummyActor()
  }
  const actor = canvas.tokens.controlled[0]?.actor || dummyActor
  const actorHasItem = !!actor.items.get(item.id)
  if (!actorHasItem) {
    // overriding to pretend like the actor owns the item
    actor.getOwnedItem = getOwnedItemOrCompendiumItem.bind(actor)(actor.getOwnedItem, item)
    const originalActorItemsGet = actor.items.get
    actor.items.get = (key, ...args) => {
      if (key === item.id) {
        return item
      } else return originalActorItemsGet.bind(actor.items)(key, ...args)
    }
    // overriding to pretend like the item is owned by the actor
    // (overriding the read-only item.actor with some UGLY HACKS)
    Object.defineProperty(item, 'actor', {
      value: actor,
      configurable: true,
    })
    Object.defineProperty(item, 'isOwned', {
      value: true,
      configurable: true,
    })
  }
  if (game.system.id === 'pf2e') {
    if (item.type === 'spell') {
      return pf2eCastSpell(item, actor, dummyActor)
    } else {
      return item.toMessage()
    }
  }
  if (game.system.id === 'dnd5e') {
    return dnd5eRollItem(item, actor, actorHasItem)
  }
  return item.roll()
}

export function getOwnedItemOrCompendiumItem (getOwnedItem, compendiumItem) {
  return function (itemId) {
    if (itemId === compendiumItem.id) return compendiumItem
    else return getOwnedItem.bind(this)(itemId)
  }
}

async function findOrCreateDummyActor () {
  let foundActor = game.actors.find(a => a.name === DUMMY_ACTOR_NAME)
  if (foundActor) {
    // migration to v9
    if (game.system.id === 'pf2e' && !foundActor.spellcasting.filter(sc => sc)[0]) {
      foundActor = await pf2eInitializeDummyActor(foundActor)
    }
    return foundActor
  }

  const cls = CONFIG.Actor.documentClass
  const types = game.system.documentTypes.Actor

  // Setup document data
  const createData = {
    name: DUMMY_ACTOR_NAME,
    img: COMPENDIUM_ROLL_IMAGE,
    type: types[0],  // e.g. 'character' in dnd5e and pf2e
    types: types[0],
  }
  let actor = await cls.create(createData, { renderSheet: false })
  if (game.system.id === 'pf2e') {
    actor = await pf2eInitializeDummyActor(actor)
  }
  return actor
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
      const entryId = li.attr('data-document-id')
      this.collection.getDocument(entryId).then(item => {
        rollFromCompendium(item, mouseEvent)
      })
    },
  }
}

function coreFoundryContextMenuItems () {
  return [
    {
      name: 'COMPENDIUM.ImportEntry',
      icon: '<i class="fas fa-download"></i>',
      condition: () => this.collection.documentClass.canUserCreate(game.user),
      callback: li => {
        const collection = game.collections.get(this.collection.documentName)
        const id = li.data('document-id')
        return collection.importFromCompendium(this.collection, id, {}, { renderSheet: true })
      },
    },
    {
      name: 'COMPENDIUM.DeleteEntry',
      icon: '<i class="fas fa-trash"></i>',
      condition: () => game.user.isGM,
      callback: async li => {
        const id = li.data('document-id')
        const document = await this.collection.getDocument(id)
        return Dialog.confirm({
          title: `${game.i18n.localize('COMPENDIUM.DeleteEntry')} ${document.name}`,
          content: `<h4>${game.i18n.localize('AreYouSure')}</h4><p>${game.i18n.localize(
            'COMPENDIUM.DeleteEntryWarning')}</p>`,
          yes: () => document.delete(),
        })
      },
    },
  ]
}
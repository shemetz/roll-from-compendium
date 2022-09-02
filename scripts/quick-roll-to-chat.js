import { dnd5eInitializeDummyActor, dnd5eRollItem } from './dnd5e-compatibility.js'
import { pf2eInitializeDummyActor, pf2eCastSpell, pf2eItemToMessage } from './pf2e-compatibility.js'
import { DUMMY_ACTOR_IMAGE, DUMMY_ACTOR_NAME, MODULE_NAME } from './consts.js'

let dummyActor = null

export async function quickRollToChat (item, event, overrideImg) {
  console.log(`${MODULE_NAME} | Rolling item: ${item.name}`)
  if (item instanceof JournalEntry) return rollSimple(item, item.content, overrideImg)
  if (item instanceof Actor) return rollSimple(item, undefined, overrideImg)
  if (item instanceof Scene) return rollSimple(item, undefined, overrideImg)
  if (item instanceof Macro) return rollMacro(item)
  if (item instanceof RollTable) return rollRollableTable(item)
  if (item instanceof Item) return rollItem(item, event)
  console.error(`${MODULE_NAME} | Unknown class for ${item.name}: ${item.constructor.name}`)
}

export async function rollSimple (item, extraContents, overrideImg) {
  const img = overrideImg || item.img
  const imgElem = img ? `<img src=${img} alt="${item.name || img}"/>` : ''
  // first message - private, only name
  await ChatMessage.create({
    whisper: [game.user.id],
    content:
      `<div class="${game.system.id} chat-card item-card">
          <header class="card-header flexrow">
          <h3 class="item-name">${item.name}</h3>
          </header>
      </div>
      `
  })
  // second message - public, image/text
  if (imgElem || extraContents) {
    await ChatMessage.create({
      content:
        `<div class="${game.system.id} chat-card item-card">
          ${imgElem}
      </div>
      ${extraContents || ''}
      `
    })
  }
}

async function rollMacro (item) {
  return await item.execute()
}

async function rollRollableTable (item) {
  return await item.draw()
}

export async function rollItem (item, event) {
  event?.preventDefault()
  if (dummyActor === null) {
    dummyActor = await findOrCreateDummyActor()
  }
  const actor = canvas.tokens.controlled[0]?.actor || dummyActor
  const actorHasItem = !!actor.items.get(item.id)
  if (!actorHasItem) {
    // overriding to pretend like the actor owns the item
    actor.originalGetOwnedItem = actor.getOwnedItem
    actor.getOwnedItem = getOwnedItemOrCompendiumItem.bind(actor)(actor.getOwnedItem, item)
    actor.originalActorItemsGet = actor.items.get
    actor.items.get = (key, ...args) => {
      if (key === item.id) {
        return item
      } else return actor.originalActorItemsGet.bind(actor.items)(key, ...args)
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
  return rollDependingOnSystem(item, actor, dummyActor)
    .finally(() => {
      // undoing ugly hack override
      if (!actorHasItem) {
        actor.getOwnedItem = actor.originalGetOwnedItem
        actor.items.get = actor.originalActorItemsGet
        Object.defineProperty(item, 'actor', {
          value: undefined,
          writable: true,
          configurable: true,
        })
        Object.defineProperty(item, 'isOwned', {
          value: false,
          writable: true,
          configurable: true,
        })
      }
    })
}

async function rollDependingOnSystem (item, actor, dummyActor) {
  if (game.system.id === 'pf2e') {
    if (item.type === 'spell') {
      return pf2eCastSpell(item, actor, dummyActor)
    } else {
      return pf2eItemToMessage(item)
    }
  }
  if (game.system.id === 'dnd5e') {
    const actorHasItem = !!actor.items.get(item.id)
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

  // migration from older module name
  let oldActor = game.actors.find(a => a.name === '(Compendium Roll)')
  if (oldActor) {
    console.log(`${MODULE_NAME} | Migrating actor: ${oldActor.name}`)
    let updatedActor = await oldActor.update({ name: DUMMY_ACTOR_NAME })
    if (game.system.id === 'pf2e') {
      updatedActor = await pf2eInitializeDummyActor(oldActor)
    }
    if (game.system.id === 'dnd5e') {
      updatedActor = await dnd5eInitializeDummyActor(oldActor)
    }
    return updatedActor
  }

  const cls = CONFIG.Actor.documentClass
  const types = game.system.documentTypes.Actor

  // Setup document data
  console.log(`${MODULE_NAME} | Creating actor: ${DUMMY_ACTOR_NAME}`)
  const createData = {
    name: DUMMY_ACTOR_NAME,
    img: DUMMY_ACTOR_IMAGE,
    type: types[0],  // e.g. 'character' in dnd5e and pf2e
    types: types[0],
  }
  let actor = await cls.create(createData, { renderSheet: false })
  if (game.system.id === 'pf2e') {
    actor = await pf2eInitializeDummyActor(actor)
  }
  if (game.system.id === 'dnd5e') {
    actor = await dnd5eInitializeDummyActor(actor)
  }
  return actor
}

export const getRollActionName = (documentName, documentSubtype) => {
  return {
    // from pf2e
    // Item
    'action': 'Description To Chat',
    'ancestry': 'Description To Chat',
    'armor': 'Description To Chat',
    'background': 'Description To Chat',
    'class': 'Description To Chat',
    'consumable': 'Description To Chat',
    'container': 'Description To Chat',
    'deity': 'Description To Chat',
    'effect': 'Description+Effect To Chat',
    'feat': 'Description To Chat',
    'heritage': 'Description To Chat',
    'kit': 'Description To Chat',
    'spell': 'Cast To Chat',
    'weapon': game.system.id === 'dnd5e' ? 'Quick Roll To Chat' : 'Description To Chat',
    'treasure': 'Description To Chat',
    // Actor
    'npc': 'Image To Chat',
    'character': 'Image To Chat',
    'hazard': 'Image To Chat',
    'vehicle': 'Image To Chat',
  }[documentSubtype] || {
    'Actor': 'Image To Chat',
    'Item': 'Quick Roll To Chat',
    'Macro': 'Execute',
    'JournalEntry': 'Text+Image To Chat',
    'RollTable': 'Draw From Table',
    'Scene': 'Image to Chat',
  }[documentName] || 'Quick Roll To Chat'
}

export const guessCompendiumSubtype = (compendiumMetadata) => {
  const packageName = compendiumMetadata.packageName
  const name = compendiumMetadata.name.toLowerCase()
  if (packageName === 'pf2e') {
    if (name.includes('iconics')) return 'character'
    if (name.includes('paizo-pregens')) return 'character'
    if (name.includes('bestiary')) return 'npc'
    if (name.includes('npc')) return 'npc'
    if (name.includes('hazards')) return 'hazard'
    if (name.includes('vehicles')) return 'vehicle'
    if (name.includes('actions')) return 'action'
    if (name.includes('feats')) return 'feat'
    if (name.includes('features')) return 'feat'
    if (name.includes('ancestries')) return 'ancestry'
    if (name.includes('backgrounds')) return 'background'
    if (name.includes('classes')) return 'class'
    if (name.includes('familiar-abilities')) return 'effect'
    if (name.includes('heritages')) return 'heritage'
    if (name.includes('spells')) return 'spell'
    if (name.includes('boons-and-curses')) return 'feat'
    if (name.includes('conditionitems')) return 'effect'
    if (name.includes('effects')) return 'effect'
    if (name.includes('pathfinder-society-boons')) return 'feat'
    if (name.includes('deities')) return 'background'
    if (name.includes('ac-advanced-maneuvers')) return 'feat'
    if (name.includes('ac-support')) return 'action'
    if (name.includes('ac-eidolons')) return 'ancestry'
  }
  return undefined
}

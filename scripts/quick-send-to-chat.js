import { dnd5eInitializeDummyActor, dnd5eRollItem } from './dnd5e-compatibility.js'
import { pf2eInitializeDummyActor, pf2eCastSpell, pf2eItemToMessage } from './pf2e-compatibility.js'
import { DUMMY_ACTOR_IMAGE, DUMMY_ACTOR_NAME, MODULE_NAME } from './consts.js'
import { whisperToSelfIfCtrlIsHeld } from './keybindings.js'

let dummyActor = null

export async function quickSendToChat (item, clickEvent, overrideImg) {
  console.log(`${MODULE_NAME} | Rolling item: ${item.name}`)
  if (item instanceof JournalEntry) return rollJournal(item, overrideImg)
  if (item instanceof Actor) return rollSimple(item, undefined, overrideImg)
  if (item instanceof Scene) return rollSimple(item, undefined, overrideImg)
  if (item instanceof Macro) return rollMacro(item)
  if (item instanceof RollTable) return rollRollableTable(item)
  if (item instanceof Item) return rollItem(item, clickEvent)
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
      `,
  })
  // second message - public (unless Ctrl is held), image/text
  if (imgElem || extraContents) {
    await ChatMessage.create({
      ...whisperToSelfIfCtrlIsHeld(),
      content:
        `<div class="${game.system.id} chat-card item-card">
          ${imgElem}
      </div>
      ${extraContents || ''}
      `,
    })
  }
}

export async function rollJournal (item, overrideImg) {
  const page0 = item.pages.filter(p => p)[0]
  const img = overrideImg || page0.src
  const imgElem = img ? `<img src=${img} alt="${item.name || img}"/>` : ''
  const journalTitle = item.pages.size <= 1 ? item.name : `${item.name} (page 1/${item.pages.size})`
  // first message - private, only name
  await ChatMessage.create({
    whisper: [game.user.id],
    content:
      `<div class="${game.system.id} chat-card item-card">
          <header class="card-header flexrow">
          <h3 class="item-name">${journalTitle}</h3>
          </header>
      </div>
      `,
  })
  // second message - public (unless ctrl is held), image/text
  if (page0.type === 'image') {
    await ChatMessage.create({
      ...whisperToSelfIfCtrlIsHeld(),
      content:
        `<div class="${game.system.id} chat-card item-card">
          ${imgElem}
      </div>
      ${page0.image.caption}
      `,
    })
  } else {
    await ChatMessage.create({
      ...whisperToSelfIfCtrlIsHeld(),
      content: page0.text.content,
    })
  }
}

async function rollItemDescription (item) {
  const img = item.img
  const imgElem = img ? `<img src=${img} alt="${item.name || img}" style="max-height: 80px"/>` : ''
  // one message, public, has: name, image, and description
  await ChatMessage.create({
    ...whisperToSelfIfCtrlIsHeld(),
    content:
      `<div class="${game.system.id} chat-card item-card">
          <header class="card-header flexrow">
          <h3 class="item-name">${item.name}</h3>
          </header>
        ${imgElem}
    </div>
    ${item.system.description || ''}
    `,
  })
}

async function rollMacro (item) {
  return await item.execute()
}

async function rollRollableTable (item) {
  return await item.draw()
}

function activateUglyHackThatLinksItemToActor (item, actor, shouldAffectActor) {
  console.log(`${MODULE_NAME} | temporarily binding item to actor: ${item.name} + -> ${actor.name}`)
  if (shouldAffectActor) {
    // overriding to pretend like the actor owns the item
    actor.getOwnedItem_prevDefinitions = [
      ...(actor.getOwnedItem_prevDefinitions || []),
      actor.getOwnedItem,
    ]
    actor.getOwnedItem = getOwnedItemOrCompendiumItem.bind(actor)(actor.getOwnedItem, item)
    actor.items_get_prevDefinitions = [
      ...(actor.items_get_prevDefinitions || []),
      actor.items.get,
    ]
    actor.items.get = (key, ...args) => {
      if (key === item.id) {
        return item
      } else return actor.items_get_prevDefinitions.at(-1).bind(actor.items)(key, ...args)
    }
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
  // overriding item.clone so that it maintains the dummy actor link
  item.clone_prevDefinitions = [
    ...(item.clone_prevDefinitions || []),
    item.clone,
  ]
  item.clone = (...args) => {
    console.log(`${MODULE_NAME} | item ${item.name} is being cloned; assuming temporary clone`)
    const cloneOfItem = item.clone_prevDefinitions.at(-1).bind(item)(...args)
    activateUglyHackThatLinksItemToActor(cloneOfItem, actor, false)
    // ugly hack doesn't need to be deactivated because clone probably exists only temporarily
    return cloneOfItem
  }
}

function deactivateUglyHackThatLinksItemToActor (item, actor) {
  console.log(`${MODULE_NAME} | undoing temporary binding of item to actor: ${item.name} - -> ${actor.name}`)
  actor.getOwnedItem = actor.getOwnedItem_prevDefinitions.pop()
  actor.items.get = actor.items_get_prevDefinitions.pop()
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
  item.clone = item.clone_prevDefinitions.pop()
  if (actor.getOwnedItem_prevDefinitions?.length === 0) {
    delete actor.getOwnedItem_prevDefinitions
  }
  if (actor.items_get_prevDefinitions?.length === 0) {
    delete actor.items_get_prevDefinitions
  }
  if (item.clone_prevDefinitions?.length === 0) {
    delete item.clone_prevDefinitions
  }
}

export async function rollItem (item, clickEvent) {
  clickEvent?.preventDefault()
  if (dummyActor === null) {
    dummyActor = await findOrCreateDummyActor()
  }
  const actor = canvas.tokens.controlled[0]?.actor || dummyActor
  const actorHasItem = !!actor.items.get(item.id)
  if (!actorHasItem) {
    activateUglyHackThatLinksItemToActor(item, actor, true)
  }
  return rollDependingOnSystem(item, actor, dummyActor, clickEvent).finally(() => {
    // undoing ugly hack override
    if (!actorHasItem) {
      deactivateUglyHackThatLinksItemToActor(item, actor)
    }
  })
}

async function rollDependingOnSystem (item, actor, dummyActor, clickEvent) {
  if (game.system.id === 'pf2e') {
    if (item.type === 'spell') {
      return pf2eCastSpell(item, actor, dummyActor, clickEvent)
    } else {
      return pf2eItemToMessage(item, clickEvent)
    }
  }
  if (game.system.id === 'dnd5e') {
    const actorHasItem = !!actor.items.get(item.id)
    return dnd5eRollItem(item, actor, actorHasItem, clickEvent)
  }
  if (item.roll !== undefined) {
    return item.roll()
  }
  // used for systems like Simple Worldbuilding that have no item.roll function
  return rollItemDescription(item)
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
  let oldActor = game.actors.find(a => a.name === '(Quick Roll To Chat)')
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
    'weapon': 'Send To Chat',
    'treasure': 'Description To Chat',
    // Actor
    'npc': 'Image To Chat',
    'character': 'Image To Chat',
    'hazard': 'Image To Chat',
    'vehicle': 'Image To Chat',
  }[documentSubtype] || {
    'Actor': 'Image To Chat',
    'Item': 'Send To Chat',
    'Macro': 'Execute',
    'JournalEntry': 'Text+Image To Chat',
    'RollTable': 'Roll',
    'Scene': 'Image to Chat',
  }[documentName] || 'Send To Chat'
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

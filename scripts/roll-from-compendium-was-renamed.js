import { DUMMY_ACTOR_NAME, MODULE_ID, MODULE_NAME } from './consts.js'
import { pf2eInitializeDummyActor } from './pf2e-compatibility.js'
import { dnd5eInitializeDummyActor } from './dnd5e-compatibility.js'

Hooks.once('ready', () => {
  let oldActor = game.actors.find(a => a.name === '(Compendium Roll)')
  if (!oldActor) {
    // no migration message necessary
    return
  }

  const MESSAGE_TITLE = 'Quick Roll To Chat'
  const MESSAGE = `
				<p><b>Roll From Compendium has been renamed to "Quick Roll To Chat"!</b></p>
				<p>If you have issues, uninstalling and reinstalling the module should work.</p>
			`

  // Settings key used for the "Don't remind me again" setting
  const DONT_REMIND_AGAIN_KEY = 'name-change-dont-remind-again'

  // Dialog code
  game.settings.register(MODULE_ID, DONT_REMIND_AGAIN_KEY, {
    name: '',
    default: false,
    type: Boolean,
    scope: 'world',
    config: false
  })
  if (game.user.isGM && !game.settings.get(MODULE_ID, DONT_REMIND_AGAIN_KEY)) {
    console.warn(`Quick Roll To Chat rename message shown`)
    new Dialog({
      title: MESSAGE_TITLE,
      content: MESSAGE, buttons: {
        dont_remind: {
          icon: '<i class="fas fa-check"></i>',
          label: 'Don\'t remind me again',
          callback: () => game.settings.set(MODULE_ID, DONT_REMIND_AGAIN_KEY, true)
        }
      }
    }).render(true)

    migrate(oldActor)
  }
})

const migrate = async (oldActor) => {
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

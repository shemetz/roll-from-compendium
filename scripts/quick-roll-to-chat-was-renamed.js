import { DUMMY_ACTOR_NAME, MODULE_ID, MODULE_NAME } from './consts.js'
import { pf2eInitializeDummyActor } from './compatibility/pf2e-compatibility.js'
import { dnd5eInitializeDummyActor } from './compatibility/dnd5e-compatibility.js'

const { DialogV2 } = foundry.applications.api

Hooks.once('ready', async () => {
  let oldActor = game.actors.find(a => a.name === '(Quick Roll To Chat)')
  if (!oldActor) {
    // no migration message necessary
    return
  }

  const MESSAGE_TITLE = 'Quick Send To Chat'
  const MESSAGE = `
				<p><b>Quick Roll To Chat has been renamed to "Quick Send To Chat"!</b></p>
				<p>If you have issues, uninstalling and reinstalling the module should work.</p>
			`

  // Settings key used for the "Don't remind me again" setting
  const DONT_REMIND_AGAIN_KEY_2 = 'name-change-dont-remind-again-2'

  // Dialog code
  game.settings.register(MODULE_ID, DONT_REMIND_AGAIN_KEY_2, {
    name: '',
    default: false,
    type: Boolean,
    scope: 'world',
    config: false,
  })
  if (game.user.isGM && !game.settings.get(MODULE_ID, DONT_REMIND_AGAIN_KEY_2)) {
    await migrate(oldActor)
    console.warn(`Quick Send To Chat rename message shown successfully, should not repeat again.`)
    DialogV2.wait({
      title: MESSAGE_TITLE,
      content: MESSAGE,
      buttons: [
        {
          action: 'dont_remind',
          icon: 'fa-solid fa-check',
          label: 'Don\'t remind me again',
          callback: () => game.settings.set(MODULE_ID, DONT_REMIND_AGAIN_KEY_2, true),
        },
      ],
    })
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

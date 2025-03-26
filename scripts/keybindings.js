const { KeyboardManager } = foundry.helpers.interaction

export const whisperToSelfIfCtrlIsHeld = () => {
  const ctrlIsHeld = game.keyboard.isModifierActive(KeyboardManager.MODIFIER_KEYS.CONTROL)
  if (ctrlIsHeld) {
    return {
      whisper: [game.user.id],
    }
  } else {
    return {}
  }
}
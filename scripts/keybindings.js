export const isCtrlHeld = () => {
  return game.keyboard.isModifierActive(KeyboardManager.MODIFIER_KEYS.CONTROL)
}

export const whisperToSelfIfCtrlIsHeld = () => {
  const ctrlIsHeld = isCtrlHeld()
  if (ctrlIsHeld) {
    return {
      whisper: [game.user.id],
    }
  } else {
    return {}
  }
}
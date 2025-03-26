const { KeyboardManager } = foundry.helpers.interaction

export const ageSystemItemToMessage = async (item) => {
  const forceSelfRoll = game.keyboard.isModifierActive(KeyboardManager.MODIFIER_KEYS.CONTROL)
  return item.showItem(forceSelfRoll)
}
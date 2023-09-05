export const createFakeMouseEvent = () => {
  return {
    ctrlKey: game.keyboard.isModifierActive(KeyboardManager.MODIFIER_KEYS.CONTROL),
    altKey: game.keyboard.isModifierActive(KeyboardManager.MODIFIER_KEYS.ALT),
    shiftKey: game.keyboard.isModifierActive(KeyboardManager.MODIFIER_KEYS.SHIFT),
    currentTarget: { closest: () => undefined }, // pf2e patch
  }
}
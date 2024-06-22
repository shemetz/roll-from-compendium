import { isCtrlHeld } from '../keybindings.js'

export const ageSystemItemToMessage = async (item) => {
  const forceSelfRoll = isCtrlHeld()
  return item.showItem(forceSelfRoll)
}
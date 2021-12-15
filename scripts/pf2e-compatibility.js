
// https://gitlab.com/hooking/foundry-vtt---pathfinder-2e/-/blob/master/src/module/actor/sheet/base.ts#L1048
export const createSpellcastingInCompendiumRoll = (compendiumRollActor) => {
  const actor = compendiumRollActor
  const spellcastingType = 'innate'
  const tradition = 'arcane'
  const ability = 'int'
  const flexible = false

  const name = '(Compendium Roll Spellcasting)'

  // Define new spellcasting entry
  const spellcastingEntity = {
    ability: { value: ability },
    spelldc: { value: 0, dc: 0, mod: 0 },
    tradition: { value: tradition },
    prepared: { value: spellcastingType, flexible: flexible ?? undefined },
    showUnpreparedSpells: { value: true },
  }

  const data = {
    name,
    type: "spellcastingEntry",
    data: spellcastingEntity,
  }

  actor.createEmbeddedDocuments("Item", [data])
}

export const getSpellcasting = (actor, dummyActor) => {
  const existingSpellcasting = actor.spellcasting.filter(sc => sc)[0]
  if (existingSpellcasting) return existingSpellcasting
  else return dummyActor.spellcasting.getName('(Compendium Roll Spellcasting)')
}
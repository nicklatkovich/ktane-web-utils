export const VANILLA_MODULES = [
  "BigButton",
  "Keypad",
  "Maze",
  "Wires",
  "Memory",
  "Password",
  "Simon",
  "Venn",
  "Morse",
  "WireSequence",
  "WhosOnFirst",
  "NeedyVentGas",
  "NeedyKnob",
  "NeedyCapacitor",
];

const vanillaModulesSet = new Set(VANILLA_MODULES);

export function isVanillaModule(moduleId: string): boolean {
  return vanillaModulesSet.has(moduleId);
}

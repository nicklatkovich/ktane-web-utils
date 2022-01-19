import { MonoRandom } from "monorandom";

import { getPopularModules } from "../constants/popular-modules";
import { Module } from "../modules/repo.module";
import { rand, shuffled } from "../utils";

export interface ModulePickerProps {
  allModules: Map<string, Module>,
  count: number,
  prioritizePopular: boolean,
  ignoreModules: Set<string>,
  ignoreNeedy: boolean,
  rnd?: MonoRandom,
}

export function pickModules(props: ModulePickerProps) {
  const popularModules = getPopularModules(props.rnd);
  const set = new Set<string>();
  const canPick = (moduleId: string): boolean => {
    if (props.ignoreModules.has(moduleId)) return false;
    const module = props.allModules.get(moduleId);
    if (!module) return false;
    if (module.Type === "Regular") return true;
    if (module.Type !== "Needy") return false;
    return !props.ignoreNeedy;
  }
  if (props.prioritizePopular) {
    for (let i = 0; i < popularModules.length && set.size < props.count; i++) {
      if (rand(100, props.rnd) > 0) continue;
      const moduleId = popularModules[i];
      if (!canPick(moduleId)) continue;
      set.add(moduleId);
    }
  }
  if (set.size >= props.count) return [...set];
  const allIds = shuffled([...props.allModules.keys()], props.rnd);
  for (const moduleId of allIds) {
    if (!canPick(moduleId)) continue;
    set.add(moduleId);
    if (set.size >= props.count) return [...set];
  }
  return [...set];
}

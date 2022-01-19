import { MonoRandom } from "monorandom";

import { DAY } from "../constants";

export function shuffled<T>(arr: T[], rnd?: MonoRandom): T[] {
  const res = [...arr];
  for (let i = 0; i < res.length; i++) {
    const j = rand(res.length, rnd);
    [res[i], res[j]] = [res[j], res[i]];
  }
  return res;
}

export function rand(limit: number, rnd?: MonoRandom): number {
  if (!rnd) return Math.floor(Math.random() * limit);
  return rnd.nextMax(limit);
}

export function getCurrentDayIndex(): number {
  return getDayIndex(Date.now());
}

export function getDayIndex(time: number): number {
  return Math.floor(time / DAY);
}

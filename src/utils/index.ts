import { MonoRandom } from "monorandom";

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

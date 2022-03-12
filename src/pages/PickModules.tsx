import { MonoRandom } from "monorandom";
import React, { useEffect, useMemo, useState } from "react";

import "../styles/pick-modules.scss";
import { profileSelectors } from "../modules/profile.module";
import { repoSelectors, RepoStatus } from "../modules/repo.module";
import { useAppSelector } from "../store";
import { ModulePickerProps, pickModules } from "../services/modules-picker";
import { getDayIndex, rand } from "../utils";
import { DAY, HOUR, LAST_CHALLENGE_UPDATE, MINUTE, SECOND } from "../constants";
import { ModuleRowComponent } from "../components/ModuleRow";
import { getPopularity } from "../constants/popular-modules";

function getUpdateTime(now: number): number {
  return now + 12 * HOUR;
}

export const PickModulesPage: React.FC = () => {
  const repoStatus = useAppSelector(repoSelectors.getStatus);
  const allModulesState = useAppSelector(repoSelectors.getModules);
  const enabledModules = useAppSelector(profileSelectors.getEnabledModules);
  const disabledModules = useAppSelector(profileSelectors.getDisabledModules);

  const [popular, setPopular] = useState(true);
  const [randomness, setRandomness] = useState(true);
  const [list, setList] = useState<string[]>([]);
  const [useCurrentDay, setUseCurrentDay] = useState(true);
  const [ignoreProfiled, setIgnoreProfiled] = useState(true);
  const [ignoreNeedy, setIgnoreNeedy] = useState(true);
  const [ignoreVanilla, setIgnoreVanilla] = useState(true);
  const [seed, setSeed] = useState(rand(2 ** 16));
  const [now, setNow] = useState(Date.now());

  const today = useMemo(() => getDayIndex(getUpdateTime(now)), [now]);
  const timeToNextUpdate = useMemo(() => {
    const diff = ((today + 1) * DAY) - getUpdateTime(now);
    if (diff > HOUR) return `${Math.floor(diff / HOUR)}h`;
    if (diff > MINUTE) return `${Math.floor(diff / MINUTE)}m`;
    if (diff > SECOND) return `${Math.floor(diff / SECOND)}s`;
    return `now!`;
  }, [today, now]);
  const allModules = useMemo(() => new Map(Object.entries(allModulesState)), [allModulesState]);
  const ignoreModules = useMemo(() => {
    const result = new Set(enabledModules && ignoreProfiled ? Object.keys(enabledModules) : null);
    if (disabledModules) {
      for (const mId of Object.keys(disabledModules)) result.delete(mId);
    }
    return result;
  }, [enabledModules, disabledModules, ignoreProfiled]);
  const deps = useMemo(() => ({
    allModules,
    count: 11,
    prioritizePopular: popular,
    ignoreModules,
    ignoreNeedy,
    ignoreVanilla,
    rnd: new MonoRandom(useCurrentDay ? today : seed),
    randomness: randomness ? 100 : 1,
  }) as ModulePickerProps, [
    allModules,
    popular,
    ignoreModules,
    ignoreNeedy,
    ignoreVanilla,
    useCurrentDay,
    today,
    seed,
    randomness,
  ]);
  const dmg = useMemo(() => ["mode:zen", ...list].join("\n"), [list]);

  useEffect(() => { setList(pickModules(deps)); }, [deps]);
  useEffect(() => {
    const timerId = setTimeout(() => {
      setNow(Date.now());
    }, 200);
    return () => clearTimeout(timerId);
  }, [now]);

  const renderer = useMemo(() => {
    if (repoStatus === RepoStatus.ERROR) return <div>Unable to load data from ktane.timwi.de</div>;
    if (repoStatus !== RepoStatus.LOADED) return <div>Loading data from ktane.timwi.de ...</div>;
    return <div className="module-picker">
      <h2>Learn These Modules Today!</h2>
      <div>
        <table className="module-table">
          <tbody>
            {list.sort((a, b) => getPopularity(b) - getPopularity(a)).map((moduleId) => (
              <ModuleRowComponent moduleId={moduleId} key={moduleId} />
            ))}
          </tbody>
        </table>
        <div>
          <div>
            <input type="checkbox" id="popular-checkbox" checked={popular} onChange={() => setPopular(!popular)} />
            <label htmlFor="popular-checkbox">
              Prioritize popular modules ({new Date(LAST_CHALLENGE_UPDATE * 1e3).toISOString().slice(0, 10)})
            </label>
            {!popular ? null : (
              <>
                <input
                  type="checkbox"
                  id="randomness-checkbox"
                  checked={randomness}
                  onChange={() => setRandomness(!randomness)}
                />
                <label htmlFor="randomness-checkbox">Enable random</label>
              </>
            )}
          </div>
          <div className="flex">
            <input
              type="checkbox"
              id="use-current-day-checkbox"
              checked={useCurrentDay}
              onChange={() => setUseCurrentDay(!useCurrentDay)}
            />
            <label htmlFor="use-current-day-checkbox" className="flex flex-wrap vert-space-between-2px">
              <span>Use current day as seed</span>
              <span>({new Date((today - 1) * DAY).toISOString().slice(0, 10)}. Next update in {timeToNextUpdate})</span>
            </label>
          </div>
          <div>
            <input
              type="checkbox"
              id="ignore-needy-checkbox"
              checked={ignoreNeedy}
              onChange={() => setIgnoreNeedy(!ignoreNeedy)}
            />
            <label htmlFor="ignore-needy-checkbox">Ignore needy</label>
          </div>
          <div>
            <input
              type="checkbox"
              id="ignore-vanilla-checkbox"
              checked={ignoreVanilla}
              onChange={() => setIgnoreVanilla(!ignoreVanilla)}
            />
            <label htmlFor="ignore-vanilla-checkbox">Ignore vanilla</label>
          </div>
          <div className="flex" style={{ height: 35, marginBottom: 16 }}>
            {enabledModules && Object.keys(enabledModules).length > 0 ? <>
              <input
                type="checkbox"
                id="ignore-profiled-checkbox"
                checked={ignoreProfiled}
                onChange={() => setIgnoreProfiled(!ignoreProfiled)}
              />
              <label htmlFor="ignore-profiled-checkbox">Ignore profiled modules</label>
            </> : "Upload your profile to exclude already known modules"}
          </div>
          <div className="flex space-between">
            <button onClick={() => navigator.clipboard.writeText(dmg)}>Copy DMG String</button>
            {useCurrentDay ? null
              : <button onClick={() => setSeed(rand(2 ** 16))}>Retry</button>}
          </div>
        </div>
      </div>
    </div>;
  }, [
    popular,
    list,
    useCurrentDay,
    ignoreProfiled,
    ignoreNeedy,
    ignoreVanilla,
    repoStatus,
    enabledModules,
    timeToNextUpdate,
    today,
    dmg,
    randomness,
  ]);
  return renderer;
};

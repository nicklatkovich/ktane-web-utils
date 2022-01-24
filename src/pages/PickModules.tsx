import { MonoRandom } from "monorandom";
import React, { useEffect, useMemo, useState } from "react";

import "../styles/pick-modules.scss";
import { profileSelectors } from "../modules/profile.module";
import { repoSelectors, RepoStatus } from "../modules/repo.module";
import { useAppSelector } from "../store";
import { ModulePickerProps, pickModules } from "../services/modules-picker";
import { getDayIndex, rand } from "../utils";
import { DAY, HOUR, MINUTE, SECOND } from "../constants";
import { ModuleRowComponent } from "../components/ModuleRow";

function getUpdateTime(now: number): number {
  return now + 12 * HOUR;
}

export const PickModulesPage: React.FC = () => {
  const repoStatus = useAppSelector(repoSelectors.getStatus);
  const allModulesState = useAppSelector(repoSelectors.getModules);
  const enabledModules = useAppSelector(profileSelectors.getEnabledModules);

  const [popular, setPopular] = useState(true);
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
  const ignoreModules = useMemo(
    () => new Set(enabledModules && ignoreProfiled ? Object.keys(enabledModules) : null),
    [enabledModules, ignoreProfiled],
  );
  const deps = useMemo(() => ({
    allModules,
    count: 11,
    prioritizePopular: popular,
    ignoreModules,
    ignoreNeedy,
    ignoreVanilla,
    rnd: new MonoRandom(useCurrentDay ? today : seed),
  }) as ModulePickerProps, [
    allModules,
    popular,
    ignoreModules,
    ignoreNeedy,
    ignoreVanilla,
    useCurrentDay,
    today,
    seed,
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
            {list.map((moduleId) => <ModuleRowComponent moduleId={moduleId} key={moduleId} />)}
          </tbody>
        </table>
        <div>
          <div>
            <input type="checkbox" id="popular-checkbox" checked={popular} onChange={() => setPopular(!popular)} />
            <label htmlFor="popular-checkbox">Prioritize popular modules (2022-01-16)</label>
          </div>
          <div>
            <input
              type="checkbox"
              id="use-current-day-checkbox"
              checked={useCurrentDay}
              onChange={() => setUseCurrentDay(!useCurrentDay)}
            />
            <label htmlFor="use-current-day-checkbox">
              Use current day as seed ({new Date((today - 1) * DAY).toISOString().slice(0, 10)}.
              Next update in {timeToNextUpdate})
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
          <div style={{ height: 32 }}>
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
  ]);
  return renderer;
};

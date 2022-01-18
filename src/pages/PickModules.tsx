import React, { useEffect, useState } from "react";
import { MonoRandom } from "monorandom";

import "../styles/pick-modules.scss";
import { getPopularModules } from "../constants/popular-modules";
import { profileSelectors } from "../modules/profile.module";
import { Module, repoSelectors, RepoStatus } from "../modules/repo.module";
import { useAppSelector } from "../store";
import { rand } from "../utils";

const COUNT = 11;

const buildList = (
  enabledModules: { [s: string]: true } | undefined,
  allModules: { [s: string]: Module },
  popular: boolean,
  useCurrentDay: boolean,
): string[] => {
  const rnd = useCurrentDay ? new MonoRandom(Math.floor(Date.now() / 1e6 / 60 / 60 / 24)) : undefined;
  const popularModules = getPopularModules(rnd);
  const set = new Set<string>();
  if (popular) {
    for (let i = 0; i < popularModules.length && set.size < COUNT; i++) {
      if (rand(100, rnd) > 0) continue;
      if (enabledModules && enabledModules[popularModules[i]]) continue;
      if (!allModules[popularModules[i]]) continue;
      set.add(popularModules[i]);
    }
  }
  for (let i = 0; i < 50 && set.size < COUNT; i++) {
    const allIds = Object.keys(allModules);
    const moduleId = allIds[rand(allIds.length, rnd)];
    if (!moduleId) return [...set];
    if (enabledModules && enabledModules[moduleId]) continue;
    set.add(moduleId);
  }
  return [...set];
};

export const PickModulesPage: React.FC = () => {
  const repoStatus = useAppSelector(repoSelectors.getStatus);
  const allModules = useAppSelector(repoSelectors.getModules);
  const enabledModules = useAppSelector(profileSelectors.getEnabledModules);
  const [popular, setPopular] = useState(true);
  const [list, setList] = useState<string[]>([]);
  const [useCurrentDay, setUseCurrentDay] = useState(true);
  useEffect(
    () => { setList(buildList(enabledModules, allModules, popular, useCurrentDay)); },
    [enabledModules, allModules, popular, useCurrentDay],
  );
  if (repoStatus === RepoStatus.ERROR) return <div>Unable to load data from ktane.timwi.de</div>;
  if (repoStatus !== RepoStatus.LOADED) return <div>Loading data from ktane.timwi.de ...</div>;
  return <>
    <h2>Learn This Modules Today!</h2>
    <div id="tip">
      <div>
        <input type="checkbox" id="popular-checkbox" checked={popular} onChange={() => setPopular(!popular)} />
        <label htmlFor="popular-checkbox">Prioritize popular modules (01/17/2022)</label>
      </div>
      <div>
        <input
          type="checkbox"
          id="use-current-day-checkbox"
          checked={useCurrentDay}
          onChange={() => setUseCurrentDay(!useCurrentDay)}
        />
        <label htmlFor="use-current-day-checkbox">Use current day as seed</label>
      </div>
      {enabledModules && Object.keys(enabledModules).length > 0 ? null
        : <span>Upload your profile to exclude already known modules</span>}
    </div>
    <ul>
      {list.map((moduleId) => <li key={moduleId}>{allModules[moduleId].Name}</li>)}
    </ul>
    {useCurrentDay ? null
      : <button onClick={() => setList(buildList(enabledModules, allModules, popular, useCurrentDay))}>Retry</button>}
  </>;
};

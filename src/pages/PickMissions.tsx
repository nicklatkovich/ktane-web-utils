import React, { useMemo, useState } from "react";

import "../styles/pick-missions-page.scss";

import { challenges } from "../constants/challenges";
import { profileSelectors } from "../modules/profile.module";
import { repoSelectors, RepoStatus } from "../modules/repo.module";
import { useAppSelector } from "../store";

export const PickMissionsPage: React.FC = () => {
  const repoStatus = useAppSelector(repoSelectors.getStatus);
  const allModulesState = useAppSelector(repoSelectors.getModules);
  const enabledModules = useAppSelector(profileSelectors.getEnabledModules);
  const disabledModules = useAppSelector(profileSelectors.getDisabledModules);
  const hasProfiles = useAppSelector(profileSelectors.isLoaded);

  const [ignoredCompleters, setIgnoredCompleters] = useState<string[]>([]);
  const [limit, setLimit] = useState(10);
  const [ignoredCompletersString, setIgnoredCompletersString] = useState("");
  const [completersAnd, setCompletersAnd] = useState(false);

  const missions = useMemo(() => challenges.filter((c) => {
    if (ignoredCompleters.length === 0) return true;
    if (completersAnd) return ignoredCompleters.some((p) => !c.completers.includes(p));
    return ignoredCompleters.every((p) => !c.completers.includes(p));
  }).map((challenge) => ({
    ...challenge,
    missedModules: challenge.modules.filter((mId) => (
      (enabledModules && !enabledModules[mId]) || (disabledModules && disabledModules[mId])
    )),
  })).sort((a, b) => {
    let diff = a.missedModules.length - b.missedModules.length;
    if (diff !== 0) return diff;
    diff = a.completers.length - b.completers.length;
    if (diff !== 0) return -diff;
    diff = a.completions - b.completions;
    if (diff !== 0) return -diff;
    return a.name > b.name ? 1 : -1;
  }), [enabledModules, disabledModules, completersAnd, ignoredCompleters]);
  const showMoreVisible = useMemo(() => limit < missions.length, [limit, missions]);

  if (repoStatus === RepoStatus.ERROR) return <div>Unable to load data from ktane.timwi.de</div>;
  if (repoStatus !== RepoStatus.LOADED) return <div>Loading data from ktane.timwi.de ...</div>;
  if (!hasProfiles) return <div>Upload profiles to use this service</div>;
  return (
    <div className="pick-missions-page">
      <h2>Solve These Missions Today!</h2>
      <div className="ignore-list">
        <label>Ignore solved by:</label>
        <input type="text" value={ignoredCompletersString} onChange={(e) => {
          setIgnoredCompletersString(e.target.value);
          const newList = e.target.value.split(",").map((s) => s.trim());
          if (newList.length !== ignoredCompleters.length || newList.some((v, i) => ignoredCompleters[i] !== v)) {
            setIgnoredCompleters(newList);
          }
        }} />
        {ignoredCompleters.length < 2 ? null : <>
          <button onClick={() => setCompletersAnd(!completersAnd)}>{completersAnd ? "AND" : "OR"}</button>
        </>}
      </div>
      <div>Last update: 2022-01-16</div>
      <table>
        <tbody>
          <tr>
            <td>Name</td>
            <td>Known modules</td>
            <td>Missing modules</td>
            <td>Completers /<br />Completions</td>
          </tr>
          {missions.slice(0, limit).map((m) => (
            <tr key={m.name}>
              <td>{m.name}</td>
              <td>{(100 - (m.missedModules.length / m.modules.length * 100)).toFixed(2)}%</td>
              <td>{m.missedModules.map((mId) => (<div key={mId}>{allModulesState[mId].Name}</div>))}</td>
              <td>{m.completers.length} / {m.completions}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{ marginTop: 24 }}>
        Showing {Math.min(limit, missions.length)} out of {missions.length}.&nbsp;
        {!showMoreVisible ? null : (
          <button onClick={() => setLimit(limit + 10)}>Show more</button>
        )}
      </div>
    </div>
  );
};

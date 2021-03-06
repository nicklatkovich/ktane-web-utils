import React, { useMemo } from "react";
import { getPopularity } from "../constants/popular-modules";

import { Module, repoSelectors } from "../modules/repo.module";
import { useAppSelector } from "../store";
import { ExternalLink } from "./ExternalLink";

export const ModuleRowComponent: React.FC<{ moduleId: string }> = (props) => {
  const allModulesState = useAppSelector(repoSelectors.getModules);

  const module: Module | undefined = useMemo(() => allModulesState[props.moduleId], [props.moduleId, allModulesState]);
  const manualLink = useMemo(() => `https://ktane.timwi.de/HTML/${module?.Name}.html`, [module]);
  const popularity = useMemo(() => getPopularity(props.moduleId), [props.moduleId]);

  if (!module) return null;
  return (
    <tr>
      <td className="no-select">
        <div className="module-links">
          <div>
            <ExternalLink href={manualLink}>
              <img className="manual" src="https://ktane.timwi.de/HTML/img/manual.png" alt="Manual" />
            </ExternalLink>
            {!module.SteamID
              ? <img className="steam void" src="https://ktane.timwi.de/HTML/img/steam-workshop-item.png" alt="Steam" />
              : (
                <ExternalLink href={`https://steamcommunity.com/sharedfiles/filedetails/?id=${module.SteamID}`}>
                  <img className="steam" src="https://ktane.timwi.de/HTML/img/steam-workshop-item.png" alt="Steam" />
                </ExternalLink>
              )}
          </div>
          <div>
            {!module.SourceUrl
              ? <img className="source void" src="https://ktane.timwi.de/HTML/img/unity.png" alt="No Source" />
              : (
                <ExternalLink href={module.SourceUrl}>
                  <img className="source" src="https://ktane.timwi.de/HTML/img/unity.png" alt="Source" />
                </ExternalLink>
              )}
            {!module.TutorialVideoUrl
              ? <img className="video void" src="https://ktane.timwi.de/HTML/img/video.png" alt="No Tutorials" />
              : (
                <ExternalLink href={module.TutorialVideoUrl.default}>
                  <img className="video" src="https://ktane.timwi.de/HTML/img/video.png" alt="Video" />
                </ExternalLink>
              )}
          </div>
        </div>
      </td>
      <td>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <span className="module-name">{module.Name}</span>
            <br />
            <span className="module-id">ID: {module.ModuleID}</span>
          </div>
          <div>
            Popularity: {(popularity * 100).toFixed(2)}%
          </div>
        </div>
      </td>
    </tr>
  )
};

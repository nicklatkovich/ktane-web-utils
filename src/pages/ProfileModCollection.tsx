import { saveAs } from "file-saver";

import { profileSelectors } from "../modules/profile.module";
import { repoSelectors, RepoStatus } from "../modules/repo.module";
import { useAppSelector } from "../store";
import { isVanillaModule } from "../constants/vanilla-modules";

export const ProfileModCollection: React.FC = () => {
  const repoStatus = useAppSelector(repoSelectors.getStatus);
  const allModulesState = useAppSelector(repoSelectors.getModules);
  const enabledModules = useAppSelector(profileSelectors.getEnabledModules);
  const hasProfiles = useAppSelector(profileSelectors.isLoaded);

  if (repoStatus === RepoStatus.ERROR) return <div>Unable to load data from ktane.timwi.de</div>;
  if (repoStatus !== RepoStatus.LOADED) return <div>Loading data from ktane.timwi.de ...</div>;
  if (!hasProfiles) return <div>Upload profiles to use this service</div>;

  const result = new Set<string>();
  const notFound = new Set<string>();
  const moduleIds = Object.keys(enabledModules ?? {}).filter((m) => !isVanillaModule(m));
  for (const module of moduleIds) {
    const repoInfo = allModulesState[module];
    if (!repoInfo || !repoInfo.SteamID) notFound.add(module);
    else result.add(repoInfo.SteamID);
  }

  return (
    <div>
      <div>Profile modules: {moduleIds.length}</div>
      <div>Workshop items: {result.size}</div>
      <div>Not found modules: {notFound.size}</div>
      <button style={{ marginTop: '32px' }} onClick={() => {
        saveAs(new Blob([`${[...result].join("\n")}\n`], { type: "text/plain" }), "profile-mods-list.txt");
      }}>Generate!</button>
      {notFound.size === 0 ? null : (
        <>
          <div>Not found modules:</div>
          <ul>
            {[...notFound].map((moduleId) => <li>{moduleId}</li>)}
          </ul>
        </>
      )}
    </div>
  )
};

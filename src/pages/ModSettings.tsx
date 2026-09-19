import { saveAs } from "file-saver";
import React, { useState } from "react"

import { repoSelectors, RepoStatus } from "../modules/repo.module";
import { useAppSelector } from "../store";
import "../styles/mod-settings.scss";

const WS_DEFAULT_PATH = "C:\\Program Files (x86)\\Steam\\steamapps\\workshop\\content\\341800\\";
const MS_DEFAULT_PATH = "%AppData%\\..\\LocalLow\\Steel Crate Games\\Keep Talking and Nobody Explodes\\modSettings.xml";
const LN_WS_DEFAULT_PATH = "/home/USERNAME/.local/share/Steam/steamapps/workshop/content/341800/";
const LN_MS_DEFAULT_PATH = "~/.config/unity3d/Steel Crate Games/Keep Talking and Nobody Explodes/modSettings.xml";
const SD_WS_DEFAULT_PATH = "Z:\\home\\deck\\.local\\share\\Steam\\steamapps\\workshop\\content\\341800";
const SD_MS_DEFAULT_PATH = "/home/deck/.steam/steam/steamapps/compatdata/341800/pfx/drive_c/users/steamuser/AppData/LocalLow/Steel Crate Games/Keep Talking and Nobody Explodes/modSettings.xml";
const MC_WS_DEFAULT_PATH = "/User/USERNAME/Library/Application Support/Steam/steamapps/workshop/content/341800";
const MC_MS_DEFAULT_PATH = "~/Library/Application Support/com.steelcrategames.keeptalkingandnobodyexplodes/modSettings.xml";

export const ModSettingsPage: React.FC = () => {
  const repoStatus = useAppSelector(repoSelectors.getStatus);
  const allModulesState = useAppSelector(repoSelectors.getModules);

  const [path, setPath] = useState(WS_DEFAULT_PATH);

  if (repoStatus === RepoStatus.ERROR) return <div>Unable to load data from ktane.timwi.de</div>;
  if (repoStatus !== RepoStatus.LOADED) return <div>Loading data from ktane.timwi.de ...</div>;
  return (
    <div className="mod-settings-page">
      <h2>modSettings.xml Generator</h2>
      <div>
        <ol>
          <li>Specify the path to the workshop items folder.</li>
          <li>Click the "Generate!" button.</li>
          <li>Save the generated modSettings.xml file replacing the original one.</li>
          <li>Launch the game.</li>
        </ol>
      </div>
      <div className="flex">
        <div>Path to workshop:</div>
        <input type="text" onChange={(e) => {
          setPath(e.target.value);
        }} value={path} />
        <div>
          <button onClick={() => {
            const result: string[] = [];
            result.push(`<?xml version="1.0" encoding="utf-8"?>`);
            result.push([
              `<ModSettings`,
              `xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"`,
              `xmlns:xsd="http://www.w3.org/2001/XMLSchema">`,
            ].join(" "));
            result.push(`  <DisabledModPaths>`);
            const fixedPath = path.endsWith("/") || path.endsWith("\\") ? path : (
              path + (path.includes("\\") ? "\\" : "/")
            );
            const steamIds = new Set(Object.values(allModulesState)
              .filter((mod) => mod.SteamID && (mod.Type === "Regular" || mod.Type === "Needy"))
              .map((mod) => mod.SteamID));
            result.push(...Array.from(steamIds).map((id) => `    <string>${fixedPath}${id}</string>`));
            result.push(`  </DisabledModPaths>`);
            result.push(`</ModSettings>`);
            result.push("");
            saveAs(new Blob([result.join("\n")], { type: "text/xml" }), "modSettings.xml");
          }}>Generate!</button>
        </div>
      </div>
      <div>Default paths:
        <ul style={{ marginTop: 0 }}>
          <li>Windows:
            <ul>
              <li>Workshop: <input className="path" type="text" disabled value={WS_DEFAULT_PATH} /></li>
              <li>modSettings.xml: <input className="path" type="text" disabled value={MS_DEFAULT_PATH} /></li>
            </ul>
          </li>
          <li>Linux:
            <ul>
              <li>
                Workshop: KTaNE does not accept short paths for <code>modSettings.xml</code> on Linux.
                Replace <b>USERNAME</b> with your actual system username.
                You can get it using command `<code>whoami</code>`.
                <br/>
                <input className="path" type="text" disabled value={LN_WS_DEFAULT_PATH} />
              </li>
              <li>modSettings.xml: <input className="path" type="text" disabled value={LN_MS_DEFAULT_PATH} /></li>
            </ul>
          </li>
          <li>Steam Deck (Proton):
            <ul>
              <li>Workshop: <input className="path" type="text" disabled value={SD_WS_DEFAULT_PATH} /></li>
              <li>modSettings.xml: <input className="path" type="text" disabled value={SD_MS_DEFAULT_PATH} /></li>
            </ul>
          </li>
          <li>Mac:
            <ul>
              <li>
                Workshop: KTaNE does not accept short paths for <code>modSettings.xml</code> on Mac.
                Replace <b>USERNAME</b> with your actual system username.
                You can get it using command `<code>id -un</code>`.
                <br/>
                <input className="path" type="text" disabled value={MC_WS_DEFAULT_PATH} />
              </li>
              <li>modSettings.xml: <input className="path" type="text" disabled value={MC_MS_DEFAULT_PATH} /></li>
            </ul>
          </li>
        </ul>
      </div>
    </div>
  );
}

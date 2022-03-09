import React, { useEffect } from "react";
import { Route, Routes } from "react-router";
import { Link } from "react-router-dom";

import "./styles/App.scss";
import { ProfileUploader } from "./components/ProfileUploader";
import { profileActions, profileSelectors } from "./modules/profile.module";
import { repoActions, repoSelectors, RepoStatus } from "./modules/repo.module";
import { HomePage } from "./pages/Home";
import { ModSettingsPage } from "./pages/ModSettings";
import { PickModulesPage } from "./pages/PickModules";
import { useAppDispatch, useAppSelector } from "./store";

export const AppComponent: React.FC = () => {
  const repoStatus = useAppSelector(repoSelectors.getStatus);
  const dispatch = useAppDispatch();
  const profileName = useAppSelector(profileSelectors.getName);
  const modulesCount = useAppSelector(profileSelectors.getEnabledModulesCount);
  useEffect(() => {
    if (repoStatus !== RepoStatus.INITIAL) return;
    dispatch(repoActions.load());
  }, [repoStatus, dispatch]);
  return (
    <div>
      <Link to="/">
        <h1>KTaNE Web Utils</h1>
      </Link>
      <div id="profile-section">
        {profileName === undefined
          ? <ProfileUploader />
          : (
            <div id="profile-header">
              Profile: {profileName} ({modulesCount} modules)
              <button onClick={() => dispatch(profileActions.forget())}>reset</button>
            </div>
          )}
      </div>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/mod-settings" element={<ModSettingsPage />} />
        <Route path="/pick-modules" element={<PickModulesPage />} />
        <Route path="*" element={<div>(Not Found)</div>} />
      </Routes>
    </div>
  );
};

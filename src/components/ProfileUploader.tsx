import React from "react";

import { profileActions, profileSelectors } from "../modules/profile.module";
import { useAppDispatch, useAppSelector } from "../store";
import { FileUploaderComponent } from "./FileUploader";

export const ProfileUploader: React.FC = () => {
  const isLoading = useAppSelector(profileSelectors.isLoading);
  const dispatch = useAppDispatch();
  if (isLoading) return <div>Profile Loading...</div>;
  return <FileUploaderComponent label="Upload Profile" onLoad={(files) => {
    if (!files) return;
    dispatch(profileActions.upload(files));
  }} />
};

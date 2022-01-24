import { createAsyncThunk, createSlice } from "@reduxjs/toolkit"
import axios from "axios";

import { RootState } from "../store";

export interface Module {
  ModuleID: string;
  Name: string;
  Type: string;
  SteamID: string | null;
  TutorialVideoUrl?: { default: string; [s: string]: string };
  SourceUrl?: string;
}

export enum RepoStatus { INITIAL, LOADING, ERROR, LOADED }

export interface RepoState {
  status: RepoStatus;
  modules: { [id: string]: Module };
}

const initialState: RepoState = {
  status: RepoStatus.INITIAL,
  modules: {},
}

export const repoSlice = createSlice({
  name: "repo",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(load.pending, (state) => { state.status = RepoStatus.LOADING; });
    builder.addCase(load.fulfilled, (state, { payload }) => {
      if (state.status !== RepoStatus.LOADING) return;
      if (!payload) { state.status = RepoStatus.ERROR; return; }
      state.status = RepoStatus.LOADED;
      state.modules = payload;
    });
  },
});

export const load = createAsyncThunk(
  "repo/load",
  async (): Promise<null | { [id: string]: Module }> => {
    const raw = await axios("https://ktane.timwi.de/json/raw").then((res) => res.data);
    if (!raw || typeof raw !== "object") {
      console.error("REPO CONTENT LOADING FAILED:", raw);
      return null;
    }
    try {
      const json = raw as { KtaneModules: Module[] };
      return Object.fromEntries(json.KtaneModules.map((module) => [module.ModuleID, module]));
    } catch (error) {
      console.error(error);
      return null;
    }
  },
);

export const repoSelectors = {
  getStatus: (state: RootState) => state.repo.status,
  getModules: (state: RootState) => state.repo.modules,
};

export const repoActions = { ...repoSlice.actions, load };
export const repoReducer = repoSlice.reducer;

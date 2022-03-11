import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

import { VANILLA_MODULES } from "../constants/vanilla-modules";
import { RootState } from "../store";

export interface ProfileItem {
  name: string;
  expert: boolean;
  list: string[];
}

export interface ProfileState {
  loading: boolean;
  onlyDefs?: boolean;
  profiles?: ProfileItem[];
  name?: string;
  enabledModules?: { [s: string]: true };
  disabledModules?: { [s: string]: true };
  modulesCount: number;
}

const initialState: ProfileState = { loading: false, modulesCount: 0 };

export const profileSlice = createSlice({
  name: "profile",
  initialState,
  reducers: {
    forget: (state) => {
      if (state.loading) return;
      delete state.profiles;
      delete state.name;
      delete state.enabledModules;
      state.modulesCount = 0;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(upload.pending, (state) => { state.loading = true; });
    builder.addCase(upload.fulfilled, (state, action) => {
      state.loading = false;
      if (!action.payload) return;
      if (!state.enabledModules) state.enabledModules = {};
      const profiles = [...state.profiles || [], ...action.payload];
      const enabledModules = new Set<string>();
      const disabledModules = new Set<string>();
      const onlyDefs = profiles.every((p) => !p.expert);
      for (const { list } of profiles.filter((p) => p.expert)) {
        for (const mId of list) enabledModules.add(mId);
      }
      const diffCheck = new Set(enabledModules);
      for (const { list } of profiles.filter((p) => !p.expert)) {
        for (const mId of list) {
          disabledModules.add(mId);
          diffCheck.delete(mId);
        }
      }
      state.onlyDefs = onlyDefs;
      state.enabledModules = Object.fromEntries([...enabledModules, ...VANILLA_MODULES].map((mId) => [mId, true]));
      state.disabledModules = Object.fromEntries([...disabledModules].map((mId) => [mId, true]));
      state.modulesCount = diffCheck.size;
      state.profiles = profiles;
      state.name = profiles.map((p) => p.name).join(" + ");
    });
  },
});

export const upload = createAsyncThunk(
  "profile/upload",
  async (payload: FileList): Promise<ProfileItem[] | null> => {
    const files = new Array(payload.length).fill(0).map((_, i) => payload.item(i)).filter((e) => e) as File[];
    try {
      return Promise.all(files.map(async (file) => {
        const text = await file.text();
        const json = JSON.parse(text);
        const expert = json.Operation === 0;
        return {
          name: file.name.replace(/\.json$/gi, ""),
          expert,
          list: expert ? json.EnabledList : json.DisabledList,
        } as ProfileItem;
      }));
    } catch (error) {
      console.error(error);
      return null;
    }
  },
);

export const profileSelectors = {
  getName: (state: RootState) => state.profile.name,
  isLoading: (state: RootState) => state.profile.loading,
  isLoaded: (state: RootState) => !!state.profile.profiles,
  getEnabledModules: (state: RootState) => state.profile.enabledModules,
  getDisabledModules: (state: RootState) => state.profile.disabledModules,
  getEnabledModulesCount: (state: RootState) => state.profile.modulesCount,
};

export const profileActions = { ...profileSlice.actions, upload };
export const profileReducer = profileSlice.reducer;

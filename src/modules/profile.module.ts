import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

import { RootState } from "../store";

export interface ProfileState {
  loading: boolean;
  name?: string;
  enabledModules?: { [s: string]: true };
  modulesCount: number;
}

const initialState: ProfileState = { loading: false, modulesCount: 0 };

export const profileSlice = createSlice({
  name: "profile",
  initialState,
  reducers: {
    forget: (state) => {
      if (state.loading) return;
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
      state.name = action.payload.name;
      state.enabledModules = action.payload.enabledModules;
      state.modulesCount = action.payload.modulesCount;
    });
  },
});

export const upload = createAsyncThunk(
  "profile/upload",
  async (payload: FileList): Promise<{
    name: string,
    enabledModules: { [s: string]: true },
    modulesCount: number,
  } | null> => {
    const files = new Array(payload.length).fill(0).map((_, i) => payload.item(i)).filter((e) => e) as File[];
    const name = files.map((file) => file.name.replace(/\.json$/gi, "")).join(" + ");
    const enabledModules = new Set<string>();
    try {
      await Promise.all(files.map(async (file) => {
        const text = await file.text();
        const json = JSON.parse(text);
        for (const moduleId of json.EnabledList) enabledModules.add(moduleId);
      }));
      for (const vanilla of [
        "BigButton",
        "Keypad",
        "Maze",
        "Wires",
        "Memory",
        "Password",
        "Simon",
        "Venn",
        "Morse",
        "WireSequence",
        "WhosOnFirst",
        "NeedyVentGas",
        "NeedyKnob",
        "NeedyCapacitor",
      ]) enabledModules.add(vanilla);
      const modulesCount = enabledModules.size;
      return { name, enabledModules: Object.fromEntries([...enabledModules].map((v) => [v, true])), modulesCount };
    } catch (error) {
      console.error(error);
      return null;
    }
  },
);

export const profileSelectors = {
  getName: (state: RootState) => state.profile.name,
  isLoading: (state: RootState) => state.profile.loading,
  getEnabledModules: (state: RootState) => state.profile.enabledModules,
  getEnabledModulesCount: (state: RootState) => state.profile.modulesCount,
};

export const profileActions = { ...profileSlice.actions, upload };
export const profileReducer = profileSlice.reducer;

import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface TestingState {
  isTestingMode: boolean;
  selectedUser: any | null;
  originalUser: any | null;
}

const initialState: TestingState = {
  isTestingMode: false,
  selectedUser: null,
  originalUser: null,
};

const testingSlice = createSlice({
  name: 'testing',
  initialState,
  reducers: {
    startTesting: (state, action: PayloadAction<{ selectedUser: any; originalUser: any }>) => {
      state.isTestingMode = true;
      state.selectedUser = action.payload.selectedUser;
      state.originalUser = action.payload.originalUser;
    },
    exitTesting: (state) => {
      state.isTestingMode = false;
      state.selectedUser = null;
      state.originalUser = null;
    },
  },
});

export const { startTesting, exitTesting } = testingSlice.actions;
export const selectTestingState = (state: any) => state.testing;
export default testingSlice.reducer;
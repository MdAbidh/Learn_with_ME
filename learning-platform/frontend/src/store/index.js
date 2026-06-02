import { configureStore } from '@reduxjs/toolkit';
import coursesReducer from './slices/coursesSlice';
import playerReducer from './slices/playerSlice';
import uiReducer from './slices/uiSlice';
import analyticsReducer from './slices/analyticsSlice';

export const store = configureStore({
  reducer: {
    courses: coursesReducer,
    player: playerReducer,
    ui: uiReducer,
    analytics: analyticsReducer,
  },
});

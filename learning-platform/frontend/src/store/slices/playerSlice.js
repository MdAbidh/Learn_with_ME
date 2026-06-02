import { createSlice } from '@reduxjs/toolkit';

const playerSlice = createSlice({
  name: 'player',
  initialState: {
    currentLesson: null,
    currentCourse: null,
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    volume: 1,
    playbackRate: 1,
    isFullscreen: false,
    isTheaterMode: false,
    isMiniPlayer: false,
    autoPlay: true,
    sessionId: null,
  },
  reducers: {
    setCurrentLesson: (state, action) => {
      state.currentLesson = action.payload;
    },
    setCurrentCourse: (state, action) => {
      state.currentCourse = action.payload;
    },
    setPlaying: (state, action) => {
      state.isPlaying = action.payload;
    },
    setCurrentTime: (state, action) => {
      state.currentTime = action.payload;
    },
    setDuration: (state, action) => {
      state.duration = action.payload;
    },
    setVolume: (state, action) => {
      state.volume = action.payload;
    },
    setPlaybackRate: (state, action) => {
      state.playbackRate = action.payload;
    },
    setFullscreen: (state, action) => {
      state.isFullscreen = action.payload;
    },
    setTheaterMode: (state, action) => {
      state.isTheaterMode = action.payload;
    },
    setMiniPlayer: (state, action) => {
      state.isMiniPlayer = action.payload;
    },
    setAutoPlay: (state, action) => {
      state.autoPlay = action.payload;
    },
    setSessionId: (state, action) => {
      state.sessionId = action.payload;
    },
  },
});

export const {
  setCurrentLesson, setCurrentCourse, setPlaying, setCurrentTime,
  setDuration, setVolume, setPlaybackRate, setFullscreen,
  setTheaterMode, setMiniPlayer, setAutoPlay, setSessionId,
} = playerSlice.actions;

export default playerSlice.reducer;

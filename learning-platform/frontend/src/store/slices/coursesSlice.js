import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../utils/api';

export const fetchCourses = createAsyncThunk('courses/fetchAll', async () => {
  const res = await api.get('/courses');
  return res.data;
});

export const fetchCourse = createAsyncThunk('courses/fetchOne', async (id) => {
  const res = await api.get(`/courses/${id}`);
  return res.data;
});

export const importCourse = createAsyncThunk('courses/import', async (folderPath) => {
  const res = await api.post('/courses/import', { folderPath });
  return res.data;
});

export const deleteCourse = createAsyncThunk('courses/delete', async (id) => {
  await api.delete(`/courses/${id}`);
  return id;
});

const coursesSlice = createSlice({
  name: 'courses',
  initialState: {
    list: [],
    current: null,
    loading: false,
    importing: false,
    error: null,
  },
  reducers: {
    clearError: (state) => { state.error = null; },
    clearCurrent: (state) => { state.current = null; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCourses.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchCourses.fulfilled, (state, action) => { state.loading = false; state.list = action.payload; })
      .addCase(fetchCourses.rejected, (state, action) => { state.loading = false; state.error = action.error.message; })
      .addCase(fetchCourse.pending, (state) => { state.loading = true; })
      .addCase(fetchCourse.fulfilled, (state, action) => { state.loading = false; state.current = action.payload; })
      .addCase(fetchCourse.rejected, (state, action) => { state.loading = false; state.error = action.error.message; })
      .addCase(importCourse.pending, (state) => { state.importing = true; state.error = null; })
      .addCase(importCourse.fulfilled, (state, action) => {
        state.importing = false;
        if (action.payload.course) state.list.unshift(action.payload.course);
      })
      .addCase(importCourse.rejected, (state, action) => { state.importing = false; state.error = action.error.message; })
      .addCase(deleteCourse.fulfilled, (state, action) => {
        state.list = state.list.filter(c => c.id !== action.payload);
      });
  },
});

export const { clearError, clearCurrent } = coursesSlice.actions;
export default coursesSlice.reducer;

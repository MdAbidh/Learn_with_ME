import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../utils/api';

export const fetchAnalytics = createAsyncThunk('analytics/fetch', async () => {
  const res = await api.get('/analytics');
  return res.data;
});

const analyticsSlice = createSlice({
  name: 'analytics',
  initialState: {
    data: null,
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchAnalytics.pending, (state) => { state.loading = true; })
      .addCase(fetchAnalytics.fulfilled, (state, action) => { state.loading = false; state.data = action.payload; })
      .addCase(fetchAnalytics.rejected, (state, action) => { state.loading = false; state.error = action.error.message; });
  },
});

export default analyticsSlice.reducer;

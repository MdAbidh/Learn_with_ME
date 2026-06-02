import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Flame, BookOpen, CheckCircle, Play, Clock, BarChart2 } from 'lucide-react';
import { fetchAnalytics } from '../store/slices/analyticsSlice';
import { formatDuration, formatDate } from '../utils/formatters';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid } from 'recharts';

export default function AnalyticsPage() {
  const dispatch = useDispatch();
  const { data, loading } = useSelector(s => s.analytics);

  useEffect(() => { dispatch(fetchAnalytics()); }, [dispatch]);

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="spinner" />
      </div>
    );
  }

  const dailyData  = (data.dailyTime  || []).map(d => ({ date: d.date?.slice(5),  minutes: Math.round((d.total_seconds || 0) / 60) }));
  const weeklyData = (data.weeklyTime || []).map(d => ({ week: d.week?.slice(5),   hours:   Math.round((d.total_seconds || 0) / 3600 * 10) / 10 }));

  const stats = [
    { icon: Flame,        label: 'Learning Streak',    value: `${data.streak || 0} days`,                  color: 'text-amber-500',  bg: 'bg-amber-50 dark:bg-amber-900/20' },
    { icon: BookOpen,     label: 'Total Courses',       value: data.totalCourses || 0,                      color: 'text-brand',      bg: 'bg-orange-50 dark:bg-orange-900/20' },
    { icon: CheckCircle,  label: 'Completed Courses',   value: data.completedCourses || 0,                  color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
    { icon: Play,         label: 'Total Lessons',       value: data.totalLessons || 0,                      color: 'text-blue-500',   bg: 'bg-blue-50 dark:bg-blue-900/20' },
    { icon: CheckCircle,  label: 'Completed Lessons',   value: data.completedLessons || 0,                  color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
    { icon: Clock,        label: 'Total Watch Time',    value: formatDuration(data.totalWatchTime || 0),    color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-900/20' },
  ];

  const tooltipStyle = {
    contentStyle: { background: '#1f1f28', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, fontSize: 12 },
    labelStyle:   { color: '#e5e7eb' },
  };

  return (
    <div className="space-y-6 fade-in">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center">
          <BarChart2 size={18} className="text-brand" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Analytics</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Track your learning progress and habits</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {stats.map(({ icon: Icon, label, value, color, bg }) => (
          <div key={label} className="card p-4">
            <div className={`w-8 h-8 rounded-lg ${bg} flex items-center justify-center mb-2`}>
              <Icon size={16} className={color} />
            </div>
            <div className="text-lg font-bold text-gray-900 dark:text-white">{value}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-tight">{label}</div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Daily Learning — Last 30 Days</h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={dailyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#9ca3af' }} />
              <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} />
              <Tooltip {...tooltipStyle} formatter={v => [`${v} min`, 'Learning Time']} />
              <Bar dataKey="minutes" fill="#f97316" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-5">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Weekly Learning — Last 12 Weeks</h3>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={weeklyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
              <XAxis dataKey="week" tick={{ fontSize: 10, fill: '#9ca3af' }} />
              <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} />
              <Tooltip {...tooltipStyle} formatter={v => [`${v}h`, 'Learning Hours']} />
              <Line type="monotone" dataKey="hours" stroke="#f97316" strokeWidth={2} dot={{ fill: '#f97316', r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Heatmap */}
      <div className="card p-5">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Learning Activity — Last Year</h3>
        <LearningHeatmap data={data.heatmap || []} />
      </div>

      {/* Recently Watched */}
      {data.recentlyWatched?.length > 0 && (
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Recently Watched</h3>
          <div className="space-y-2">
            {data.recentlyWatched.map(c => (
              <div key={c.id} className="flex items-center gap-3 py-2 border-b border-gray-100 dark:border-dark-border last:border-0">
                <div className="w-9 h-9 rounded-lg overflow-hidden shrink-0 bg-gray-100 dark:bg-dark-600">
                  {c.thumbnail
                    ? <img src={`http://localhost:5000${c.thumbnail}`} alt={c.name} className="w-full h-full object-cover" />
                    : <div className="w-full h-full flex items-center justify-center text-xs font-bold text-gray-400">
                        {c.name.slice(0,2).toUpperCase()}
                      </div>}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{c.name}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">{c.completed_lessons}/{c.total_lessons} lessons</p>
                </div>
                <span className="text-xs text-gray-400 dark:text-gray-500 shrink-0">{formatDate(c.last_watched)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function LearningHeatmap({ data }) {
  const map = {};
  data.forEach(d => { map[d.date] = d.total_seconds || 0; });

  const today = new Date();
  const days  = [];
  for (let i = 364; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().split('T')[0];
    days.push({ date: key, seconds: map[key] || 0 });
  }

  const getColor = (seconds) => {
    if (!seconds) return undefined;
    const mins = seconds / 60;
    if (mins < 15) return 'bg-orange-200 dark:bg-orange-900/40';
    if (mins < 30) return 'bg-orange-300 dark:bg-orange-700/60';
    if (mins < 60) return 'bg-orange-400 dark:bg-orange-600/80';
    return 'bg-brand dark:bg-brand';
  };

  const weeks = [];
  for (let i = 0; i < days.length; i += 7) weeks.push(days.slice(i, i + 7));

  return (
    <div>
      <div className="flex gap-1 overflow-x-auto pb-2">
        {weeks.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-1">
            {week.map((day, di) => (
              <div
                key={di}
                className={`w-3 h-3 rounded-sm ${getColor(day.seconds) || 'bg-gray-100 dark:bg-dark-600'}`}
                title={`${day.date}: ${Math.round(day.seconds / 60)} min`}
              />
            ))}
          </div>
        ))}
      </div>
      <div className="flex items-center gap-1.5 mt-2 text-xs text-gray-400 dark:text-gray-500">
        <span>Less</span>
        {['bg-gray-100 dark:bg-dark-600','bg-orange-200 dark:bg-orange-900/40','bg-orange-300 dark:bg-orange-700/60','bg-orange-400 dark:bg-orange-600/80','bg-brand'].map((c, i) => (
          <div key={i} className={`w-3 h-3 rounded-sm ${c}`} />
        ))}
        <span>More</span>
      </div>
    </div>
  );
}

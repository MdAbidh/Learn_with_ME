import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Flame, BookOpen, CheckCircle, Clock, FolderInput, ArrowRight, Play } from 'lucide-react';
import { fetchCourses, importCourse } from '../store/slices/coursesSlice';
import { fetchAnalytics } from '../store/slices/analyticsSlice';
import { showNotification } from '../store/slices/uiSlice';
import ProgressBar from '../components/UI/ProgressBar';
import { formatDuration, formatRelativeTime } from '../utils/formatters';
import { API_BASE_URL } from '../utils/api';

export default function Dashboard() {
  const dispatch  = useDispatch();
  const navigate  = useNavigate();
  const { list: courses, importing } = useSelector(s => s.courses);
  const { data: analytics }          = useSelector(s => s.analytics);

  useEffect(() => {
    dispatch(fetchCourses());
    dispatch(fetchAnalytics());
  }, [dispatch]);

  const handleImport = async () => {
    const folderPath = prompt('Enter the full path to your course folder:\n\nExample: C:\\Courses\\Java Masterclass');
    if (!folderPath?.trim()) return;
    try {
      const result = await dispatch(importCourse(folderPath.trim())).unwrap();
      dispatch(showNotification({ type: 'success', message: `"${result.course.name}" imported!` }));
      dispatch(fetchAnalytics());
      navigate(`/courses/${result.course.id}`);
    } catch (err) {
      dispatch(showNotification({ type: 'error', message: err.message }));
    }
  };

  const activeCourses = courses.filter(c => c.completed_lessons > 0 && !c.is_completed).slice(0, 4);
  const recentCourses = courses.slice(0, 6);
  const streak        = analytics?.streak || 0;
  const totalWatch    = analytics?.totalWatchTime || 0;
  const userName      = localStorage.getItem('user_name') || 'Learner';

  const stats = [
    { icon: Flame,        label: 'Day Streak',    value: `${streak}d`,                          color: 'text-amber-500',  bg: 'bg-amber-50 dark:bg-amber-900/20' },
    { icon: BookOpen,     label: 'Total Courses',  value: analytics?.totalCourses || courses.length, color: 'text-brand',  bg: 'bg-orange-50 dark:bg-orange-900/20' },
    { icon: CheckCircle,  label: 'Completed',      value: analytics?.completedCourses || 0,      color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
    { icon: Clock,        label: 'Watch Time',     value: formatDuration(totalWatch),             color: 'text-blue-500',   bg: 'bg-blue-50 dark:bg-blue-900/20' },
  ];

  return (
    <div className="space-y-8 fade-in">
      {/* Hero */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Welcome back, <span className="text-brand">{userName}</span>
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {courses.filter(c => !c.is_completed && c.completed_lessons > 0).length} courses in progress
          </p>
        </div>
        <button
          className="btn btn-primary"
          onClick={handleImport}
          disabled={importing}
        >
          <FolderInput size={15} />
          {importing ? 'Importing...' : 'Import Course'}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(({ icon: Icon, label, value, color, bg }) => (
          <div key={label} className="card p-4">
            <div className={`w-9 h-9 rounded-lg ${bg} flex items-center justify-center mb-3`}>
              <Icon size={18} className={color} />
            </div>
            <div className="text-xl font-bold text-gray-900 dark:text-white">{value}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{label}</div>
          </div>
        ))}
      </div>

      {/* Continue Learning */}
      {activeCourses.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">Continue Learning</h2>
            <button className="btn btn-sm btn-ghost text-brand" onClick={() => navigate('/courses')}>
              View all <ArrowRight size={13} />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {activeCourses.map(course => (
              <ContinueCard key={course.id} course={course} navigate={navigate} />
            ))}
          </div>
        </section>
      )}

      {/* Recent Courses */}
      {recentCourses.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">Recent Courses</h2>
            <button className="btn btn-sm btn-ghost text-brand" onClick={() => navigate('/courses')}>
              View all <ArrowRight size={13} />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {recentCourses.map(course => (
              <RecentCard key={course.id} course={course} navigate={navigate} />
            ))}
          </div>
        </section>
      )}

      {/* Empty state */}
      {courses.length === 0 && (
        <div className="card flex flex-col items-center py-20 text-center">
          <div className="w-16 h-16 rounded-2xl bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center mb-4">
            <BookOpen size={28} className="text-brand" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Start Your Learning Journey</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm mb-6">
            Import a course folder to get started. Videos are automatically organized into structured courses.
          </p>
          <button className="btn btn-primary" onClick={handleImport}>
            <FolderInput size={15} /> Import Your First Course
          </button>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-4">
            Supports MP4, MKV, AVI, MOV, TS and more. Subfolders become modules automatically.
          </p>
        </div>
      )}
    </div>
  );
}

function ContinueCard({ course, navigate }) {
  const pct = course.total_lessons > 0
    ? Math.round((course.completed_lessons / course.total_lessons) * 100) : 0;

  return (
    <div
      className="card p-4 cursor-pointer hover:shadow-md transition-all duration-150"
      onClick={() => navigate(`/courses/${course.id}`)}
    >
      <div className="flex items-start gap-3 mb-3">
        <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 bg-gray-100 dark:bg-dark-600">
          {course.thumbnail
            ? <img src={`${API_BASE_URL}${course.thumbnail}`} alt={course.name} className="w-full h-full object-cover" />
            : <div className="w-full h-full flex items-center justify-center text-xs font-bold text-gray-400">
                {course.name.slice(0,2).toUpperCase()}
              </div>}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white truncate">{course.name}</h4>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{course.completed_lessons}/{course.total_lessons} lessons</p>
        </div>
      </div>
      <ProgressBar value={course.completed_lessons} max={course.total_lessons} size="sm" />
      <div className="flex items-center justify-between mt-3">
        <span className="text-xs font-medium text-brand">{pct}%</span>
        <button className="w-7 h-7 rounded-full bg-brand flex items-center justify-center hover:bg-brand-dark transition-colors">
          <Play size={11} className="text-white ml-0.5" />
        </button>
      </div>
    </div>
  );
}

function RecentCard({ course, navigate }) {
  const pct = course.total_lessons > 0
    ? Math.round((course.completed_lessons / course.total_lessons) * 100) : 0;

  return (
    <div
      className="card flex items-center gap-3 p-3 cursor-pointer hover:shadow-md transition-all duration-150"
      onClick={() => navigate(`/courses/${course.id}`)}
    >
      <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0 bg-gray-100 dark:bg-dark-600">
        {course.thumbnail
          ? <img src={`${API_BASE_URL}${course.thumbnail}`} alt={course.name} className="w-full h-full object-cover" />
          : <div className="w-full h-full flex items-center justify-center text-sm font-bold text-gray-400">
              {course.name.slice(0,2).toUpperCase()}
            </div>}
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-semibold text-gray-900 dark:text-white truncate">{course.name}</h4>
        <div className="flex items-center gap-2 text-xs text-gray-400 dark:text-gray-500 mt-0.5">
          <span>{course.total_modules}M · {course.total_lessons}L</span>
          <span>·</span>
          <span>{formatRelativeTime(course.updated_at)}</span>
        </div>
        <div className="mt-1.5">
          <ProgressBar value={course.completed_lessons} max={course.total_lessons} size="sm" />
        </div>
      </div>
      {course.is_completed && (
        <CheckCircle size={16} className="text-emerald-500 shrink-0" />
      )}
    </div>
  );
}

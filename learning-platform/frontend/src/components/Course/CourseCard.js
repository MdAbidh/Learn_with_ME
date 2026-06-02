import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Layers, Play, CheckCircle, Trash2 } from 'lucide-react';
import ProgressBar from '../UI/ProgressBar';
import StarRating from '../UI/StarRating';
import { formatRelativeTime } from '../../utils/formatters';

export default function CourseCard({ course, onDelete, listView = false }) {
  const navigate = useNavigate();
  const pct = course.total_lessons > 0
    ? Math.round((course.completed_lessons / course.total_lessons) * 100)
    : 0;

  const statusLabel = pct === 0 ? 'Not Started' : pct === 100 ? 'Completed' : 'In Progress';
  const statusClass = pct === 100
    ? 'badge-success'
    : pct > 0
    ? 'badge-brand'
    : 'badge-muted';

  if (listView) {
    return (
      <div
        className="card flex items-center gap-4 p-4 cursor-pointer hover:-translate-y-0 hover:shadow-md"
        onClick={() => navigate(`/courses/${course.id}`)}
      >
        {/* Thumb */}
        <div className="w-14 h-14 rounded-lg overflow-hidden shrink-0 bg-gray-100 dark:bg-dark-600">
          {course.thumbnail
            ? <img src={`http://localhost:5000${course.thumbnail}`} alt={course.name} className="w-full h-full object-cover" />
            : <div className="w-full h-full flex items-center justify-center text-sm font-bold text-gray-400 dark:text-gray-500">
                {course.name.split(' ').slice(0,2).map(w => w[0]).join('').toUpperCase()}
              </div>}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-sm text-gray-900 dark:text-white truncate">{course.name}</h3>
            <span className={`badge ${statusClass} shrink-0`}>{statusLabel}</span>
          </div>
          <div className="flex items-center gap-3 text-xs text-gray-400 dark:text-gray-500 mb-2">
            <span className="flex items-center gap-1"><Layers size={11} />{course.total_modules} modules</span>
            <span className="flex items-center gap-1"><Play size={11} />{course.total_lessons} lessons</span>
            <span>{formatRelativeTime(course.updated_at)}</span>
          </div>
          <ProgressBar value={course.completed_lessons} max={course.total_lessons} size="sm" />
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <StarRating value={course.user_rating || course.rating || 0} readonly size={13} />
          <button
            className="btn-icon btn-ghost text-gray-400 hover:text-red-500"
            onClick={e => { e.stopPropagation(); onDelete?.(); }}
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="card cursor-pointer group overflow-hidden p-0 fade-in"
      onClick={() => navigate(`/courses/${course.id}`)}
    >
      {/* Thumbnail */}
      <div className="relative h-36 bg-gray-100 dark:bg-dark-600 overflow-hidden">
        {course.thumbnail
          ? <img src={`http://localhost:5000${course.thumbnail}`} alt={course.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
          : <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-gray-300 dark:text-gray-600">
              {course.name.split(' ').slice(0,2).map(w => w[0]).join('').toUpperCase()}
            </div>}
        <div className="absolute top-2 right-2">
          <span className={`badge ${statusClass}`}>{statusLabel}</span>
        </div>
        {pct > 0 && pct < 100 && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-200/50">
            <div className="h-full bg-brand transition-all" style={{ width: `${pct}%` }} />
          </div>
        )}
        {pct === 100 && (
          <div className="absolute inset-0 bg-emerald-500/10 flex items-center justify-center">
            <CheckCircle size={32} className="text-emerald-500 opacity-80" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-4">
        <h3 className="font-semibold text-sm text-gray-900 dark:text-white mb-2 line-clamp-2 leading-snug">
          {course.name}
        </h3>

        <div className="flex items-center gap-3 text-xs text-gray-400 dark:text-gray-500 mb-3">
          <span className="flex items-center gap-1"><Layers size={11} />{course.total_modules}</span>
          <span className="flex items-center gap-1"><Play size={11} />{course.total_lessons} lessons</span>
        </div>

        <ProgressBar value={course.completed_lessons} max={course.total_lessons} size="sm" />

        <div className="flex items-center justify-between mt-3">
          <StarRating value={course.user_rating || course.rating || 0} readonly size={13} />
          <div className="flex items-center gap-1">
            <button
              className="btn-icon btn-ghost text-gray-400 hover:text-red-500 p-1"
              onClick={e => { e.stopPropagation(); onDelete?.(); }}
            >
              <Trash2 size={13} />
            </button>
            <button
              className="btn btn-sm btn-primary py-1 px-2.5 text-xs"
              onClick={e => { e.stopPropagation(); navigate(`/courses/${course.id}`); }}
            >
              {pct === 0 ? 'Start' : pct === 100 ? 'Review' : 'Continue'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

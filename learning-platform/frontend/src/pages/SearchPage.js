import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, BookOpen, Play, FileText, Bookmark, Layers, ArrowRight, X } from 'lucide-react';
import api from '../utils/api';
import { formatTimestamp } from '../utils/formatters';

const TYPE_META = {
  course:   { label: 'Course',   Icon: BookOpen,  color: 'text-brand' },
  module:   { label: 'Module',   Icon: Layers,    color: 'text-blue-500' },
  lesson:   { label: 'Lesson',   Icon: Play,      color: 'text-emerald-500' },
  note:     { label: 'Note',     Icon: FileText,  color: 'text-purple-500' },
  bookmark: { label: 'Bookmark', Icon: Bookmark,  color: 'text-amber-500' },
};

export default function SearchPage() {
  const navigate = useNavigate();
  const [query,      setQuery]      = useState('');
  const [results,    setResults]    = useState(null);
  const [loading,    setLoading]    = useState(false);
  const [activeType, setActiveType] = useState('all');

  const doSearch = useCallback(async (q) => {
    if (q.trim().length < 2) { setResults(null); return; }
    setLoading(true);
    try {
      const res = await api.get(`/search?q=${encodeURIComponent(q)}`);
      setResults(res.data);
    } catch (e) {}
    setLoading(false);
  }, []);

  const handleChange = (e) => {
    const q = e.target.value;
    setQuery(q);
    clearTimeout(window._searchTimer);
    window._searchTimer = setTimeout(() => doSearch(q), 300);
  };

  const allResults = results ? [
    ...(results.courses   || []),
    ...(results.modules   || []),
    ...(results.lessons   || []),
    ...(results.notes     || []),
    ...(results.bookmarks || []),
  ] : [];

  const total    = allResults.length;
  const filtered = activeType === 'all' ? allResults : allResults.filter(r => r.type === activeType);

  const handleClick = (r) => {
    if (r.type === 'course')   navigate(`/courses/${r.id}`);
    else if (r.type === 'lesson')   navigate(`/player/${r.course_id}/${r.id}`);
    else if (r.type === 'module')   navigate(`/courses/${r.course_id}`);
    else if (r.type === 'note')     navigate(`/player/${r.course_id}/${r.lesson_id}?t=${r.timestamp}`);
    else if (r.type === 'bookmark') navigate(`/player/${r.course_id}/${r.lesson_id}?t=${r.timestamp}`);
  };

  return (
    <div className="space-y-6 fade-in max-w-3xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Search</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">Search across courses, lessons, notes, and bookmarks</p>
      </div>

      {/* Search box */}
      <div className="relative">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        <input
          className="input pl-10 pr-10 py-3 text-base"
          placeholder="Type to search..."
          value={query}
          onChange={handleChange}
          autoFocus
        />
        {loading && (
          <div className="absolute right-3.5 top-1/2 -translate-y-1/2 spinner w-4 h-4" />
        )}
        {query && !loading && (
          <button
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            onClick={() => { setQuery(''); setResults(null); }}
          >
            <X size={15} />
          </button>
        )}
      </div>

      {/* Results */}
      {results && (
        <>
          {/* Type filters */}
          <div className="flex flex-wrap gap-2">
            {['all', 'course', 'lesson', 'module', 'note', 'bookmark'].map(type => {
              const count = type === 'all' ? total : allResults.filter(r => r.type === type).length;
              if (type !== 'all' && count === 0) return null;
              return (
                <button
                  key={type}
                  onClick={() => setActiveType(type)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150
                    ${activeType === type
                      ? 'bg-brand text-white'
                      : 'bg-gray-100 dark:bg-dark-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-dark-600'}`}
                >
                  {type === 'all' ? 'All' : TYPE_META[type]?.label + 's'}
                  <span className={`px-1.5 py-0.5 rounded-full text-xs ${activeType === type ? 'bg-white/20' : 'bg-gray-200 dark:bg-dark-600'}`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {filtered.length === 0 ? (
            <div className="empty-state card py-16">
              <Search size={32} className="text-gray-300 dark:text-gray-600" />
              <h3>No results found</h3>
              <p>Try a different search term</p>
            </div>
          ) : (
            <div className="space-y-1.5">
              {filtered.map((r, i) => {
                const meta = TYPE_META[r.type] || TYPE_META.course;
                const { Icon, color, label } = meta;
                return (
                  <div
                    key={`${r.type}-${r.id}-${i}`}
                    className="card flex items-center gap-3 p-3.5 cursor-pointer hover:shadow-md"
                    onClick={() => handleClick(r)}
                  >
                    <div className={`w-8 h-8 rounded-lg bg-gray-100 dark:bg-dark-600 flex items-center justify-center shrink-0`}>
                      <Icon size={15} className={color} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {r.type === 'note'
                          ? r.content?.substring(0, 80) + (r.content?.length > 80 ? '...' : '')
                          : r.name || r.title}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className={`text-xs font-medium ${color}`}>{label}</span>
                        {r.course_name && <span className="text-xs text-gray-400 dark:text-gray-500">· {r.course_name}</span>}
                        {r.module_name && <span className="text-xs text-gray-400 dark:text-gray-500">· {r.module_name}</span>}
                        {(r.type === 'note' || r.type === 'bookmark') && r.timestamp > 0 && (
                          <span className="text-xs text-gray-400 dark:text-gray-500">· {formatTimestamp(r.timestamp)}</span>
                        )}
                      </div>
                    </div>
                    <ArrowRight size={14} className="text-gray-300 dark:text-gray-600 shrink-0" />
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Empty / Tips */}
      {!results && !loading && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { Icon: BookOpen,  text: 'Search by course name',  color: 'text-brand' },
            { Icon: Play,      text: 'Find specific lessons',   color: 'text-emerald-500' },
            { Icon: FileText,  text: 'Search your notes',       color: 'text-purple-500' },
            { Icon: Bookmark,  text: 'Find bookmarks',          color: 'text-amber-500' },
          ].map(({ Icon, text, color }) => (
            <div key={text} className="card p-4 flex flex-col items-center text-center gap-2">
              <Icon size={20} className={color} />
              <p className="text-xs text-gray-500 dark:text-gray-400">{text}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Search, Sun, Moon, BookOpen, Play, FileText, Bookmark, X } from 'lucide-react';
import { setTheme } from '../../store/slices/uiSlice';
import api from '../../utils/api';

const TYPE_ICON = {
  course:   <BookOpen size={13} />,
  lesson:   <Play size={13} />,
  note:     <FileText size={13} />,
  bookmark: <Bookmark size={13} />,
};

export default function Header() {
  const dispatch  = useDispatch();
  const navigate  = useNavigate();
  const theme     = useSelector(s => s.ui.theme);
  const [query,     setQuery]     = useState('');
  const [results,   setResults]   = useState(null);
  const [searching, setSearching] = useState(false);

  const handleSearch = useCallback(async (q) => {
    setQuery(q);
    if (q.trim().length < 2) { setResults(null); return; }
    setSearching(true);
    try {
      const res = await api.get(`/search?q=${encodeURIComponent(q)}`);
      setResults(res.data);
    } catch (e) {}
    setSearching(false);
  }, []);

  const handleResultClick = (result) => {
    setResults(null);
    setQuery('');
    if (result.type === 'course')   navigate(`/courses/${result.id}`);
    else if (result.type === 'lesson')   navigate(`/player/${result.course_id}/${result.id}`);
    else if (result.type === 'module')   navigate(`/courses/${result.course_id}`);
    else if (result.type === 'note' || result.type === 'bookmark')
      navigate(`/player/${result.course_id}/${result.lesson_id}`);
  };

  const totalResults = results ? Object.values(results).flat().length : 0;

  return (
    <header className="h-14 flex items-center gap-4 px-6 border-b border-gray-200 bg-white dark:bg-dark-800 dark:border-dark-border shrink-0">
      {/* Search */}
      <div className="relative flex-1 max-w-md">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        <input
          className="w-full pl-9 pr-8 py-1.5 text-sm rounded-lg border border-gray-200 bg-gray-50
                     text-gray-900 placeholder-gray-400 outline-none transition-all duration-150
                     focus:border-brand focus:ring-2 focus:ring-brand/20 focus:bg-white
                     dark:bg-dark-700 dark:border-dark-border dark:text-gray-100 dark:placeholder-gray-500
                     dark:focus:bg-dark-600"
          placeholder="Search courses, lessons, notes..."
          value={query}
          onChange={e => handleSearch(e.target.value)}
          onBlur={() => setTimeout(() => setResults(null), 200)}
        />
        {query && (
          <button
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            onMouseDown={() => { setQuery(''); setResults(null); }}
          >
            <X size={13} />
          </button>
        )}
        {searching && (
          <div className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full border-2 border-gray-200 border-t-brand animate-spin" />
        )}

        {/* Dropdown */}
        {results && totalResults > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1.5 bg-white dark:bg-dark-700 border border-gray-200 dark:border-dark-border rounded-xl shadow-lg z-50 overflow-hidden">
            {['courses','lessons','notes','bookmarks'].map(key => {
              const items = results[key];
              if (!items?.length) return null;
              return (
                <div key={key}>
                  <div className="px-3 py-1.5 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider bg-gray-50 dark:bg-dark-800">
                    {key}
                  </div>
                  {items.map(r => (
                    <div
                      key={r.id}
                      className="flex items-center gap-2.5 px-3 py-2 text-sm cursor-pointer
                                 hover:bg-gray-50 dark:hover:bg-dark-600 text-gray-700 dark:text-gray-300"
                      onMouseDown={() => handleResultClick(r)}
                    >
                      <span className="text-gray-400 dark:text-gray-500">{TYPE_ICON[r.type]}</span>
                      <span className="truncate">{r.name || r.title || r.content?.substring(0,50)}</span>
                      {r.course_name && (
                        <span className="ml-auto text-xs text-gray-400 dark:text-gray-500 shrink-0">{r.course_name}</span>
                      )}
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        )}
        {results && totalResults === 0 && (
          <div className="absolute top-full left-0 right-0 mt-1.5 bg-white dark:bg-dark-700 border border-gray-200 dark:border-dark-border rounded-xl shadow-lg z-50 px-4 py-3 text-sm text-gray-400">
            No results for "{query}"
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 ml-auto">
        {/* Theme toggle */}
        <button
          onClick={() => dispatch(setTheme(theme === 'dark' ? 'light' : 'dark'))}
          className="btn-icon btn-ghost"
          title="Toggle theme"
        >
          {theme === 'dark'
            ? <Sun size={16} className="text-gray-400" />
            : <Moon size={16} className="text-gray-500" />}
        </button>
      </div>
    </header>
  );
}

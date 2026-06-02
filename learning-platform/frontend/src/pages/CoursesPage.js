import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { FolderInput, LayoutGrid, List, BookOpen } from 'lucide-react';
import { fetchCourses, importCourse, deleteCourse } from '../store/slices/coursesSlice';
import { showNotification } from '../store/slices/uiSlice';
import CourseCard from '../components/Course/CourseCard';

const FILTERS = ['All', 'In Progress', 'Completed', 'Not Started'];
const SORTS   = ['Recent', 'Name', 'Progress', 'Rating'];

export default function CoursesPage() {
  const dispatch  = useDispatch();
  const navigate  = useNavigate();
  const { list: courses, loading, importing } = useSelector(s => s.courses);
  const [filter, setFilter] = useState('All');
  const [sort,   setSort]   = useState('Recent');
  const [search, setSearch] = useState('');
  const [view,   setView]   = useState('grid');

  useEffect(() => { dispatch(fetchCourses()); }, [dispatch]);

  const handleImport = async () => {
    const folderPath = prompt('Enter the full path to your course folder:\n\nExample: C:\\Courses\\Java Masterclass');
    if (!folderPath?.trim()) return;
    try {
      const result = await dispatch(importCourse(folderPath.trim())).unwrap();
      dispatch(showNotification({ type: 'success', message: `"${result.course.name}" imported!` }));
      navigate(`/courses/${result.course.id}`);
    } catch (err) {
      dispatch(showNotification({ type: 'error', message: err.message }));
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Remove "${name}" from your library?\n\nThis won't delete the original files.`)) return;
    await dispatch(deleteCourse(id));
    dispatch(showNotification({ type: 'success', message: 'Course removed from library' }));
  };

  const counts = {
    All:         courses.length,
    'In Progress': courses.filter(c => c.completed_lessons > 0 && !c.is_completed).length,
    Completed:   courses.filter(c => c.is_completed).length,
    'Not Started': courses.filter(c => c.completed_lessons === 0).length,
  };

  const filtered = courses
    .filter(c => {
      if (search && !c.name.toLowerCase().includes(search.toLowerCase())) return false;
      if (filter === 'In Progress') return c.completed_lessons > 0 && !c.is_completed;
      if (filter === 'Completed')   return c.is_completed;
      if (filter === 'Not Started') return c.completed_lessons === 0;
      return true;
    })
    .sort((a, b) => {
      if (sort === 'Name')     return a.name.localeCompare(b.name);
      if (sort === 'Progress') {
        const pa = a.total_lessons ? a.completed_lessons / a.total_lessons : 0;
        const pb = b.total_lessons ? b.completed_lessons / b.total_lessons : 0;
        return pb - pa;
      }
      if (sort === 'Rating') return (b.rating || 0) - (a.rating || 0);
      return new Date(b.updated_at) - new Date(a.updated_at);
    });

  return (
    <div className="space-y-6 fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Courses</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{courses.length} courses in your library</p>
        </div>
        <button className="btn btn-primary" onClick={handleImport} disabled={importing}>
          <FolderInput size={15} />
          {importing ? 'Importing...' : 'Import Course'}
        </button>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Filter tabs */}
        <div className="flex items-center gap-1 bg-gray-100 dark:bg-dark-700 rounded-lg p-1">
          {FILTERS.map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-150 flex items-center gap-1.5
                ${filter === f
                  ? 'bg-white dark:bg-dark-500 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
            >
              {f}
              <span className={`text-xs px-1.5 py-0.5 rounded-full
                ${filter === f ? 'bg-brand/10 text-brand' : 'bg-gray-200 dark:bg-dark-600 text-gray-400'}`}>
                {counts[f]}
              </span>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 ml-auto">
          <input
            className="input w-44 py-1.5 text-xs"
            placeholder="Filter courses..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <select
            className="input w-32 py-1.5 text-xs"
            value={sort}
            onChange={e => setSort(e.target.value)}
          >
            {SORTS.map(s => <option key={s}>{s}</option>)}
          </select>
          <div className="flex items-center bg-gray-100 dark:bg-dark-700 rounded-lg p-1 gap-0.5">
            <button
              onClick={() => setView('grid')}
              className={`p-1.5 rounded-md transition-all ${view === 'grid' ? 'bg-white dark:bg-dark-500 shadow-sm text-brand' : 'text-gray-400 hover:text-gray-600'}`}
            >
              <LayoutGrid size={14} />
            </button>
            <button
              onClick={() => setView('list')}
              className={`p-1.5 rounded-md transition-all ${view === 'list' ? 'bg-white dark:bg-dark-500 shadow-sm text-brand' : 'text-gray-400 hover:text-gray-600'}`}
            >
              <List size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[1,2,3,4,5,6].map(i => (
            <div key={i} className="skeleton h-64 rounded-xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card flex flex-col items-center py-16 text-center">
          <BookOpen size={36} className="text-gray-300 dark:text-gray-600 mb-3" />
          <h3 className="text-base font-semibold text-gray-700 dark:text-gray-300 mb-1">
            {search || filter !== 'All' ? 'No courses match your filter' : 'No courses yet'}
          </h3>
          <p className="text-sm text-gray-400 mb-4">
            {search || filter !== 'All' ? 'Try a different filter or search term' : 'Import a course folder to get started'}
          </p>
          {!search && filter === 'All' && (
            <button className="btn btn-primary" onClick={handleImport}>
              <FolderInput size={14} /> Import Course
            </button>
          )}
        </div>
      ) : view === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map(course => (
            <CourseCard key={course.id} course={course} onDelete={() => handleDelete(course.id, course.name)} />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(course => (
            <CourseCard key={course.id} course={course} onDelete={() => handleDelete(course.id, course.name)} listView />
          ))}
        </div>
      )}
    </div>
  );
}

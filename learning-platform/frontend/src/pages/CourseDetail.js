import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  Play, Trash2, Award, Download, ChevronDown, ChevronRight,
  Lock, CheckCircle, Circle, Layers, FileText, Bookmark,
  Paperclip, FileIcon, Clock, ArrowLeft, Camera, Pencil,
  Unlock, RefreshCw, X, Check
} from 'lucide-react';
import { fetchCourse, deleteCourse } from '../store/slices/coursesSlice';
import { showNotification } from '../store/slices/uiSlice';
import ProgressBar from '../components/UI/ProgressBar';
import StarRating from '../components/UI/StarRating';
import { formatDuration, formatDate } from '../utils/formatters';
import api from '../utils/api';

const TABS = [
  { key: 'curriculum', label: 'Curriculum',  Icon: Layers },
  { key: 'notes',      label: 'Notes',        Icon: FileText },
  { key: 'bookmarks',  label: 'Bookmarks',    Icon: Bookmark },
  { key: 'resources',  label: 'Resources',    Icon: Paperclip },
];

export default function CourseDetail() {
  const { id }       = useParams();
  const dispatch     = useDispatch();
  const navigate     = useNavigate();
  const { current: course, loading } = useSelector(s => s.courses);
  const [activeTab,       setActiveTab]       = useState('curriculum');
  const [expandedModules, setExpandedModules] = useState({});
  const [notes,           setNotes]           = useState([]);
  const [bookmarks,       setBookmarks]       = useState([]);
  const [certificate,     setCertificate]     = useState(null);
  const [rating,          setRating]          = useState(0);
  const [editingName,     setEditingName]     = useState(false);
  const [editingDesc,     setEditingDesc]     = useState(false);
  const [nameVal,         setNameVal]         = useState('');
  const [descVal,         setDescVal]         = useState('');
  const thumbInputRef = useRef(null);

  useEffect(() => { dispatch(fetchCourse(id)); }, [id, dispatch]);

  useEffect(() => {
    if (course) {
      if (course.modules?.length > 0) setExpandedModules({ [course.modules[0].id]: true });
      setRating(course.rating || 0);
      setNameVal(course.name || '');
      setDescVal(course.description || '');
      loadNotes();
      loadBookmarks();
      if (course.is_completed) loadCertificate();
    }
  }, [course?.id]);

  const loadNotes      = async () => { try { const r = await api.get(`/notes/course/${id}`);      setNotes(r.data);       } catch (e) {} };
  const loadBookmarks  = async () => { try { const r = await api.get(`/bookmarks/course/${id}`);  setBookmarks(r.data);   } catch (e) {} };
  const loadCertificate= async () => { try { const r = await api.get(`/certificates/${id}`);      setCertificate(r.data); } catch (e) {} };

  const handleContinue = async () => {
    try {
      const res = await api.get(`/progress/resume/${id}`);
      const lesson = res.data;
      if (lesson) navigate(`/player/${id}/${lesson.id}`);
      else if (course.modules?.[0]?.lessons?.[0]) navigate(`/player/${id}/${course.modules[0].lessons[0].id}`);
    } catch (e) {
      if (course.modules?.[0]?.lessons?.[0]) navigate(`/player/${id}/${course.modules[0].lessons[0].id}`);
    }
  };

  const handleRate = async (val) => {
    setRating(val);
    await api.post(`/courses/${id}/rate`, { rating: val });
    dispatch(showNotification({ type: 'success', message: 'Rating saved!' }));
  };

  const handleDelete = async () => {
    if (!window.confirm(`Remove "${course.name}" from your library?`)) return;
    await dispatch(deleteCourse(id));
    navigate('/courses');
  };

  const handleGenerateCert = async () => {
    try {
      const res = await api.post(`/certificates/${id}/generate`);
      setCertificate(res.data);
      dispatch(showNotification({ type: 'success', message: 'Certificate generated!' }));
    } catch (e) {
      dispatch(showNotification({ type: 'error', message: e.message }));
    }
  };

  const handleThumbnailUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('thumbnail', file);
    try {
      await api.post(`/courses/${id}/thumbnail`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      dispatch(showNotification({ type: 'success', message: 'Thumbnail updated!' }));
      dispatch(fetchCourse(id));
    } catch (e) {
      dispatch(showNotification({ type: 'error', message: 'Failed to upload thumbnail' }));
    }
  };

  const handleUnlockAll = async () => {
    try {
      await api.post(`/courses/${id}/unlock-all`);
      dispatch(showNotification({ type: 'success', message: 'All lessons unlocked!' }));
      dispatch(fetchCourse(id));
    } catch (e) {
      dispatch(showNotification({ type: 'error', message: e.message }));
    }
  };

  const handleSaveName = async () => {
    if (!nameVal.trim()) return;
    await api.put(`/courses/${id}`, { name: nameVal, description: descVal, tags: course.tags || [] });
    dispatch(showNotification({ type: 'success', message: 'Course updated!' }));
    dispatch(fetchCourse(id));
    setEditingName(false);
    setEditingDesc(false);
  };

  if (loading || !course) {
    return (
      <div className="space-y-4">
        <div className="skeleton h-48 rounded-xl" />
        <div className="skeleton h-96 rounded-xl" />
      </div>
    );
  }

  const pct = course.total_lessons > 0
    ? Math.round((course.completed_lessons / course.total_lessons) * 100) : 0;

  return (
    <div className="space-y-6 fade-in">
      {/* Back */}
      <button
        className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-brand transition-colors"
        onClick={() => navigate('/courses')}
      >
        <ArrowLeft size={14} /> Back to Courses
      </button>

      {/* Hero */}
      <div className="card p-0 overflow-hidden">
        <div className="flex flex-col md:flex-row">
          {/* Thumbnail */}
          <div className="relative w-full md:w-64 h-48 md:h-auto shrink-0 bg-gray-100 dark:bg-dark-600 group">
            {course.thumbnail
              ? <img src={`http://localhost:5000${course.thumbnail}`} alt={course.name} className="w-full h-full object-cover" />
              : <div className="w-full h-full flex items-center justify-center text-3xl font-bold text-gray-300 dark:text-gray-600">
                  {course.name.slice(0,2).toUpperCase()}
                </div>}
            {/* Upload overlay */}
            <label className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
              <div className="flex flex-col items-center gap-1 text-white">
                <Camera size={20} />
                <span className="text-xs font-medium">Change Photo</span>
              </div>
              <input type="file" accept="image/*" className="hidden" ref={thumbInputRef} onChange={handleThumbnailUpload} />
            </label>
          </div>

          {/* Info */}
          <div className="flex-1 p-6">
            <div className="flex flex-wrap gap-2 mb-3">
              {course.is_completed && <span className="badge badge-success"><CheckCircle size={11} className="mr-1" />Completed</span>}
              {pct > 0 && !course.is_completed && <span className="badge badge-brand">In Progress</span>}
              {pct === 0 && <span className="badge badge-muted">Not Started</span>}
            </div>

            {/* Editable name */}
            {editingName ? (
              <div className="flex items-center gap-2 mb-2">
                <input className="input text-lg font-bold flex-1" value={nameVal} onChange={e => setNameVal(e.target.value)} autoFocus onKeyDown={e => e.key === 'Enter' && handleSaveName()} />
                <button className="btn-icon btn-ghost text-emerald-500" onClick={handleSaveName}><Check size={16} /></button>
                <button className="btn-icon btn-ghost text-gray-400" onClick={() => setEditingName(false)}><X size={16} /></button>
              </div>
            ) : (
              <div className="flex items-center gap-2 mb-2 group/name">
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">{course.name}</h1>
                <button className="opacity-0 group-hover/name:opacity-100 btn-icon btn-ghost p-1" onClick={() => setEditingName(true)}><Pencil size={13} /></button>
              </div>
            )}

            {/* Editable description */}
            {editingDesc ? (
              <div className="flex flex-col gap-2 mb-3">
                <textarea className="input text-sm" rows={2} value={descVal} onChange={e => setDescVal(e.target.value)} placeholder="Add a description..." autoFocus />
                <div className="flex gap-2">
                  <button className="btn btn-sm btn-primary" onClick={handleSaveName}>Save</button>
                  <button className="btn btn-sm btn-secondary" onClick={() => setEditingDesc(false)}>Cancel</button>
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-2 mb-3 group/desc">
                <p className="text-sm text-gray-500 dark:text-gray-400 flex-1">
                  {course.description || <span className="italic text-gray-300 dark:text-gray-600">No description — click to add</span>}
                </p>
                <button className="opacity-0 group-hover/desc:opacity-100 btn-icon btn-ghost p-1 shrink-0" onClick={() => setEditingDesc(true)}><Pencil size={13} /></button>
              </div>
            )}
            <div className="flex flex-wrap gap-4 text-xs text-gray-500 dark:text-gray-400 mb-4">
              <span className="flex items-center gap-1"><Layers size={12} />{course.total_modules} modules</span>
              <span className="flex items-center gap-1"><Play size={12} />{course.total_lessons} lessons</span>
              <span className="flex items-center gap-1"><CheckCircle size={12} />{course.completed_lessons} completed</span>
              {course.total_duration > 0 && <span className="flex items-center gap-1"><Clock size={12} />{formatDuration(course.total_duration)}</span>}
            </div>

            <div className="mb-4">
              <ProgressBar value={course.completed_lessons} max={course.total_lessons} showLabel size="md" />
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button className="btn btn-primary" onClick={handleContinue}>
                <Play size={14} />
                {pct === 0 ? 'Start Course' : pct === 100 ? 'Review Course' : 'Continue Learning'}
              </button>
              <StarRating value={rating} onChange={handleRate} size={18} />
              <button className="btn btn-ghost text-gray-500 hover:text-brand" onClick={handleUnlockAll} title="Unlock all lessons">
                <Unlock size={14} /> Unlock All
              </button>
              <button className="btn btn-ghost text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20" onClick={handleDelete}>
                <Trash2 size={14} /> Remove
              </button>
            </div>

            {course.tags?.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-4">
                {course.tags.map(tag => (
                  <span key={tag} className="badge badge-muted text-xs">{tag}</span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Completion Banner */}
      {course.is_completed && (
        <div className="card p-4 border-l-4 border-l-emerald-500 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
              <Award size={20} className="text-emerald-500" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Course Completed</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Completed on {formatDate(course.completion_date)} · {course.total_lessons} lessons
              </p>
            </div>
          </div>
          {certificate ? (
            <a
              href={`http://localhost:5000/api/certificates/${certificate.certificate_id}/download`}
              className="btn btn-sm btn-secondary"
              target="_blank" rel="noreferrer"
            >
              <Download size={13} /> Certificate
            </a>
          ) : (
            <button className="btn btn-sm btn-primary" onClick={handleGenerateCert}>
              <Award size={13} /> Generate Certificate
            </button>
          )}
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-dark-border">
        <div className="flex gap-0">
          {TABS.map(({ key, label, Icon }) => {
            const count = key === 'notes' ? notes.length : key === 'bookmarks' ? bookmarks.length : null;
            return (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-all duration-150
                  ${activeTab === key
                    ? 'border-brand text-brand'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
              >
                <Icon size={14} />
                {label}
                {count !== null && count > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 rounded-full text-xs bg-brand/10 text-brand">{count}</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'curriculum' && (
          <div className="space-y-2">
            {course.modules?.map((mod, modIdx) => {
              const modPct = mod.total_lessons > 0
                ? Math.round((mod.completed_lessons / mod.total_lessons) * 100) : 0;
              const isExpanded = expandedModules[mod.id];
              return (
                <div key={mod.id} className="card p-0 overflow-hidden">
                  <div
                    className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-dark-600 transition-colors"
                    onClick={() => setExpandedModules(p => ({ ...p, [mod.id]: !p[mod.id] }))}
                  >
                    {isExpanded ? <ChevronDown size={15} className="text-gray-400 shrink-0" /> : <ChevronRight size={15} className="text-gray-400 shrink-0" />}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-white truncate">{mod.name}</h3>
                      <p className="text-xs text-gray-400 dark:text-gray-500">{mod.total_lessons} lessons · {modPct}% complete</p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="w-20">
                        <ProgressBar value={mod.completed_lessons} max={mod.total_lessons} size="sm" />
                      </div>
                      {!mod.is_unlocked && modIdx > 0 && <Lock size={13} className="text-gray-400" />}
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="border-t border-gray-100 dark:border-dark-border">
                      {mod.lessons?.map(lesson => (
                        <div
                          key={lesson.id}
                          className={`flex items-center gap-3 px-4 py-2.5 text-sm border-b border-gray-50 dark:border-dark-border last:border-0
                            cursor-pointer hover:bg-gray-50 dark:hover:bg-dark-600
                            ${lesson.is_current ? 'bg-orange-50/50 dark:bg-orange-900/10' : ''}`}
                          onClick={() => navigate(`/player/${id}/${lesson.id}`)}
                        >
                          <span className="shrink-0">
                            {lesson.is_completed
                              ? <CheckCircle size={14} className="text-emerald-500" />
                              : lesson.is_current
                              ? <Play size={14} className="text-brand" />
                              : <Circle size={14} className="text-red-400/70" />}
                          </span>
                          <span className={`flex-1 truncate ${lesson.is_current ? 'font-medium text-brand' : 'text-gray-700 dark:text-gray-300'}`}>
                            {lesson.name}
                          </span>
                          {lesson.duration > 0 && (
                            <span className="text-xs text-gray-400 dark:text-gray-500 shrink-0">{formatDuration(lesson.duration)}</span>
                          )}
                        </div>
                      ))}
                      {mod.resources?.length > 0 && (
                        <div className="px-4 py-2 bg-gray-50 dark:bg-dark-800">
                          <p className="text-xs font-medium text-gray-400 dark:text-gray-500 mb-1.5">Resources</p>
                          {mod.resources.map(res => (
                            <a
                              key={res.id}
                              href={`http://localhost:5000/api/video/resource/${res.id}`}
                              target="_blank" rel="noreferrer"
                              className="flex items-center gap-2 py-1 text-xs text-gray-600 dark:text-gray-400 hover:text-brand transition-colors"
                            >
                              <FileIcon size={12} />
                              <span className="truncate">{res.name}</span>
                              <span className="text-gray-400 uppercase">.{res.file_type}</span>
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {activeTab === 'notes' && (
          <div className="space-y-3">
            {notes.length === 0 ? (
              <div className="empty-state card py-16">
                <FileText size={32} className="text-gray-300 dark:text-gray-600" />
                <h3>No notes yet</h3>
                <p>Add notes while watching lessons to see them here</p>
              </div>
            ) : notes.map(note => (
              <div
                key={note.id}
                className="card p-4 cursor-pointer hover:shadow-md"
                onClick={() => navigate(`/player/${id}/${note.lesson_id}?t=${note.timestamp}`)}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="badge badge-brand text-xs">{formatDuration(note.timestamp)}</span>
                  <span className="text-xs text-gray-400 dark:text-gray-500">{note.lesson_name}</span>
                </div>
                <p className="text-sm text-gray-700 dark:text-gray-300">{note.content}</p>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'bookmarks' && (
          <div className="space-y-2">
            {bookmarks.length === 0 ? (
              <div className="empty-state card py-16">
                <Bookmark size={32} className="text-gray-300 dark:text-gray-600" />
                <h3>No bookmarks yet</h3>
                <p>Bookmark important moments while watching</p>
              </div>
            ) : bookmarks.map(bm => (
              <div
                key={bm.id}
                className="card flex items-center gap-3 p-3 cursor-pointer hover:shadow-md"
                onClick={() => navigate(`/player/${id}/${bm.lesson_id}?t=${bm.timestamp}`)}
              >
                <span className="badge badge-brand text-xs shrink-0">{formatDuration(bm.timestamp)}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{bm.title}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">{bm.lesson_name}</p>
                </div>
                <span className="badge badge-muted text-xs shrink-0">{bm.category}</span>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'resources' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {course.modules?.flatMap(m => m.resources || []).length === 0 ? (
              <div className="empty-state card py-16 col-span-full">
                <Paperclip size={32} className="text-gray-300 dark:text-gray-600" />
                <h3>No resources</h3>
                <p>PDF, docs, and other files will appear here</p>
              </div>
            ) : course.modules?.flatMap(m => (m.resources || []).map(r => ({ ...r, module_name: m.name }))).map(res => (
              <a
                key={res.id}
                href={`http://localhost:5000/api/video/resource/${res.id}`}
                target="_blank" rel="noreferrer"
                className="card flex items-center gap-3 p-3 hover:shadow-md transition-all"
              >
                <div className="w-9 h-9 rounded-lg bg-gray-100 dark:bg-dark-600 flex items-center justify-center shrink-0">
                  <FileIcon size={16} className="text-gray-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{res.name}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">{res.module_name}</p>
                </div>
                <span className="text-xs text-gray-400 uppercase">.{res.file_type}</span>
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

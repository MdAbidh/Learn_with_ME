import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import {
  ArrowLeft, SkipBack, SkipForward, Play, Pause, Volume2, VolumeX, Volume1,
  Maximize, PictureInPicture2, Bookmark, List, FileText, CheckCircle,
  Circle, Lock, Pencil, Trash2, LayoutTemplate, ChevronDown, ChevronRight,
  AlertTriangle
} from 'lucide-react';
import { showNotification } from '../store/slices/uiSlice';
import { formatDuration, formatTimestamp } from '../utils/formatters';
import api from '../utils/api';

// Formats that browsers can't play natively
const UNSUPPORTED_FORMATS = ['.mkv', '.avi', '.flv', '.wmv', '.mov'];

export default function PlayerPage() {
  const { courseId, lessonId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate  = useNavigate();
  const dispatch  = useDispatch();

  const videoRef          = useRef(null);
  const progressSaveRef   = useRef(null);
  const sessionRef        = useRef(null);
  const completedRef      = useRef(false);

  const [course,           setCourse]           = useState(null);
  const [lesson,           setLesson]           = useState(null);
  const [allLessons,       setAllLessons]       = useState([]);
  const [playing,          setPlaying]          = useState(false);
  const [currentTime,      setCurrentTime]      = useState(0);
  const [duration,         setDuration]         = useState(0);
  const [volume,           setVolume]           = useState(1);
  const [muted,            setMuted]            = useState(false);
  const [playbackRate,     setPlaybackRate]     = useState(1);
  const [showControls,     setShowControls]     = useState(true);
  const [theaterMode,      setTheaterMode]      = useState(false);
  const [activePanel,      setActivePanel]      = useState('curriculum');
  const [notes,            setNotes]            = useState([]);
  const [bookmarks,        setBookmarks]        = useState([]);
  const [noteText,         setNoteText]         = useState('');
  const [bookmarkTitle,    setBookmarkTitle]    = useState('');
  const [editingNote,      setEditingNote]      = useState(null);
  const [showBookmarkForm, setShowBookmarkForm] = useState(false);
  const [controlsTimeout,  setControlsTimeout]  = useState(null);
  const [expandedModules,  setExpandedModules]  = useState({});
  const [videoError,       setVideoError]       = useState(null);
  const [videoLoading,     setVideoLoading]     = useState(true);
  const [lessonDone,       setLessonDone]       = useState(false);

  useEffect(() => {
    loadData(); startSession();
    completedRef.current = false;
    setVideoError(null);
    setVideoLoading(true);
    setLessonDone(false);
    return () => { endSession(); clearInterval(progressSaveRef.current); progressSaveRef.current = null; };
  }, [lessonId]);

  const loadData = async () => {
    try {
      const courseRes = await api.get(`/courses/${courseId}`);
      const courseData = courseRes.data;
      setCourse(courseData);
      const flat = courseData.modules?.flatMap(m =>
        (m.lessons || []).map(l => ({ ...l, module_name: m.name, module_id: m.id }))
      ) || [];
      setAllLessons(flat);
      const cur = flat.find(l => l.id === parseInt(lessonId));
      if (cur) {
        setLesson(cur);
        setExpandedModules({ [cur.module_id]: true });
        setLessonDone(!!cur.is_completed);
      }
      loadNotes(lessonId); loadBookmarks(lessonId);
    } catch (e) { console.error(e); }
  };

  const loadNotes     = async (lid) => { try { const r = await api.get(`/notes/lesson/${lid}`);     setNotes(r.data);     } catch (e) {} };
  const loadBookmarks = async (lid) => { try { const r = await api.get(`/bookmarks/lesson/${lid}`); setBookmarks(r.data); } catch (e) {} };

  const startSession = async () => {
    try { const r = await api.post('/analytics/session/start', { course_id: courseId, lesson_id: lessonId }); sessionRef.current = r.data.sessionId; } catch (e) {}
  };
  const endSession = async () => {
    if (sessionRef.current && videoRef.current) {
      try { await api.post(`/analytics/session/${sessionRef.current}/end`, { duration: Math.floor(videoRef.current.currentTime || 0) }); } catch (e) {}
    }
  };

  const handleTimeUpdate = useCallback(() => {
    const v = videoRef.current; if (!v) return;
    setCurrentTime(v.currentTime);
    if (!progressSaveRef.current) progressSaveRef.current = setInterval(() => saveProgress(false), 5000);
    if (!completedRef.current && v.duration > 0 && (v.currentTime / v.duration) * 100 >= 90) {
      completedRef.current = true; saveProgress(true);
    }
  }, [lessonId]);

  const saveProgress = async (completed) => {
    const v = videoRef.current; if (!v || !lesson) return;
    const pct = v.duration > 0 ? (v.currentTime / v.duration) * 100 : 0;
    try {
      await api.post(`/progress/lesson/${lessonId}`, {
        watch_percentage: pct, last_position: Math.floor(v.currentTime),
        course_id: parseInt(courseId), module_id: lesson.module_id,
      });
      if (completed) {
        setLessonDone(true);
        dispatch(showNotification({ type: 'success', message: 'Lesson completed!' }));
        setTimeout(() => loadData(), 1000);
      }
    } catch (e) {}
  };

  // Manual "Mark as Done" — force 100% completion
  const markAsDone = async () => {
    const v = videoRef.current;
    try {
      await api.post(`/progress/lesson/${lessonId}`, {
        watch_percentage: 100,
        last_position: v ? Math.floor(v.currentTime) : 0,
        course_id: parseInt(courseId),
        module_id: lesson?.module_id,
      });
      setLessonDone(true);
      completedRef.current = true;
      dispatch(showNotification({ type: 'success', message: 'Marked as done!' }));
      setTimeout(() => loadData(), 800);
    } catch (e) {}
  };

  const handleLoadedMetadata = () => {
    const v = videoRef.current; if (!v) return;
    setDuration(v.duration);
    setVideoLoading(false);
    setVideoError(null);
    const t = searchParams.get('t');
    if (t) v.currentTime = parseInt(t);
    else if ((lesson?.last_position || 0) > 10) v.currentTime = lesson.last_position;
  };

  const handleVideoError = (e) => {
    setVideoLoading(false);
    setVideoError('Video could not be loaded. The file may be missing or the format is not supported by your browser.');
  };

  const handleVideoEnd = () => {
    saveProgress(true);
    const idx = allLessons.findIndex(l => l.id === parseInt(lessonId));
    if (idx >= 0 && idx < allLessons.length - 1) {
      const next = allLessons[idx + 1];
      if (next.is_unlocked || next.is_completed) setTimeout(() => navigate(`/player/${courseId}/${next.id}`), 1500);
    }
  };

  const togglePlay = () => { const v = videoRef.current; if (!v) return; if (v.paused) { v.play(); setPlaying(true); } else { v.pause(); setPlaying(false); } };
  const seek = (s) => { const v = videoRef.current; if (!v) return; v.currentTime = Math.max(0, Math.min(v.duration, v.currentTime + s)); };
  const handleSeek = (e) => { const v = videoRef.current; if (!v) return; const r = e.currentTarget.getBoundingClientRect(); v.currentTime = ((e.clientX - r.left) / r.width) * v.duration; };
  const handleVolumeChange = (e) => { const val = parseFloat(e.target.value); setVolume(val); if (videoRef.current) videoRef.current.volume = val; setMuted(val === 0); };
  const toggleMute = () => { const v = videoRef.current; if (!v) return; v.muted = !v.muted; setMuted(v.muted); };
  const changeSpeed = (r) => { setPlaybackRate(r); if (videoRef.current) videoRef.current.playbackRate = r; };
  const toggleFullscreen = () => { const c = document.querySelector('.player-container'); if (!document.fullscreenElement) c?.requestFullscreen(); else document.exitFullscreen(); };
  const togglePiP = async () => { try { if (document.pictureInPictureElement) await document.exitPictureInPicture(); else if (videoRef.current) await videoRef.current.requestPictureInPicture(); } catch (e) {} };

  const goToNext = () => { const idx = allLessons.findIndex(l => l.id === parseInt(lessonId)); if (idx >= 0 && idx < allLessons.length - 1) { const n = allLessons[idx + 1]; if (n.is_unlocked || n.is_completed) navigate(`/player/${courseId}/${n.id}`); } };
  const goToPrev = () => { const idx = allLessons.findIndex(l => l.id === parseInt(lessonId)); if (idx > 0) navigate(`/player/${courseId}/${allLessons[idx - 1].id}`); };

  useEffect(() => {
    const handler = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (e.key === ' ') { e.preventDefault(); togglePlay(); }
      else if (e.key === 'ArrowLeft') seek(-10);
      else if (e.key === 'ArrowRight') seek(10);
      else if (e.key === 'f' || e.key === 'F') toggleFullscreen();
      else if (e.key === 'm' || e.key === 'M') toggleMute();
      else if (e.key === 'n' || e.key === 'N') goToNext();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [allLessons, lessonId]);

  const handleMouseMove = () => {
    setShowControls(true); clearTimeout(controlsTimeout);
    const t = setTimeout(() => { if (playing) setShowControls(false); }, 3000);
    setControlsTimeout(t);
  };

  const addNote = async () => {
    if (!noteText.trim()) return;
    try {
      const r = await api.post(`/notes/lesson/${lessonId}`, { content: noteText, timestamp: Math.floor(currentTime), course_id: parseInt(courseId) });
      setNotes(p => [...p, r.data]); setNoteText('');
      dispatch(showNotification({ type: 'success', message: 'Note saved!' }));
    } catch (e) {}
  };
  const deleteNote  = async (id) => { await api.delete(`/notes/${id}`); setNotes(p => p.filter(n => n.id !== id)); };
  const updateNote  = async (id, content) => { const r = await api.put(`/notes/${id}`, { content }); setNotes(p => p.map(n => n.id === id ? r.data : n)); setEditingNote(null); };
  const addBookmark = async () => {
    if (!bookmarkTitle.trim()) return;
    try {
      const r = await api.post(`/bookmarks/lesson/${lessonId}`, { title: bookmarkTitle, timestamp: Math.floor(currentTime), course_id: parseInt(courseId), category: 'general' });
      setBookmarks(p => [...p, r.data]); setBookmarkTitle(''); setShowBookmarkForm(false);
      dispatch(showNotification({ type: 'success', message: 'Bookmark saved!' }));
    } catch (e) {}
  };
  const deleteBookmark = async (id) => { await api.delete(`/bookmarks/${id}`); setBookmarks(p => p.filter(b => b.id !== id)); };

  const currentIdx = allLessons.findIndex(l => l.id === parseInt(lessonId));
  const prevLesson = currentIdx > 0 ? allLessons[currentIdx - 1] : null;
  const nextLesson = currentIdx < allLessons.length - 1 ? allLessons[currentIdx + 1] : null;
  const progressPct = duration > 0 ? (currentTime / duration) * 100 : 0;

  const VolumeIcon = muted || volume === 0 ? VolumeX : volume < 0.5 ? Volume1 : Volume2;

  return (
    <div className={`flex flex-col h-screen bg-black text-white overflow-hidden ${theaterMode ? 'theater' : ''}`}>
      {/* Top bar */}
      <div className="flex items-center gap-3 px-4 h-12 bg-zinc-900/90 border-b border-white/10 shrink-0">
        <button className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition-colors" onClick={() => navigate(`/courses/${courseId}`)}>
          <ArrowLeft size={15} /> Back
        </button>
        <div className="flex-1 flex items-center gap-2 text-sm min-w-0">
          <span className="text-gray-500 truncate">{course?.name}</span>
          {lesson && <><span className="text-gray-600">›</span><span className="text-gray-200 truncate">{lesson.name}</span></>}
        </div>
        <button onClick={() => setTheaterMode(!theaterMode)} className="p-1.5 rounded text-gray-400 hover:text-white hover:bg-white/10 transition-colors" title="Theater Mode">
          <LayoutTemplate size={15} />
        </button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Video area */}
        <div className="flex flex-col flex-1 overflow-hidden">
          {/* Video */}
          <div
            className="player-container relative bg-black flex-1 overflow-hidden cursor-pointer"
            onMouseMove={handleMouseMove}
            onClick={togglePlay}
          >
            <video
              ref={videoRef}
              className="w-full h-full object-contain"
              src={`http://localhost:5000/api/video/stream/${lessonId}`}
              onTimeUpdate={handleTimeUpdate}
              onLoadedMetadata={handleLoadedMetadata}
              onPlay={() => setPlaying(true)}
              onPause={() => setPlaying(false)}
              onEnded={handleVideoEnd}
              onError={handleVideoError}
              onCanPlay={() => setVideoLoading(false)}
            />

            {/* Loading spinner */}
            {videoLoading && !videoError && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 pointer-events-none gap-3">
                <div className="w-10 h-10 rounded-full border-2 border-white/20 border-t-brand animate-spin" />
                {lesson?.file_name && !['mp4','m4v','webm'].includes(lesson.file_name.split('.').pop().toLowerCase()) && (
                  <p className="text-xs text-gray-400 text-center max-w-xs">
                    Converting {lesson.file_name.split('.').pop().toUpperCase()} to MP4 for playback…<br/>
                    <span className="text-gray-500">This may take a moment</span>
                  </p>
                )}
              </div>
            )}

            {/* Error overlay */}
            {videoError && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 p-6 text-center pointer-events-none">
                <AlertTriangle size={40} className="text-amber-400 mb-3" />
                <p className="text-white font-medium mb-2">Cannot Play Video</p>
                <p className="text-gray-400 text-sm max-w-sm">{videoError}</p>
                <p className="text-gray-500 text-xs mt-3">File: {lesson?.file_name}</p>
              </div>
            )}

            {/* Controls overlay */}
            <div className={`absolute inset-0 flex flex-col justify-end transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'}`}
              onClick={e => e.stopPropagation()}>
              <div className="bg-gradient-to-t from-black/80 via-black/20 to-transparent px-4 pb-3 pt-8">
                {/* Progress */}
                <div className="relative h-1 bg-white/20 rounded-full cursor-pointer mb-3 group" onClick={handleSeek}>
                  <div className="h-full bg-brand rounded-full transition-all" style={{ width: `${progressPct}%` }} />
                  <div className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow opacity-0 group-hover:opacity-100 transition-opacity" style={{ left: `${progressPct}%`, transform: 'translate(-50%,-50%)' }} />
                </div>

                {/* Buttons */}
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    <button className="p-1.5 rounded hover:bg-white/10 transition-colors disabled:opacity-40" onClick={goToPrev} disabled={!prevLesson}><SkipBack size={16} /></button>
                    <button className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors" onClick={togglePlay}>{playing ? <Pause size={18} /> : <Play size={18} className="ml-0.5" />}</button>
                    <button className="p-1.5 rounded hover:bg-white/10 transition-colors disabled:opacity-40" onClick={goToNext} disabled={!nextLesson}><SkipForward size={16} /></button>
                  </div>

                  <div className="flex items-center gap-1.5 ml-1">
                    <button className="p-1.5 rounded hover:bg-white/10 transition-colors" onClick={toggleMute}><VolumeIcon size={15} /></button>
                    <input type="range" min="0" max="1" step="0.05" value={muted ? 0 : volume} onChange={handleVolumeChange}
                      className="w-20 accent-brand h-1" />
                  </div>

                  <span className="text-xs text-gray-300 ml-1">{formatDuration(currentTime)} / {formatDuration(duration)}</span>

                  <div className="ml-auto flex items-center gap-1">
                    <select className="bg-transparent text-xs text-gray-300 border border-white/20 rounded px-1.5 py-0.5 cursor-pointer"
                      value={playbackRate} onChange={e => changeSpeed(parseFloat(e.target.value))}>
                      {[0.5,0.75,1,1.25,1.5,1.75,2].map(s => <option key={s} value={s} className="bg-zinc-900">{s}x</option>)}
                    </select>
                    <button className="p-1.5 rounded hover:bg-white/10 transition-colors" onClick={togglePiP}><PictureInPicture2 size={15} /></button>
                    <button className="p-1.5 rounded hover:bg-white/10 transition-colors" onClick={toggleFullscreen}><Maximize size={15} /></button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Lesson info bar */}
          <div className="flex items-center gap-3 px-4 py-2.5 bg-zinc-900 border-t border-white/10 shrink-0">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                {/* Green tick when done */}
                {lessonDone
                  ? <CheckCircle size={16} className="text-emerald-500 shrink-0" />
                  : <Circle size={16} className="text-red-500/60 shrink-0" />}
                <h2 className="text-sm font-semibold text-white truncate">{lesson?.name}</h2>
              </div>
              <p className="text-xs text-gray-500 ml-6">{lesson?.module_name}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {/* Mark as Done button */}
              {!lessonDone ? (
                <button
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-600 hover:bg-emerald-500 text-white transition-colors"
                  onClick={markAsDone}
                >
                  <CheckCircle size={12} /> Mark as Done
                </button>
              ) : (
                <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-900/40 text-emerald-400">
                  <CheckCircle size={12} /> Completed
                </span>
              )}
              <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-white/10 hover:bg-white/15 text-gray-300 transition-colors"
                onClick={() => setShowBookmarkForm(!showBookmarkForm)}>
                <Bookmark size={12} /> Bookmark
              </button>
              {nextLesson && (
                <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-brand hover:bg-brand-dark text-white transition-colors" onClick={goToNext}>
                  Next <SkipForward size={12} />
                </button>
              )}
            </div>
          </div>

          {/* Bookmark form */}
          {showBookmarkForm && (
            <div className="flex items-center gap-2 px-4 py-2 bg-zinc-800 border-t border-white/10 shrink-0">
              <span className="text-xs text-gray-400 shrink-0">{formatDuration(currentTime)}</span>
              <input className="flex-1 bg-zinc-700 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white placeholder-gray-500 outline-none focus:border-brand"
                placeholder="Bookmark title..." value={bookmarkTitle} onChange={e => setBookmarkTitle(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addBookmark()} autoFocus />
              <button className="px-3 py-1.5 rounded-lg text-xs font-medium bg-brand hover:bg-brand-dark text-white transition-colors" onClick={addBookmark}>Save</button>
              <button className="px-3 py-1.5 rounded-lg text-xs font-medium bg-white/10 hover:bg-white/15 text-gray-300 transition-colors" onClick={() => setShowBookmarkForm(false)}>Cancel</button>
            </div>
          )}
        </div>

        {/* Side panel */}
        <div className="w-72 flex flex-col bg-zinc-900 border-l border-white/10 shrink-0">
          {/* Panel tabs */}
          <div className="flex border-b border-white/10 shrink-0">
            {[
              { key: 'curriculum', Icon: List,      count: null },
              { key: 'notes',      Icon: FileText,  count: notes.length },
              { key: 'bookmarks',  Icon: Bookmark,  count: bookmarks.length },
            ].map(({ key, Icon, count }) => (
              <button key={key} onClick={() => setActivePanel(key)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium transition-colors border-b-2
                  ${activePanel === key ? 'border-brand text-brand' : 'border-transparent text-gray-500 hover:text-gray-300'}`}>
                <Icon size={14} />
                {count !== null && count > 0 && <span className="px-1.5 py-0.5 rounded-full bg-brand/20 text-brand text-xs">{count}</span>}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto">

            {/* Curriculum panel */}
            {activePanel === 'curriculum' && (
              <div className="p-2 space-y-1">
                {course?.modules?.map(mod => (
                  <div key={mod.id}>
                    <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer hover:bg-white/5 transition-colors"
                      onClick={() => setExpandedModules(p => ({ ...p, [mod.id]: !p[mod.id] }))}>
                      {expandedModules[mod.id] ? <ChevronDown size={13} className="text-gray-500 shrink-0" /> : <ChevronRight size={13} className="text-gray-500 shrink-0" />}
                      <span className="text-xs font-medium text-gray-300 flex-1 truncate">{mod.name}</span>
                      <span className="text-xs text-gray-600">{mod.completed_lessons}/{mod.total_lessons}</span>
                    </div>
                    {expandedModules[mod.id] && (
                      <div className="ml-4 space-y-0.5">
                        {mod.lessons?.map(l => (
                          <div key={l.id}
                            className={`flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs transition-colors
                              ${l.id === parseInt(lessonId) ? 'bg-brand/20 text-brand' : ''}
                              ${l.is_unlocked || l.is_completed ? 'cursor-pointer hover:bg-white/5' : 'cursor-pointer hover:bg-white/5'}
                              ${l.is_completed && l.id !== parseInt(lessonId) ? 'text-gray-500' : ''}`}
                            onClick={() => navigate(`/player/${courseId}/${l.id}`)}>
                            <span className="shrink-0">
                              {l.is_completed
                                ? <CheckCircle size={12} className="text-emerald-500" />
                                : l.id === parseInt(lessonId)
                                ? <Play size={12} className="text-brand" />
                                : <Circle size={12} className="text-red-500/70" />}
                            </span>
                            <span className="truncate flex-1">{l.name}</span>
                            {/* Live green dot for currently playing+done */}
                            {l.id === parseInt(lessonId) && lessonDone && (
                              <CheckCircle size={11} className="text-emerald-500 shrink-0" />
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Notes panel */}
            {activePanel === 'notes' && (
              <div className="flex flex-col h-full">
                <div className="p-3 border-b border-white/10 shrink-0">
                  <p className="text-xs text-gray-500 mb-1.5">Note at {formatDuration(currentTime)}</p>
                  <textarea className="w-full bg-zinc-800 border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder-gray-600 outline-none focus:border-brand resize-none"
                    placeholder="Add a note..." value={noteText} onChange={e => setNoteText(e.target.value)} rows={3} />
                  <button className="mt-1.5 w-full py-1.5 rounded-lg text-xs font-medium bg-brand hover:bg-brand-dark text-white transition-colors disabled:opacity-50"
                    onClick={addNote} disabled={!noteText.trim()}>Save Note</button>
                </div>
                <div className="flex-1 overflow-y-auto p-2 space-y-2">
                  {notes.map(note => (
                    <div key={note.id} className="bg-zinc-800 rounded-lg p-2.5">
                      {editingNote === note.id ? (
                        <EditNote note={note} onSave={c => updateNote(note.id, c)} onCancel={() => setEditingNote(null)} />
                      ) : (
                        <>
                          <div className="flex items-center justify-between mb-1">
                            <button className="text-xs text-brand hover:underline" onClick={() => { if (videoRef.current) videoRef.current.currentTime = note.timestamp; }}>
                              {formatTimestamp(note.timestamp)}
                            </button>
                            <div className="flex items-center gap-1">
                              <button className="p-1 rounded hover:bg-white/10 text-gray-500 hover:text-gray-300 transition-colors" onClick={() => setEditingNote(note.id)}><Pencil size={11} /></button>
                              <button className="p-1 rounded hover:bg-white/10 text-gray-500 hover:text-red-400 transition-colors" onClick={() => deleteNote(note.id)}><Trash2 size={11} /></button>
                            </div>
                          </div>
                          <p className="text-xs text-gray-300">{note.content}</p>
                        </>
                      )}
                    </div>
                  ))}
                  {notes.length === 0 && <p className="text-xs text-gray-600 text-center py-4">No notes yet</p>}
                </div>
              </div>
            )}

            {/* Bookmarks panel */}
            {activePanel === 'bookmarks' && (
              <div className="p-2 space-y-1.5">
                {bookmarks.map(bm => (
                  <div key={bm.id} className="flex items-center gap-2 bg-zinc-800 rounded-lg px-2.5 py-2">
                    <button className="text-xs text-brand hover:underline shrink-0" onClick={() => { if (videoRef.current) videoRef.current.currentTime = bm.timestamp; }}>
                      {formatTimestamp(bm.timestamp)}
                    </button>
                    <span className="text-xs text-gray-300 flex-1 truncate">{bm.title}</span>
                    <button className="p-1 rounded hover:bg-white/10 text-gray-600 hover:text-red-400 transition-colors shrink-0" onClick={() => deleteBookmark(bm.id)}><Trash2 size={11} /></button>
                  </div>
                ))}
                {bookmarks.length === 0 && <p className="text-xs text-gray-600 text-center py-4">No bookmarks yet</p>}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function EditNote({ note, onSave, onCancel }) {
  const [text, setText] = useState(note.content);
  return (
    <div>
      <textarea className="w-full bg-zinc-700 border border-white/10 rounded px-2 py-1.5 text-xs text-white outline-none focus:border-brand resize-none"
        value={text} onChange={e => setText(e.target.value)} rows={3} autoFocus />
      <div className="flex gap-1.5 mt-1.5">
        <button className="flex-1 py-1 rounded text-xs font-medium bg-brand hover:bg-brand-dark text-white transition-colors" onClick={() => onSave(text)}>Save</button>
        <button className="flex-1 py-1 rounded text-xs font-medium bg-white/10 hover:bg-white/15 text-gray-300 transition-colors" onClick={onCancel}>Cancel</button>
      </div>
    </div>
  );
}

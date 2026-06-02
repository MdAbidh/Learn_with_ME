import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import {
  LayoutDashboard, BookOpen, BarChart2, Search, Settings,
  PanelLeftClose, PanelLeftOpen, FolderInput, Loader2
} from 'lucide-react';
import { toggleSidebar } from '../../store/slices/uiSlice';
import { importCourse } from '../../store/slices/coursesSlice';
import { showNotification } from '../../store/slices/uiSlice';

const NAV_ITEMS = [
  { path: '/',          label: 'Dashboard',  Icon: LayoutDashboard, exact: true },
  { path: '/courses',   label: 'My Courses', Icon: BookOpen },
  { path: '/analytics', label: 'Analytics',  Icon: BarChart2 },
  { path: '/search',    label: 'Search',     Icon: Search },
  { path: '/settings',  label: 'Settings',   Icon: Settings },
];

export default function Sidebar() {
  const dispatch  = useDispatch();
  const navigate  = useNavigate();
  const open      = useSelector(s => s.ui.sidebarOpen);
  const importing = useSelector(s => s.courses.importing);

  const handleImport = async () => {
    const folderPath = prompt('Enter the full path to your course folder:\n\nExample: C:\\Courses\\Java Masterclass');
    if (!folderPath?.trim()) return;
    try {
      const result = await dispatch(importCourse(folderPath.trim())).unwrap();
      dispatch(showNotification({ type: 'success', message: `"${result.course.name}" imported successfully!` }));
      navigate(`/courses/${result.course.id}`);
    } catch (err) {
      dispatch(showNotification({ type: 'error', message: err.message }));
    }
  };

  return (
    <aside
      className={`
        flex flex-col h-screen shrink-0 transition-all duration-200
        bg-white border-r border-gray-200
        dark:bg-dark-800 dark:border-dark-border
        ${open ? 'w-60' : 'w-16'}
      `}
    >
      {/* Logo */}
      <div className={`flex items-center h-14 px-4 border-b border-gray-200 dark:border-dark-border ${open ? 'gap-3' : 'justify-center'}`}>
        <div className="w-7 h-7 rounded-lg bg-brand flex items-center justify-center shrink-0">
          <BookOpen size={14} className="text-white" />
        </div>
        {open && (
          <span className="font-semibold text-gray-900 dark:text-white text-sm tracking-tight">
            LearnHub
          </span>
        )}
      </div>

      {/* Import button */}
      <div className="px-3 pt-4 pb-2">
        <button
          onClick={handleImport}
          disabled={importing}
          title="Import Course Folder"
          className={`
            w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium
            bg-brand text-white hover:bg-brand-dark transition-all duration-150
            disabled:opacity-50 disabled:cursor-not-allowed
            ${!open ? 'justify-center' : ''}
          `}
        >
          {importing
            ? <Loader2 size={15} className="animate-spin shrink-0" />
            : <FolderInput size={15} className="shrink-0" />}
          {open && <span>{importing ? 'Importing...' : 'Import Course'}</span>}
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-2 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map(({ path, label, Icon, exact }) => (
          <NavLink
            key={path}
            to={path}
            end={exact}
            title={!open ? label : ''}
            className={({ isActive }) => `
              flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium
              transition-all duration-150 group
              ${isActive
                ? 'bg-orange-50 text-brand dark:bg-orange-900/20 dark:text-brand-light'
                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-dark-600 dark:hover:text-gray-100'
              }
              ${!open ? 'justify-center' : ''}
            `}
          >
            <Icon size={17} className="shrink-0" />
            {open && <span>{label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Toggle */}
      <div className="px-3 pb-4 border-t border-gray-200 dark:border-dark-border pt-3">
        <button
          onClick={() => dispatch(toggleSidebar())}
          className={`
            w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm
            text-gray-500 hover:bg-gray-100 hover:text-gray-700
            dark:text-gray-500 dark:hover:bg-dark-600 dark:hover:text-gray-300
            transition-all duration-150
            ${!open ? 'justify-center' : ''}
          `}
        >
          {open
            ? <><PanelLeftClose size={16} /><span>Collapse</span></>
            : <PanelLeftOpen size={16} />}
        </button>
      </div>
    </aside>
  );
}

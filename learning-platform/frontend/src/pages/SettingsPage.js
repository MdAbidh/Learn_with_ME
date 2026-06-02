import React, { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { User, Palette, Play, Bot, HardDrive, Info, Moon, Sun, Save, Upload, Download, Loader2 } from 'lucide-react';
import { setTheme } from '../store/slices/uiSlice';
import { showNotification } from '../store/slices/uiSlice';
import api from '../utils/api';

const SECTIONS = [
  { key: 'profile',    label: 'Profile',         Icon: User },
  { key: 'appearance', label: 'Appearance',       Icon: Palette },
  { key: 'player',     label: 'Player',           Icon: Play },
  { key: 'ai',         label: 'AI Features',      Icon: Bot },
  { key: 'backup',     label: 'Backup & Restore', Icon: HardDrive },
  { key: 'about',      label: 'About',            Icon: Info },
];

export default function SettingsPage() {
  const dispatch = useDispatch();
  const [settings, setSettings] = useState({
    user_name: 'Learner', theme: 'dark', auto_play: 'true',
    playback_speed: '1', completion_threshold: '90',
    ai_enabled: 'false', openai_api_key: '',
  });
  const [saving,    setSaving]    = useState(false);
  const [exporting, setExporting] = useState(false);
  const [active,    setActive]    = useState('profile');

  useEffect(() => {
    api.get('/settings').then(res => setSettings(p => ({ ...p, ...res.data }))).catch(() => {});
  }, []);

  const set = (key, value) => setSettings(p => ({ ...p, [key]: value }));

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put('/settings', settings);
      dispatch(setTheme(settings.theme));
      localStorage.setItem('user_name', settings.user_name);
      dispatch(showNotification({ type: 'success', message: 'Settings saved!' }));
    } catch (e) {
      dispatch(showNotification({ type: 'error', message: 'Failed to save settings' }));
    }
    setSaving(false);
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await api.get('/settings/backup', { responseType: 'blob' });
      const url = URL.createObjectURL(res.data);
      const a   = document.createElement('a');
      a.href = url; a.download = `learning-backup-${Date.now()}.json`; a.click();
      URL.revokeObjectURL(url);
      dispatch(showNotification({ type: 'success', message: 'Backup exported!' }));
    } catch (e) {
      dispatch(showNotification({ type: 'error', message: 'Export failed' }));
    }
    setExporting(false);
  };

  return (
    <div className="fade-in max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Customize your learning experience</p>
      </div>

      <div className="flex gap-6">
        {/* Sidebar nav */}
        <div className="w-44 shrink-0">
          <nav className="space-y-0.5">
            {SECTIONS.map(({ key, label, Icon }) => (
              <button
                key={key}
                onClick={() => setActive(key)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150
                  ${active === key
                    ? 'bg-orange-50 dark:bg-orange-900/20 text-brand'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-700 hover:text-gray-900 dark:hover:text-gray-100'}`}
              >
                <Icon size={15} className="shrink-0" />
                {label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 space-y-4">
          {active === 'profile' && (
            <div className="card p-6 space-y-4">
              <h2 className="text-base font-semibold text-gray-900 dark:text-white">Profile</h2>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Your Name</label>
                <input
                  className="input"
                  value={settings.user_name}
                  onChange={e => set('user_name', e.target.value)}
                  placeholder="Enter your name"
                />
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Used on certificates and greetings</p>
              </div>
            </div>
          )}

          {active === 'appearance' && (
            <div className="card p-6 space-y-4">
              <h2 className="text-base font-semibold text-gray-900 dark:text-white">Appearance</h2>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Theme</label>
                <div className="flex gap-3">
                  {[
                    { value: 'light', label: 'Light', Icon: Sun },
                    { value: 'dark',  label: 'Dark',  Icon: Moon },
                  ].map(({ value, label, Icon }) => (
                    <button
                      key={value}
                      onClick={() => set('theme', value)}
                      className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-medium transition-all duration-150
                        ${settings.theme === value
                          ? 'border-brand bg-orange-50 dark:bg-orange-900/20 text-brand'
                          : 'border-gray-200 dark:border-dark-border text-gray-600 dark:text-gray-400 hover:border-gray-300'}`}
                    >
                      <Icon size={15} /> {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {active === 'player' && (
            <div className="card p-6 space-y-5">
              <h2 className="text-base font-semibold text-gray-900 dark:text-white">Player Settings</h2>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Default Playback Speed</label>
                <select className="input w-40" value={settings.playback_speed} onChange={e => set('playback_speed', e.target.value)}>
                  {['0.5','0.75','1','1.25','1.5','1.75','2'].map(s => <option key={s} value={s}>{s}x</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Completion Threshold — <span className="text-brand">{settings.completion_threshold}%</span>
                </label>
                <input
                  type="range" min="50" max="100" step="5"
                  value={settings.completion_threshold}
                  onChange={e => set('completion_threshold', e.target.value)}
                  className="w-full accent-brand"
                />
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Mark lesson complete when this % is watched</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Auto-play Next Lesson</label>
                <Toggle
                  value={settings.auto_play === 'true'}
                  onChange={v => set('auto_play', v ? 'true' : 'false')}
                />
              </div>
            </div>
          )}

          {active === 'ai' && (
            <div className="card p-6 space-y-4">
              <h2 className="text-base font-semibold text-gray-900 dark:text-white">AI Features</h2>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Enable AI Features</label>
                <Toggle
                  value={settings.ai_enabled === 'true'}
                  onChange={v => set('ai_enabled', v ? 'true' : 'false')}
                />
              </div>
              {settings.ai_enabled === 'true' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">OpenAI API Key</label>
                  <input
                    className="input"
                    type="password"
                    value={settings.openai_api_key}
                    onChange={e => set('openai_api_key', e.target.value)}
                    placeholder="sk-..."
                  />
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Required for AI notes, quiz, and flashcard generation</p>
                </div>
              )}
            </div>
          )}

          {active === 'backup' && (
            <div className="card p-6 space-y-4">
              <h2 className="text-base font-semibold text-gray-900 dark:text-white">Backup & Restore</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Export your progress, notes, bookmarks, and settings as a JSON backup file.
              </p>
              <div className="flex gap-3">
                <button className="btn btn-secondary" onClick={handleExport} disabled={exporting}>
                  {exporting ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                  {exporting ? 'Exporting...' : 'Export Backup'}
                </button>
                <label className="btn btn-secondary cursor-pointer">
                  <Upload size={14} /> Import Backup
                  <input
                    type="file" accept=".json" className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files[0];
                      if (!file) return;
                      const formData = new FormData();
                      formData.append('backup', file);
                      try {
                        await api.post('/settings/restore', formData);
                        dispatch(showNotification({ type: 'success', message: 'Backup restored!' }));
                      } catch (err) {
                        dispatch(showNotification({ type: 'error', message: 'Restore failed' }));
                      }
                    }}
                  />
                </label>
              </div>
            </div>
          )}

          {active === 'about' && (
            <div className="card p-6">
              <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-4">About</h2>
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-xl bg-brand flex items-center justify-center">
                  <Play size={20} className="text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">LearnHub</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Personal Learning Platform v1.0.0</p>
                </div>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">Fully offline · All data stored locally</p>
              <div className="flex gap-2">
                <span className="badge badge-success">Offline</span>
                <span className="badge badge-brand">Local Storage</span>
              </div>
            </div>
          )}

          {/* Save button */}
          {active !== 'about' && active !== 'backup' && (
            <div className="flex justify-end">
              <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                {saving ? 'Saving...' : 'Save Settings'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Toggle({ value, onChange }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-200
        ${value ? 'bg-brand' : 'bg-gray-200 dark:bg-dark-500'}`}
    >
      <span
        className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform duration-200
          ${value ? 'translate-x-4' : 'translate-x-1'}`}
      />
    </button>
  );
}

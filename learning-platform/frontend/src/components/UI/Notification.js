import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { CheckCircle, XCircle, Info, AlertTriangle, X } from 'lucide-react';
import { clearNotification } from '../../store/slices/uiSlice';

const ICONS = {
  success: <CheckCircle size={16} className="text-emerald-500 shrink-0" />,
  error:   <XCircle    size={16} className="text-red-500 shrink-0" />,
  info:    <Info       size={16} className="text-blue-500 shrink-0" />,
  warning: <AlertTriangle size={16} className="text-amber-500 shrink-0" />,
};

export default function Notification() {
  const dispatch     = useDispatch();
  const notification = useSelector(s => s.ui.notification);

  useEffect(() => {
    if (!notification) return;
    const t = setTimeout(() => dispatch(clearNotification()), 3500);
    return () => clearTimeout(t);
  }, [notification, dispatch]);

  if (!notification) return null;

  return (
    <div className={`notification ${notification.type}`}>
      {ICONS[notification.type] || ICONS.info}
      <span className="text-sm">{notification.message}</span>
      <button
        onClick={() => dispatch(clearNotification())}
        className="ml-auto text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
      >
        <X size={14} />
      </button>
    </div>
  );
}

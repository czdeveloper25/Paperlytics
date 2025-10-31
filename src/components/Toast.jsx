import React, { useEffect } from 'react';

const Toast = ({ message, onClose, duration = 3000 }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  return (
    <div className="fixed top-8 right-8 z-50 animate-slideDown">
      <div className="bg-medium-purple text-white px-6 py-4 rounded-lg shadow-2xl flex items-center gap-3 min-w-[300px]">
        <span className="text-xl">✓</span>
        <p className="font-medium">{message}</p>
      </div>
    </div>
  );
};

export default Toast;

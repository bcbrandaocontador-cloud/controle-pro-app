import React, { useEffect, useState } from 'react';

interface ToastProps {
  message: string;
  type: 'success' | 'error';
  onClose: () => void;
}

const Toast: React.FC<ToastProps> = ({ message, type, onClose }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(true); // Trigger fade-in animation
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onClose, 300); // Wait for fade-out before calling onClose
    }, 4000); // Toast visible for 4 seconds

    return () => clearTimeout(timer);
  }, [message, onClose]);

  const bgColor = type === 'success' ? 'bg-green-600' : 'bg-red-600';
  const icon = type === 'success' ? (
    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
  ) : (
    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
  );

  return (
    <div
      className={`fixed bottom-5 right-5 z-50 flex items-center p-4 rounded-lg shadow-lg text-white ${bgColor} transition-opacity duration-300 ${visible ? 'opacity-100' : 'opacity-0'}`}
      role="alert"
    >
      <div className="flex-shrink-0">{icon}</div>
      <div className="ml-3 text-sm font-medium">{message}</div>
      <button
        onClick={() => { setVisible(false); setTimeout(onClose, 300); }}
        className="ml-4 -mr-2 p-1.5 text-white rounded-lg hover:bg-white hover:bg-opacity-20 focus:outline-none focus:ring-2 focus:ring-white"
      >
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"></path></svg>
      </button>
    </div>
  );
};

export default Toast;

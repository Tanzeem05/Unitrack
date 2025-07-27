import React from 'react';

// Reusable Modal Component
const Modal = ({ show, onClose, title, children, size = 'md', customWidth }) => {
  if (!show) return null;
  
  const sizeClasses = {
    md: 'w-96 max-w-md',
    lg: 'w-full max-w-2xl',
    xl: 'w-full max-w-4xl',
    sm: 'w-80 max-w-sm'
  };
  
  const widthClass = customWidth || sizeClasses[size];
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className={`bg-gray-800 rounded-lg p-6 ${widthClass}`}>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-white">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl">
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  );
};

export default Modal;

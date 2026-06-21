import React from 'react';

const Modal = ({ isOpen, onClose, shape, children }) => {
  if (!isOpen) return null;
  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <button className="close-btn" onClick={onClose}>&times;</button>
        <h3>{shape} Calculator</h3>
        {children}
      </div>
    </div>
  );
};
export default Modal;
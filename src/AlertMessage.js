// AlertMessage.js
import React from 'react';
import { Alert } from 'react-bootstrap';

const AlertMessage = ({ show, message, variant = 'danger', onClose }) => {
  if (!show) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: 9999,
        width: '80%',
        maxWidth: '500px',
      }}
    >
      <Alert variant={variant} onClose={onClose} dismissible>
        {message}
      </Alert>
    </div>
  );
};

export default AlertMessage;

// frontend/src/components/Common/Loading.js
import React from 'react';
import './Loading.css';

const Loading = () => {
  return (
    <div className="loading-container">
      <div className="loading-content">
        <div className="loading-spinner">
          <div className="spinner"></div>
        </div>
        <h2 className="loading-title">কিছু কথা</h2>
        <p className="loading-subtitle">Loading your conversations...</p>
      </div>
    </div>
  );
};

export default Loading;
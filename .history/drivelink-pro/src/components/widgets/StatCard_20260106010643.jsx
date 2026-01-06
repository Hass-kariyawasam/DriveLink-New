import React from 'react';

const StatCard = ({ title, value, icon, color }) => {
  return (
    <div className="stat-card">
      <div className="stat-info">
          <h3>{title}</h3>
          <p style={{color: color || 'inherit'}}>{value}</p>
      </div>
      <div className="stat-icon">
          <i className={`fas ${icon}`}></i>
      </div>
    </div>
  );
};

export default StatCard;
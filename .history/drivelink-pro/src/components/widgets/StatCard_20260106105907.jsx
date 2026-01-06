import React from 'react';

const StatCard = ({ title, value, icon, color, trend, trendValue }) => {
  // Default color if not provided
  const mainColor = color || '#3699ff';
  
  // Determine trend icon and color
  const getTrendIcon = () => {
    if (!trend) return null;
    if (trend === 'up') return 'fa-arrow-trend-up';
    if (trend === 'down') return 'fa-arrow-trend-down';
    return 'fa-minus';
  };
  
  const getTrendColor = () => {
    if (!trend) return '#8fa2b6';
    if (trend === 'up') return '#1bc5bd';
    if (trend === 'down') return '#f64e60';
    return '#8fa2b6';
  };
  
  return (
    <div className="stat-card" style={{
      background: 'linear-gradient(145deg, #1e1e2d, #252538)',
      border: '1px solid rgba(255, 255, 255, 0.05)',
      borderRadius: '16px',
      padding: '24px',
      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)',
      transition: 'all 0.3s ease',
      position: 'relative',
      overflow: 'hidden',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      cursor: 'pointer'
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.transform = 'translateY(-5px)';
      e.currentTarget.style.boxShadow = '0 10px 30px rgba(0, 0, 0, 0.3)';
      e.currentTarget.style.borderColor = `${mainColor}40`;
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.transform = 'translateY(0)';
      e.currentTarget.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.2)';
      e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.05)';
    }}>
      
      {/* Background Gradient Overlay */}
      <div style={{
        position: 'absolute',
        top: 0,
        right: 0,
        width: '150px',
        height: '150px',
        background: `radial-gradient(circle, ${mainColor}15 0%, transparent 70%)`,
        pointerEvents: 'none'
      }}></div>

      {/* Content */}
      <div className="stat-info" style={{ zIndex: 1, flex: 1 }}>
        <h3 style={{
          fontSize: '13px',
          textTransform: 'uppercase',
          letterSpacing: '1px',
          color: '#8fa2b6',
          marginBottom: '8px',
          fontWeight: '500'
        }}>
          {title}
        </h3>
        
        <p style={{
          fontSize: '28px',
          fontWeight: '700',
          color: color || '#fff',
          marginBottom: '5px',
          textShadow: '0 2px 10px rgba(0,0,0,0.5)',
          lineHeight: '1'
        }}>
          {value}
        </p>

        {/* Trend Indicator */}
        {trend && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            marginTop: '8px'
          }}>
            <i className={`fas ${getTrendIcon()}`} style={{
              fontSize: '12px',
              color: getTrendColor()
            }}></i>
            <span style={{
              fontSize: '12px',
              color: getTrendColor(),
              fontWeight: '600'
            }}>
              {trendValue || '0%'}
            </span>
            <span style={{
              fontSize: '11px',
              color: '#8fa2b6',
              marginLeft: '5px'
            }}>
              vs last hour
            </span>
          </div>
        )}
      </div>

      {/* Icon */}
      <div className="stat-icon" style={{
        width: '60px',
        height: '60px',
        borderRadius: '16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '26px',
        background: `linear-gradient(135deg, ${mainColor}30, ${mainColor}10)`,
        color: mainColor,
        boxShadow: `0 4px 20px ${mainColor}30`,
        position: 'relative',
        zIndex: 1
      }}>
        <i className={`fas ${icon}`}></i>
        
        {/* Pulse Animation for Critical Values */}
        {(title.includes('Temp') && parseFloat(value) > 90) && (
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            borderRadius: '16px',
            background: mainColor,
            opacity: 0.3,
            animation: 'pulse 2s ease-in-out infinite'
          }}></div>
        )}
      </div>

      {/* Inline Styles */}
      <style>{`
        @keyframes pulse {
          0%, 100% {
            transform: scale(1);
            opacity: 0.3;
          }
          50% {
            transform: scale(1.1);
            opacity: 0.6;
          }
        }
      `}</style>
    </div>
  );
};

export default StatCard;
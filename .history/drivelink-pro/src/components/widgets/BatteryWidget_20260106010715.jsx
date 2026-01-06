import React from 'react';

const BatteryWidget = ({ sensorData }) => {
    const voltage = sensorData?.battery?.value || 0;
    
    // Battery Percentage Logic (12V Battery)
    let percentage = ((voltage - 11.8) / 0.9) * 100;
    percentage = Math.max(0, Math.min(100, percentage));
    
    // Color Logic
    let batteryColor = '#5cb85c'; // Green
    if (percentage < 20) batteryColor = '#d9534f'; // Red
    else if (percentage < 50) batteryColor = '#f0ad4e'; // Orange

    return (
        <div className="widget battery-widget">
            <div className="widget-header">
                <h2><i className="fas fa-car-battery"></i> Battery Status</h2>
            </div>
            <div className="widget-content">
                 <div className="battery-display">
                    <div className="battery-container">
                        <div className="battery-head"></div>
                        <div className="battery-body">
                            <div className="battery-charge" style={{ height: `${percentage}%`, background: batteryColor }}></div>
                            <div className="battery-status">
                                <i className="fas fa-bolt"></i>
                                <span>{Math.round(percentage)}%</span>
                            </div>
                        </div>
                    </div>
                 </div>
                 <div className="battery-details" style={{marginTop:'15px'}}>
                    <div className="detail-item">
                        <span className="label">Voltage:</span>
                        <span className="value">{voltage} V</span>
                    </div>
                    <div className="detail-item">
                        <span className="label">Health:</span>
                        <span className="value" style={{color: voltage > 12.0 ? '#5cb85c' : '#d9534f'}}>
                            {voltage > 12.0 ? 'Good' : 'Weak'}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BatteryWidget;
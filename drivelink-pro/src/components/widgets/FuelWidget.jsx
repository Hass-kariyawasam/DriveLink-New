import React from 'react';

const FuelWidget = ({ sensorData }) => {
    const currentLevel = sensorData?.fuel_sensor?.value || 0;
    const min = 0; 
    const max = 100;
    
    // Percentage Calculation
    let percentage = ((currentLevel - min) / (max - min)) * 100;
    percentage = Math.max(0, Math.min(100, percentage));

    // Liters Calculation (Tank Capacity = 50L example)
    const liters = ((percentage / 100) * 50).toFixed(1);
    const range = Math.round(liters * 10); // 10km per liter assumption

    return (
        <div className="widget fuel-widget">
            <div className="widget-header">
                <h2><i className="fas fa-gas-pump"></i> Fuel Monitor</h2>
            </div>
            <div className="widget-content">
                <div className="fuel-container">
                    <div className="water" style={{ height: `${percentage}%` }}>
                        <div className="wave"></div>
                        <div className="wave"></div>
                    </div>
                    <div className="fuel-text" style={{zIndex: 5, position:'relative'}}>
                        {percentage.toFixed(0)}%
                    </div>
                </div>
                <div className="fuel-details">
                    <div className="detail-item">
                        <span className="label">Volume:</span>
                        <span className="value">{liters} L</span>
                    </div>
                    <div className="detail-item">
                        <span className="label">Range:</span>
                        <span className="value">~{range} km</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FuelWidget;
// src/components/widgets/TripStatsWidget.jsx
import React from 'react';
import '../../css/tripwidget.css';

/**
 * Reusable Trip Stats Widget
 * Can be used in TripManage, LiveTracking, and TripView
 * 
 * @param {Object} stats - Statistics object with various trip metrics
 * @param {boolean} showSatellite - Whether to show GPS satellite widget
 * @param {boolean} compact - Compact mode for smaller displays
 */

const TripStatsWidget = ({ stats = {}, showSatellite = true, compact = false }) => {
    const {
        distance = 0,
        totalDuration = 0,
        movingDuration = 0,
        topSpeed = 0,
        speed = 0,
        fuelUsed = 0,
        cost = 0,
        consumption = 0,
        currentFuelLevel = 0,
        range = 0,
        satellites = 0,
        stops = 0
    } = stats;

    return (
        <div className={`trip-stats-grid ${compact ? 'compact' : ''}`}>
            
            {/* Distance */}
            <StatCard
                icon="fa-road"
                label="Distance"
                value={`${parseFloat(distance).toFixed(2)} km`}
                color="#3699ff"
            />

            {/* Total Time */}
            <StatCard
                icon="fa-clock"
                label="Total Time"
                value={`${Math.floor(totalDuration)} min`}
                color="#8950fc"
            />

            {/* Moving Time */}
            <StatCard
                icon="fa-stopwatch"
                label="Drive Time"
                value={`${Math.floor(movingDuration)} min`}
                color="#28a745"
            />

            {/* Top Speed */}
            <StatCard
                icon="fa-tachometer-alt"
                label="Max Speed"
                value={`${parseFloat(topSpeed).toFixed(0)} km/h`}
                color="#f64e60"
            />

            {/* Fuel Used */}
            <StatCard
                icon="fa-gas-pump"
                label="Fuel Used"
                value={`${parseFloat(fuelUsed).toFixed(2)} L`}
                color="#ffa800"
            />

            {/* Cost */}
            <StatCard
                icon="fa-money-bill-wave"
                label="Fuel Cost"
                value={`Rs. ${parseFloat(cost).toFixed(0)}`}
                color="#1bc5bd"
            />

            {/* Current Fuel Level */}
            <StatCard
                icon="fa-flask"
                label="Fuel Level"
                value={`${parseFloat(currentFuelLevel).toFixed(1)} L`}
                color="#00d2fc"
            />

            {/* GPS Satellite Widget */}
            {showSatellite ? (
                <SatelliteWidget count={satellites} />
            ) : (
                /* Alternative: Show consumption or stops */
                <StatCard
                    icon="fa-parking"
                    label="Total Stops"
                    value={stops}
                    color="#6c7293"
                />
            )}
        </div>
    );
};

// Individual Stat Card Component
const StatCard = ({ icon, label, value, color }) => (
    <div className="trip-stat-card">
        <div className="stat-icon-box" style={{ color: color, background: `${color}15` }}>
            <i className={`fas ${icon}`}></i>
        </div>
        <div className="stat-content-box">
            <span className="stat-label-text">{label}</span>
            <span className="stat-value-text">{value}</span>
        </div>
    </div>
);

// Satellite Widget with Signal Bars
const SatelliteWidget = ({ count }) => {
    let signalColor = '#f64e60'; // Weak (Red)
    let signalLabel = 'Weak';
    let activeBars = 1;

    if (count >= 4) {
        signalColor = '#ffa800';
        signalLabel = 'Good';
        activeBars = 2;
    }
    if (count >= 7) {
        signalColor = '#1bc5bd';
        signalLabel = 'Excellent';
        activeBars = 4;
    }

    return (
        <div className="trip-stat-card satellite-stat-card">
            <div className="satellite-info-box">
                <span className="stat-label-text">GPS Signal</span>
                <span className="stat-value-text" style={{ color: signalColor }}>
                    {count} Sats
                </span>
            </div>
            <div className="signal-bars-container">
                {[1, 2, 3, 4].map(barNum => (
                    <div
                        key={barNum}
                        className="signal-bar-item"
                        style={{
                            height: `${barNum * 4 + 6}px`,
                            backgroundColor: barNum <= activeBars ? signalColor : 'rgba(255,255,255,0.1)'
                        }}
                    />
                ))}
            </div>
        </div>
    );
};

export default TripStatsWidget;
export { StatCard, SatelliteWidget };
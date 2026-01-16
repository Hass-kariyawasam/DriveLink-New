// TripReport.jsx - පැරණි reports බලන්න පුළුවන් විදිහට
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { auth, db } from '../firebase';
import { collection, query, orderBy, getDocs, where } from 'firebase/firestore';
import { onAuthStateChanged } from "firebase/auth";
import '../css/tripreport.css';

const TripReport = () => {
    const [trips, setTrips] = useState([]);
    const [loading, setLoading] = useState(true);
    const [summary, setSummary] = useState({ distance: 0, cost: 0, trips: 0, totalTime: 0 });
    const [viewMode, setViewMode] = useState('recent'); // 'recent' or 'all'
    const [dateFilter, setDateFilter] = useState('all'); // 'all', 'today', 'week', 'month'
    const navigate = useNavigate();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                await loadTrips(user.uid);
            }
        });
        return () => unsubscribe();
    }, [dateFilter]);

    const loadTrips = async (userId) => {
        setLoading(true);
        try {
            let q = query(
                collection(db, `tripReports/${userId}/trips`), 
                orderBy("date", "desc")
            );

            const querySnapshot = await getDocs(q);
            let loadedTrips = [];
            let totalDist = 0;
            let totalCost = 0;
            let totalTime = 0;

            const now = new Date();
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

            querySnapshot.forEach((doc) => {
                const data = doc.data();
                const tripDate = new Date(data.date);
                
                // Date filtering
                let includeTrip = true;
                if (dateFilter === 'today') {
                    includeTrip = tripDate >= today;
                } else if (dateFilter === 'week') {
                    includeTrip = tripDate >= weekAgo;
                } else if (dateFilter === 'month') {
                    includeTrip = tripDate >= monthAgo;
                }

                if (includeTrip) {
                    loadedTrips.push({ id: doc.id, ...data });
                    totalDist += parseFloat(data.distance || 0);
                    totalCost += parseFloat(data.cost || 0);
                    totalTime += parseFloat(data.totalDuration || 0);
                }
            });

            setTrips(loadedTrips);
            setSummary({
                distance: totalDist.toFixed(1),
                cost: totalCost.toFixed(0),
                trips: loadedTrips.length,
                totalTime: Math.floor(totalTime)
            });
        } catch (error) {
            console.error("Error loading trips:", error);
            alert("Error loading trips: " + error.message);
        }
        setLoading(false);
    };

    const handleViewTrip = (id) => {
        navigate(`/reports/view/${id}`);
    };

    const getFilteredTrips = () => {
        if (viewMode === 'recent') {
            return trips.slice(0, 10); // Show only latest 10
        }
        return trips; // Show all
    };

    return (
        <Layout>
            <div className="dashboard-content">
                <div className="main-header">
                    <div className="header-left">
                        <h1>Trip History</h1>
                        <span className="breadcrumb">
                            {viewMode === 'recent' ? 'Recent Trips' : 'All Trips'} 
                            {dateFilter !== 'all' && ` (${dateFilter})`}
                        </span>
                    </div>
                    <div className="header-right">
                        {/* View Mode Toggle */}
                        <div className="view-mode-toggle">
                            <button 
                                className={`toggle-btn ${viewMode === 'recent' ? 'active' : ''}`}
                                onClick={() => setViewMode('recent')}
                            >
                                <i className="fas fa-clock"></i> Recent
                            </button>
                            <button 
                                className={`toggle-btn ${viewMode === 'all' ? 'active' : ''}`}
                                onClick={() => setViewMode('all')}
                            >
                                <i className="fas fa-list"></i> All Trips
                            </button>
                        </div>

                        {/* Date Filter */}
                        <div className="date-filter">
                            <select 
                                value={dateFilter} 
                                onChange={(e) => setDateFilter(e.target.value)}
                                className="filter-select"
                            >
                                <option value="all">All Time</option>
                                <option value="today">Today</option>
                                <option value="week">Last 7 Days</option>
                                <option value="month">Last 30 Days</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div className="tr-container">
                    {/* Summary Cards */}
                    <div className="tr-summary-grid">
                        <SummaryCard 
                            icon="fa-route" 
                            title="Total Distance" 
                            value={`${summary.distance} km`} 
                            color="#3699ff"
                            subtitle="Traveled"
                        />
                        <SummaryCard 
                            icon="fa-clock" 
                            title="Total Time" 
                            value={`${summary.totalTime} min`} 
                            color="#8950fc"
                            subtitle="On Road"
                        />
                        <SummaryCard 
                            icon="fa-coins" 
                            title="Total Cost" 
                            value={`Rs. ${summary.cost}`} 
                            color="#1bc5bd"
                            subtitle="Fuel Spent"
                        />
                        <SummaryCard 
                            icon="fa-flag-checkered" 
                            title="Total Trips" 
                            value={summary.trips} 
                            color="#ffa800"
                            subtitle={viewMode === 'recent' ? 'Showing Recent' : 'Completed'}
                        />
                    </div>

                    {/* Trip Cards Grid */}
                    <div className="trips-grid-container">
                        {/* Info Banner */}
                        {viewMode === 'recent' && trips.length > 10 && (
                            <div className="info-banner">
                                <i className="fas fa-info-circle"></i>
                                <span>Showing latest 10 trips. Switch to "All Trips" to see {trips.length} total trips.</span>
                            </div>
                        )}

                        {loading ? (
                            <div className="loading-state">
                                <i className="fas fa-spinner fa-spin"></i>
                                <p>Loading your trips...</p>
                            </div>
                        ) : trips.length === 0 ? (
                            <div className="empty-state">
                                <i className="fas fa-route"></i>
                                <h3>No trips found</h3>
                                <p>
                                    {dateFilter !== 'all' 
                                        ? `No trips recorded in the selected time period.` 
                                        : 'Start tracking your journey from Trip Manager'}
                                </p>
                                {dateFilter !== 'all' && (
                                    <button 
                                        className="btn-primary" 
                                        onClick={() => setDateFilter('all')}
                                        style={{marginTop: '15px'}}
                                    >
                                        View All Trips
                                    </button>
                                )}
                            </div>
                        ) : (
                            <div className="trips-grid">
                                {getFilteredTrips().map((trip, index) => (
                                    <TripCard 
                                        key={trip.id} 
                                        trip={trip} 
                                        onView={() => handleViewTrip(trip.id)}
                                        isRecent={index < 3} // Mark first 3 as recent
                                    />
                                ))}
                            </div>
                        )}

                        {/* Show More Button */}
                        {viewMode === 'recent' && trips.length > 10 && (
                            <div style={{textAlign: 'center', marginTop: '20px'}}>
                                <button 
                                    className="btn-show-more"
                                    onClick={() => setViewMode('all')}
                                >
                                    <i className="fas fa-chevron-down"></i>
                                    Show All {trips.length} Trips
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </Layout>
    );
};

// Enhanced Summary Card
const SummaryCard = ({ icon, title, value, color, subtitle }) => (
    <div className="tr-stat-card-enhanced">
        <div className="stat-icon-wrapper" style={{background: `${color}15`}}>
            <i className={`fas ${icon}`} style={{color: color}}></i>
        </div>
        <div className="stat-content">
            <span className="stat-label">{title}</span>
            <span className="stat-value">{value}</span>
            <span className="stat-subtitle">{subtitle}</span>
        </div>
    </div>
);

// Enhanced Trip Card with Recent Badge
const TripCard = ({ trip, onView, isRecent }) => {
    const tripDate = new Date(trip.date);
    const consumption = trip.distance > 0 ? ((trip.fuelUsed / trip.distance) * 100).toFixed(2) : 0;
    
    // Calculate how old the trip is
    const now = new Date();
    const diffTime = Math.abs(now - tripDate);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    let ageLabel = '';
    if (diffDays === 0) ageLabel = 'Today';
    else if (diffDays === 1) ageLabel = 'Yesterday';
    else if (diffDays < 7) ageLabel = `${diffDays} days ago`;
    else if (diffDays < 30) ageLabel = `${Math.floor(diffDays / 7)} weeks ago`;
    else ageLabel = `${Math.floor(diffDays / 30)} months ago`;

    return (
        <div className={`trip-card-modern ${isRecent ? 'recent-trip' : ''}`} onClick={onView}>
            <div className="trip-card-header">
                <div className="trip-status-badge">
                    <i className="fas fa-check-circle"></i> Completed
                </div>
                <div className="trip-date-time">
                    <span className="trip-date">
                        {tripDate.toLocaleDateString('en-GB', {day: '2-digit', month: 'short'})}
                    </span>
                    <span className="trip-time">
                        {tripDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </span>
                </div>
            </div>

            <div className="trip-card-body">
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                    <h3 className="trip-name">{trip.tripName}</h3>
                    {isRecent && (
                        <span className="recent-badge">
                            <i className="fas fa-star"></i>
                        </span>
                    )}
                </div>
                
                {/* Age Label */}
                <div style={{fontSize: '11px', color: '#6c7293', marginBottom: '10px'}}>
                    <i className="fas fa-history"></i> {ageLabel}
                </div>

                <div className="trip-stats-row">
                    <div className="stat-item">
                        <i className="fas fa-road"></i>
                        <span>{trip.distance} km</span>
                    </div>
                    <div className="stat-item">
                        <i className="fas fa-clock"></i>
                        <span>{Math.floor(trip.totalDuration)} min</span>
                    </div>
                </div>

                <div className="trip-stats-row">
                    <div className="stat-item">
                        <i className="fas fa-gas-pump"></i>
                        <span>{trip.fuelUsed} L</span>
                    </div>
                    <div className="stat-item">
                        <i className="fas fa-burn"></i>
                        <span>{consumption} L/100km</span>
                    </div>
                </div>

                <div className="trip-card-footer">
                    <div className="fuel-cost">
                        <i className="fas fa-coins"></i>
                        <span>Rs. {trip.cost}</span>
                    </div>
                    <button className="view-btn-modern">
                        <i className="fas fa-map-marked-alt"></i> View
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TripReport;
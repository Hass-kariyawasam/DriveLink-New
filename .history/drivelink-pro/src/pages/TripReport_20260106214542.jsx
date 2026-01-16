import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { auth, db } from '../firebase';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import { onAuthStateChanged } from "firebase/auth";
import '../css/tripreport.css';

const TripReport = () => {
    const [trips, setTrips] = useState([]);
    const [loading, setLoading] = useState(true);
    const [summary, setSummary] = useState({ distance: 0, cost: 0, trips: 0, totalTime: 0 });
    const navigate = useNavigate();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                try {
                    const q = query(collection(db, `tripReports/${user.uid}/trips`), orderBy("date", "desc"));
                    const querySnapshot = await getDocs(q);
                    
                    let loadedTrips = [];
                    let totalDist = 0;
                    let totalCost = 0;
                    let totalTime = 0;

                    querySnapshot.forEach((doc) => {
                        const data = doc.data();
                        loadedTrips.push({ id: doc.id, ...data });
                        totalDist += parseFloat(data.distance || 0);
                        totalCost += parseFloat(data.cost || 0);
                        totalTime += parseFloat(data.totalDuration || 0);
                    });

                    setTrips(loadedTrips);
                    setSummary({
                        distance: totalDist.toFixed(1),
                        cost: totalCost.toFixed(0),
                        trips: loadedTrips.length,
                        totalTime: Math.floor(totalTime)
                    });
                } catch (error) {
                    console.error("Error:", error);
                }
                setLoading(false);
            }
        });
        return () => unsubscribe();
    }, []);

    const handleViewTrip = (id) => {
        navigate(`/reports/view/${id}`);
    };

    return (
        <Layout>
            <div className="dashboard-content">
                <div className="main-header">
                    <div className="header-left">
                        <h1>Trip History</h1>
                        <span className="breadcrumb">All your recorded journeys</span>
                    </div>
                </div>

                <div className="tr-container">
                    
                    {/* Enhanced Summary Cards */}
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
                            subtitle="Completed"
                        />
                    </div>

                    {/* Enhanced Trip Cards Grid */}
                    <div className="trips-grid-container">
                        {loading ? (
                            <div className="loading-state">
                                <i className="fas fa-spinner fa-spin"></i>
                                <p>Loading your trips...</p>
                            </div>
                        ) : trips.length === 0 ? (
                            <div className="empty-state">
                                <i className="fas fa-route"></i>
                                <h3>No trips recorded yet</h3>
                                <p>Start tracking your journey from Trip Manager</p>
                            </div>
                        ) : (
                            <div className="trips-grid">
                                {trips.map(trip => (
                                    <TripCard key={trip.id} trip={trip} onView={() => handleViewTrip(trip.id)} />
                                ))}
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

// Trip Card Component
const TripCard = ({ trip, onView }) => {
    const tripDate = new Date(trip.date);
    const consumption = trip.distance > 0 ? ((trip.fuelUsed / trip.distance) * 100).toFixed(2) : 0;

    return (
        <div className="trip-card-modern" onClick={onView}>
            <div className="trip-card-header">
                <div className="trip-status-badge">
                    <i className="fas fa-check-circle"></i> Completed
                </div>
                <div className="trip-date-time">
                    <span className="trip-date">{tripDate.toLocaleDateString('en-GB', {day: '2-digit', month: 'short'})}</span>
                    <span className="trip-time">{tripDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                </div>
            </div>

            <div className="trip-card-body">
                <h3 className="trip-name">{trip.tripName}</h3>
                
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
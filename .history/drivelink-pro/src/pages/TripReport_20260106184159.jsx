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
    const [summary, setSummary] = useState({ distance: 0, cost: 0, trips: 0 });
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

                    querySnapshot.forEach((doc) => {
                        const data = doc.data();
                        loadedTrips.push({ id: doc.id, ...data });
                        totalDist += parseFloat(data.distance || 0);
                        totalCost += parseFloat(data.cost || 0);
                    });

                    setTrips(loadedTrips);
                    setSummary({
                        distance: totalDist.toFixed(1),
                        cost: totalCost.toFixed(0),
                        trips: loadedTrips.length
                    });
                } catch (error) {
                    console.error("Error:", error);
                }
                setLoading(false);
            }
        });
        return () => unsubscribe();
    }, []);

    // Navigate to Separate Page
    const handleViewTrip = (id) => {
        navigate(`/reports/view/${id}`);
    };

    return (
        <Layout>
            <div className="dashboard-content">
                <div className="main-header">
                    <div className="header-left">
                        <h1>Trip History</h1>
                        <span className="breadcrumb">All Recorded Trips</span>
                    </div>
                </div>

                <div className="tr-container">
                    
                    {/* Summary Cards */}
                    <div className="tr-summary-grid">
                        <SummaryCard icon="fa-route" title="Total Distance" value={`${summary.distance} km`} color="#3699ff" />
                        <SummaryCard icon="fa-coins" title="Total Cost" value={`Rs. ${summary.cost}`} color="#1bc5bd" />
                        <SummaryCard icon="fa-flag-checkered" title="Total Trips" value={summary.trips} color="#ffa800" />
                    </div>

                    {/* Enhanced List Design */}
                    <div className="tr-list-wrapper">
                        {loading ? <p style={{textAlign:'center', color:'#888', padding:'20px'}}>Loading records...</p> : (
                            <table className="tr-table">
                                <thead>
                                    <tr>
                                        <th>Date & Time</th>
                                        <th>Trip Name</th>
                                        <th>Stats</th>
                                        <th>Cost</th>
                                        <th>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {trips.length === 0 ? (
                                        <tr><td colSpan="5" style={{textAlign:'center', padding:'30px'}}>No trips found.</td></tr>
                                    ) : (
                                        trips.map(trip => (
                                            <tr key={trip.id} className="tr-row">
                                                <td>
                                                    <div className="tr-date-box">
                                                        <span className="tr-day">{new Date(trip.date).toLocaleDateString()}</span>
                                                        <span className="tr-time">{new Date(trip.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                                    </div>
                                                </td>
                                                <td>
                                                    <div className="tr-name">{trip.tripName}</div>
                                                    <div className="tr-sub-text">{Math.floor(trip.totalDuration)} min drive</div>
                                                </td>
                                                <td>
                                                    <div className="tr-pill blue"><i className="fas fa-road"></i> {trip.distance} km</div>
                                                    <div className="tr-pill orange" style={{marginTop:'5px'}}><i className="fas fa-gas-pump"></i> {trip.fuelUsed} L</div>
                                                </td>
                                                <td>
                                                    <span className="tr-cost-val">Rs. {trip.cost}</span>
                                                </td>
                                                <td>
                                                    <button className="tr-view-btn" onClick={() => handleViewTrip(trip.id)}>
                                                        View Map <i className="fas fa-arrow-right"></i>
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            </div>
        </Layout>
    );
};

const SummaryCard = ({ icon, title, value, color }) => (
    <div className="tr-stat-card">
        <div className="tr-icon-box" style={{color: color, background: `${color}15`}}>
            <i className={`fas ${icon}`}></i>
        </div>
        <div className="tr-info">
            <h3>{title}</h3>
            <span>{value}</span>
        </div>
    </div>
);

export default TripReport;
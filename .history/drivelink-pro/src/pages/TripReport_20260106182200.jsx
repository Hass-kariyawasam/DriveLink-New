import React, { useState, useEffect, useRef } from 'react';
import Layout from '../components/Layout';
import { auth, db } from '../firebase';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import { onAuthStateChanged } from "firebase/auth";
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import '../css/tripreport.css';

// Icons Fix
import markerIconPng from "leaflet/dist/images/marker-icon.png";
import markerIcon2xPng from "leaflet/dist/images/marker-icon-2x.png";
import markerShadowPng from "leaflet/dist/images/marker-shadow.png";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2xPng,
  iconUrl: markerIconPng,
  shadowUrl: markerShadowPng,
});

const TripReport = () => {
    const [trips, setTrips] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedTrip, setSelectedTrip] = useState(null);
    const [summary, setSummary] = useState({ distance: 0, cost: 0, trips: 0 });

    const mapInstance = useRef(null);
    const polylineRef = useRef(null);

    // 1. Fetch Data
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
                    console.error("Error fetching trips:", error);
                }
                setLoading(false);
            }
        });
        return () => unsubscribe();
    }, []);

    // 2. Map Modal Effect
    useEffect(() => {
        if (selectedTrip && !mapInstance.current) {
            // Wait for modal to render
            setTimeout(() => {
                const map = L.map('report-map').setView([6.9271, 79.8612], 13);
                L.tileLayer('https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}', { maxZoom: 20 }).addTo(map);
                mapInstance.current = map;

                if (selectedTrip.path && selectedTrip.path.length > 0) {
                    const latlngs = selectedTrip.path.map(p => [p.lat, p.lng]);
                    
                    // Draw Line
                    L.polyline(latlngs, { color: '#3699ff', weight: 5 }).addTo(map);
                    
                    // Markers
                    L.marker(latlngs[0]).addTo(map).bindPopup("Start");
                    L.marker(latlngs[latlngs.length - 1]).addTo(map).bindPopup("End");
                    
                    // Fit Bounds
                    map.fitBounds(latlngs);
                }
            }, 100);
        }

        // Cleanup when modal closes
        if (!selectedTrip && mapInstance.current) {
            mapInstance.current.remove();
            mapInstance.current = null;
        }
    }, [selectedTrip]);

    return (
        <Layout>
            <div className="dashboard-content">
                <div className="main-header">
                    <div className="header-left">
                        <h1>Trip Reports</h1>
                        <span className="breadcrumb">History & Analytics</span>
                    </div>
                </div>

                <div className="tr-container">
                    
                    {/* Summary Cards */}
                    <div className="tr-summary-grid">
                        <div className="tr-stat-card">
                            <div className="tr-icon-box" style={{color: '#3699ff'}}><i className="fas fa-road"></i></div>
                            <div className="tr-info"><h3>Total Distance</h3><span>{summary.distance} km</span></div>
                        </div>
                        <div className="tr-stat-card">
                            <div className="tr-icon-box" style={{color: '#f64e60'}}><i className="fas fa-money-bill"></i></div>
                            <div className="tr-info"><h3>Total Cost</h3><span>Rs. {summary.cost}</span></div>
                        </div>
                        <div className="tr-stat-card">
                            <div className="tr-icon-box" style={{color: '#ffa800'}}><i className="fas fa-car"></i></div>
                            <div className="tr-info"><h3>Total Trips</h3><span>{summary.trips}</span></div>
                        </div>
                    </div>

                    {/* Trips Table */}
                    <div className="tr-list-wrapper">
                        {loading ? <p style={{color:'white', textAlign:'center'}}>Loading data...</p> : (
                            <table className="tr-table">
                                <thead>
                                    <tr>
                                        <th>Date</th>
                                        <th>Trip Name</th>
                                        <th>Distance</th>
                                        <th>Duration</th>
                                        <th>Fuel Used</th>
                                        <th>Cost</th>
                                        <th>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
    {trips.length === 0 ? (
        <tr>
            {/* CHANGE 'colspan' TO 'colSpan' HERE */}
            <td colSpan="7" style={{textAlign:'center'}}>No trips recorded yet.</td>
        </tr>
    ) : (
                                        trips.map(trip => (
                                            <tr key={trip.id}>
                                                <td className="tr-date">{new Date(trip.date).toLocaleDateString()}</td>
                                                <td>{trip.tripName}</td>
                                                <td>{trip.distance} km</td>
                                                <td>{Math.floor(trip.totalDuration)} min</td>
                                                <td>{trip.fuelUsed} L</td>
                                                <td className="tr-cost">Rs. {trip.cost}</td>
                                                <td>
                                                    <button className="tr-btn-view" onClick={() => setSelectedTrip(trip)}>
                                                        <i className="fas fa-map"></i> View
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

                {/* Map Modal */}
                {selectedTrip && (
                    <div className="tr-modal-overlay">
                        <div className="tr-modal-content">
                            <div className="tr-modal-header">
                                <h2>{selectedTrip.tripName} - Path View</h2>
                                <button className="tr-close-btn" onClick={() => setSelectedTrip(null)}>&times;</button>
                            </div>
                            <div className="tr-modal-body">
                                <div id="report-map"></div>
                            </div>
                        </div>
                    </div>
                )}

            </div>
        </Layout>
    );
};

export default TripReport;
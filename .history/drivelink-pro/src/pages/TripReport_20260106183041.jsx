import React, { useState, useEffect, useRef } from 'react';
import Layout from '../components/Layout';
import { auth, db } from '../firebase';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import { onAuthStateChanged } from "firebase/auth";
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import '../css/tripreport.css';

const TripReport = () => {
    const [trips, setTrips] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedTrip, setSelectedTrip] = useState(null);
    const [summary, setSummary] = useState({ distance: 0, cost: 0, trips: 0 });

    const mapInstance = useRef(null);

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

    // 2. Map Rendering (With Custom Icons)
    useEffect(() => {
        if (selectedTrip && !mapInstance.current) {
            setTimeout(() => {
                const map = L.map('report-map', { zoomControl: false }).setView([6.9271, 79.8612], 13);
                
                // Google Hybrid Map Layer
                L.tileLayer('https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}', { maxZoom: 20 }).addTo(map);
                L.control.zoom({ position: 'bottomright' }).addTo(map);
                
                mapInstance.current = map;

                if (selectedTrip.path && selectedTrip.path.length > 0) {
                    const latlngs = selectedTrip.path.map(p => [p.lat, p.lng]);
                    
                    // 1. Draw Polyline (Blue Path)
                    L.polyline(latlngs, { color: '#3699ff', weight: 6, opacity: 0.8 }).addTo(map);
                    
                    // --- CUSTOM ICONS ---
                    
                    // Start Icon (Green Play)
                    const startIcon = L.divIcon({
                        className: 'custom-marker marker-start',
                        html: `<div class="marker-pin"></div><i class="fas fa-play marker-icon"></i>`,
                        iconSize: [30, 30],
                        iconAnchor: [15, 30]
                    });

                    // End Icon (Red Flag)
                    const endIcon = L.divIcon({
                        className: 'custom-marker marker-end',
                        html: `<div class="marker-pin"></div><i class="fas fa-flag-checkered marker-icon"></i>`,
                        iconSize: [30, 30],
                        iconAnchor: [15, 30]
                    });

                    // Stop Icon (Yellow P)
                    const stopIcon = L.divIcon({
                        className: 'custom-marker marker-stop',
                        html: `<div class="marker-pin"></div><i class="fas fa-parking marker-icon"></i>`,
                        iconSize: [24, 24],
                        iconAnchor: [12, 12]
                    });

                    // 2. Add Start & End Markers
                    L.marker(latlngs[0], { icon: startIcon }).addTo(map);
                    L.marker(latlngs[latlngs.length - 1], { icon: endIcon }).addTo(map);

                    // 3. Add Parking/Stop Markers
                    if (selectedTrip.stops && selectedTrip.stops.length > 0) {
                        selectedTrip.stops.forEach(stop => {
                            L.marker([stop.lat, stop.lng], { icon: stopIcon }).addTo(map);
                        });
                    }
                    
                    // Fit Bounds
                    map.fitBounds(latlngs, { padding: [50, 50] });
                }
            }, 100);
        }

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

                    {/* Trips List */}
                    <div className="tr-list-wrapper">
                        {loading ? <p style={{color:'white', textAlign:'center'}}>Loading data...</p> : (
                            <table className="tr-table">
                                <thead>
                                    <tr>
                                        <th>Date</th>
                                        <th>Trip Name</th>
                                        <th>Distance</th>
                                        <th>Fuel</th>
                                        <th>Cost</th>
                                        <th>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {trips.length === 0 ? (
                                        <tr><td colSpan="6" style={{textAlign:'center'}}>No trips recorded yet.</td></tr>
                                    ) : (
                                        trips.map(trip => (
                                            <tr key={trip.id}>
                                                <td className="tr-date">{new Date(trip.date).toLocaleDateString()}</td>
                                                <td>{trip.tripName}</td>
                                                <td>{trip.distance} km</td>
                                                <td>{trip.fuelUsed} L</td>
                                                <td className="tr-cost">Rs. {trip.cost}</td>
                                                <td>
                                                    <button className="tr-btn-view" onClick={() => setSelectedTrip(trip)}>
                                                        <i className="fas fa-map-marked-alt"></i> View Path
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

                {/* Map Modal (New Design) */}
                {selectedTrip && (
                    <div className="tr-modal-overlay">
                        <div className="tr-modal-content">
                            
                            {/* Header with Details (No Popups Needed) */}
                            <div className="tr-map-header">
                                <div className="tr-trip-title">
                                    <h2>{selectedTrip.tripName}</h2>
                                    <div className="tr-trip-meta">
                                        <span className="tr-meta-item"><i className="fas fa-clock" style={{color:'#3699ff'}}></i> {Math.floor(selectedTrip.totalDuration)} min</span>
                                        <span
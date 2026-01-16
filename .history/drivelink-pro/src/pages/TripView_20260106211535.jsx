import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { auth, db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { onAuthStateChanged } from "firebase/auth";
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import '../css/tripmanage.css';
import '../css/tripreport.css';

// Remove default icon imports - using custom icons
delete L.Icon.Default.prototype._getIconUrl;

// Map Layers
const STREET_MAP = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
const SATELLITE_MAP = 'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}';

const TripView = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [trip, setTrip] = useState(null);
    const [loading, setLoading] = useState(true);
    
    // State for Map Mode
    const [isSatelliteMode, setIsSatelliteMode] = useState(true);

    const mapInstance = useRef(null);
    const tileLayerRef = useRef(null);

    // 1. Fetch Trip Data
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user && id) {
                try {
                    const docRef = doc(db, `tripReports/${user.uid}/trips`, id);
                    const docSnap = await getDoc(docRef);
                    
                    if (docSnap.exists()) {
                        setTrip(docSnap.data());
                    } else {
                        alert("Trip not found!");
                        navigate('/tripreport');
                    }
                } catch (error) {
                    console.error("Error:", error);
                }
                setLoading(false);
            }
        });
        return () => unsubscribe();
    }, [id, navigate]);

    // 2. Map Initialization with Custom Icons (Like TripManage)
    useEffect(() => {
        if (!loading && trip && !mapInstance.current) {
            setTimeout(() => {
                const map = L.map('view-map', { zoomControl: false }).setView([6.9271, 79.8612], 13);
                
                tileLayerRef.current = L.tileLayer(SATELLITE_MAP, { maxZoom: 20 }).addTo(map);
                L.control.zoom({ position: 'bottomright' }).addTo(map);
                mapInstance.current = map;

                if (trip.path && trip.path.length > 0) {
                    const latlngs = trip.path.map(p => [p.lat, p.lng]);
                    
                    // Path Line
                    L.polyline(latlngs, { color: '#3699ff', weight: 6, opacity: 0.8 }).addTo(map);
                    
                    // Custom Markers - Same style as TripManage
                    const startIcon = L.divIcon({ 
                        className: 'custom-marker marker-start', 
                        html: `<div class="marker-pin"></div><i class="fas fa-play marker-icon"></i>`, 
                        iconSize: [35, 45], 
                        iconAnchor: [17, 45] 
                    });
                    
                    const endIcon = L.divIcon({ 
                        className: 'custom-marker marker-end', 
                        html: `<div class="marker-pin"></div><i class="fas fa-flag-checkered marker-icon"></i>`, 
                        iconSize: [35, 45], 
                        iconAnchor: [17, 45] 
                    });
                    
                    const stopIcon = L.divIcon({ 
                        className: 'custom-marker marker-stop', 
                        html: `<div class="marker-pin"></div><i class="fas fa-parking marker-icon"></i>`, 
                        iconSize: [28, 32], 
                        iconAnchor: [14, 32] 
                    });

                    // Add Markers
                    L.marker(latlngs[0], { icon: startIcon }).addTo(map)
                        .bindPopup(`<strong>Start</strong><br>${new Date(trip.date).toLocaleTimeString()}`);
                    
                    L.marker(latlngs[latlngs.length - 1], { icon: endIcon }).addTo(map)
                        .bindPopup(`<strong>End</strong><br>${new Date(trip.date).toLocaleTimeString()}`);

                    // Stop Markers
                    if (trip.stops && trip.stops.length > 0) {
                        trip.stops.forEach((stop, idx) => {
                            L.marker([stop.lat, stop.lng], { icon: stopIcon }).addTo(map)
                                .bindPopup(`<strong>Stop ${idx + 1}</strong>`);
                        });
                    }
                    
                    map.fitBounds(latlngs, { padding: [50, 50] });
                }
            }, 100);
        }
    }, [loading, trip]);

    // 3. Toggle Map
    const toggleMapMode = () => {
        if (mapInstance.current && tileLayerRef.current) {
            mapInstance.current.removeLayer(tileLayerRef.current);
            const newUrl = isSatelliteMode ? STREET_MAP : SATELLITE_MAP;
            tileLayerRef.current = L.tileLayer(newUrl, { maxZoom: 20 }).addTo(mapInstance.current);
            setIsSatelliteMode(!isSatelliteMode);
        }
    };

    if (loading) return <div style={{color:'white', padding:'20px'}}>Loading...</div>;

    return (
        <Layout>
            <div className="dashboard-content">
                {/* Enhanced Header with Trip Stats */}
                <div className="trip-view-header">
                    <button onClick={() => navigate('/tripreport')} className="back-btn-modern">
                        <i className="fas fa-arrow-left"></i>
                    </button>
                    <div className="trip-header-content">
                        <h1 className="trip-title">{trip?.tripName || "Trip View"}</h1>
                        <div className="trip-meta-bar">
                            <div className="meta-item">
                                <i className="fas fa-calendar"></i>
                                <span>{new Date(trip?.date).toLocaleDateString('en-GB', {day: '2-digit', month: 'short', year: 'numeric'})}</span>
                            </div>
                            <div className="meta-divider"></div>
                            <div className="meta-item">
                                <i className="fas fa-clock"></i>
                                <span>{new Date(trip?.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                            </div>
                            <div className="meta-divider"></div>
                            <div className="meta-item">
                                <i className="fas fa-route"></i>
                                <span>{trip?.distance} km</span>
                            </div>
                            <div className="meta-divider"></div>
                            <div className="meta-item">
                                <i className="fas fa-stopwatch"></i>
                                <span>{Math.floor(trip?.totalDuration)} min</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="trip-container">
                    {/* Map Box */}
                    <div className="map-wrapper">
                        {/* Top Right Controls - Same as TripManage */}
                        <div className="map-controls-top-right">
                            <div className="status-badge-completed">
                                <div className="blink-dot"></div> COMPLETED
                            </div>
                            <button className="map-toggle-btn" onClick={toggleMapMode} title="Switch Map View">
                                <i className={`fas ${isSatelliteMode ? 'fa-map' : 'fa-satellite'}`}></i>
                            </button>
                        </div>
                        <div id="view-map"></div>
                    </div>

                    {/* WIDGETS GRID - TripManage Style */}
                    <div className="trip-info-grid">
                        <TripCard icon="fa-road" label="Distance" value={`${trip?.distance} km`} color="#3699ff" />
                        <TripCard icon="fa-clock" label="Total Time" value={`${Math.floor(trip?.totalDuration)} min`} color="#8950fc" />
                        <TripCard icon="fa-stopwatch" label="Drive Time" value={`${Math.floor(trip?.movingDuration)} min`} color="#28a745" />
                        <TripCard icon="fa-tachometer-alt" label="Max Speed" value={`${trip?.topSpeed} km/h`} color="#f64e60" />
                        <TripCard icon="fa-gas-pump" label="Fuel Used" value={`${trip?.fuelUsed} L`} color="#ffa800" />
                        <TripCard icon="fa-money-bill-wave" label="Fuel Cost" value={`Rs. ${trip?.cost}`} color="#1bc5bd" />
                        <TripCard icon="fa-burn" label="Consumption" value={`${trip?.distance > 0 ? ((trip.fuelUsed / trip.distance) * 100).toFixed(2) : 0} L/100km`} color="#00d2fc" />
                        <TripCard icon="fa-parking" label="Total Stops" value={trip?.stops?.length || 0} color="#6c7293" />
                    </div>
                    
                    {/* 🔥 DELETE BUTTON SECTION */}
                    <div style={{marginTop: '30px', textAlign: 'center'}}>
                        <button className="btn-delete-trip" onClick={handleDeleteTrip}>
                            <i className="fas fa-trash"></i> Delete Report
                        </button>
                    </div>
               
                
            </div>
        </Layout>
    );
};

// Widget Component - Same as TripManage
const TripCard = ({ icon, label, value, color }) => (
    <div className="trip-card">
        <div className="trip-icon" style={{color: color, background: `${color}15`}}>
            <i className={`fas ${icon}`}></i>
        </div>
        <div className="trip-details">
            <span className="trip-label">{label}</span>
            <span className="trip-value">{value}</span>
        </div>
    </div>
);

export default TripView;
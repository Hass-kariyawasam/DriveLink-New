// TripView.jsx - Enhanced version with Delete functionality
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { auth, db } from '../firebase';
import { doc, getDoc, deleteDoc } from 'firebase/firestore';
import { onAuthStateChanged } from "firebase/auth";
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import '../css/tripmanage.css';
import '../css/tripreport.css';

delete L.Icon.Default.prototype._getIconUrl;

const STREET_MAP = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
const SATELLITE_MAP = 'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}';

const TripView = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [trip, setTrip] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isSatelliteMode, setIsSatelliteMode] = useState(true);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleting, setDeleting] = useState(false);

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
                    alert("Error loading trip: " + error.message);
                }
                setLoading(false);
            }
        });
        return () => unsubscribe();
    }, [id, navigate]);

    // 2. Map Initialization
    useEffect(() => {
        if (!loading && trip && !mapInstance.current) {
            setTimeout(() => {
                const map = L.map('view-map', { zoomControl: false }).setView([6.9271, 79.8612], 13);
                
                tileLayerRef.current = L.tileLayer(SATELLITE_MAP, { maxZoom: 20 }).addTo(map);
                L.control.zoom({ position: 'bottomright' }).addTo(map);
                mapInstance.current = map;

                if (trip.path && trip.path.length > 0) {
                    const latlngs = trip.path.map(p => [p.lat, p.lng]);
                    
                    L.polyline(latlngs, { color: '#3699ff', weight: 6, opacity: 0.8 }).addTo(map);
                    
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

                    L.marker(latlngs[0], { icon: startIcon }).addTo(map)
                        .bindPopup(`<strong>Start</strong><br>${new Date(trip.date).toLocaleTimeString()}`);
                    
                    L.marker(latlngs[latlngs.length - 1], { icon: endIcon }).addTo(map)
                        .bindPopup(`<strong>End</strong><br>${new Date(trip.date).toLocaleTimeString()}`);

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

    // 4. DELETE TRIP FUNCTION - THIS IS NEW!
    const handleDeleteTrip = async () => {
        setDeleting(true);
        const user = auth.currentUser;
        
        if (!user) {
            alert("Please login first!");
            setDeleting(false);
            return;
        }

        try {
            // Delete from Firestore
            const tripRef = doc(db, `tripReports/${user.uid}/trips`, id);
            await deleteDoc(tripRef);
            
            alert("Trip report deleted successfully!");
            navigate('/tripreport'); // Go back to trip list
        } catch (error) {
            console.error("Error deleting trip:", error);
            alert("Failed to delete trip: " + error.message);
            setDeleting(false);
        }
    };

    if (loading) return (
        <Layout>
            <div style={{color:'white', padding:'20px', textAlign: 'center'}}>
                <i className="fas fa-spinner fa-spin" style={{fontSize: '40px', marginBottom: '15px'}}></i>
                <p>Loading trip details...</p>
            </div>
        </Layout>
    );

    return (
        <Layout>
            <div className="dashboard-content">
                {/* Enhanced Header */}
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
                    {/* Map */}
                    <div className="map-wrapper">
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

                    {/* Stats Grid */}
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

                    {/* DELETE BUTTON - THIS IS NEW! */}
                    <div style={{marginTop: '30px', textAlign: 'center'}}>
                        <button 
                            className="btn-delete-trip" 
                            onClick={() => setShowDeleteModal(true)}
                            disabled={deleting}
                        >
                            <i className="fas fa-trash-alt"></i>
                            {deleting ? 'Deleting...' : 'Delete Trip Report'}
                        </button>
                    </div>
                </div>

                {/* DELETE CONFIRMATION MODAL - THIS IS NEW! */}
                {showDeleteModal && (
                    <div className="save-modal-overlay" onClick={() => !deleting && setShowDeleteModal(false)}>
                        <div className="save-modal" onClick={(e) => e.stopPropagation()}>
                            <i className="fas fa-exclamation-triangle" style={{fontSize: '48px', color: '#f64e60', marginBottom: '15px'}}></i>
                            <h2 style={{color: 'white', margin: '10px 0'}}>Delete Trip Report?</h2>
                            <p style={{color: '#8fa2b6', marginBottom: '20px'}}>
                                This action cannot be undone.<br/>
                                All trip data will be permanently deleted.
                            </p>
                            <div className="modal-actions">
                                <button 
                                    className="btn-cancel" 
                                    onClick={() => setShowDeleteModal(false)}
                                    disabled={deleting}
                                >
                                    Cancel
                                </button>
                                <button 
                                    className="btn-confirm" 
                                    style={{background: 'linear-gradient(135deg, #f64e60, #c43347)'}}
                                    onClick={handleDeleteTrip}
                                    disabled={deleting}
                                >
                                    {deleting ? 'Deleting...' : 'Delete'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </Layout>
    );
};

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
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom'; // ID eka ganna
import Layout from '../components/Layout';
import { auth, db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { onAuthStateChanged } from "firebase/auth";
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import '../css/tripmanage.css'; // Design eka ganna
import '../css/tripreport.css';

// Icons Import
import markerIconPng from "leaflet/dist/images/marker-icon.png";
import markerIcon2xPng from "leaflet/dist/images/marker-icon-2x.png";
import markerShadowPng from "leaflet/dist/images/marker-shadow.png";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2xPng,
  iconUrl: markerIconPng,
  shadowUrl: markerShadowPng,
});

const TripView = () => {
    const { id } = useParams(); // URL eken Trip ID eka gannawa
    const navigate = useNavigate();
    const [trip, setTrip] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isSatelliteMode, setIsSatelliteMode] = useState(true);

    const mapInstance = useRef(null);

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

    // 2. Map Rendering
    useEffect(() => {
        if (!loading && trip && !mapInstance.current) {
            setTimeout(() => {
                const map = L.map('view-map', { zoomControl: false }).setView([6.9271, 79.8612], 13);
                
                // Map Layers
                const satelliteLayer = L.tileLayer('https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}', { maxZoom: 20 });
                const streetLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png');
                
                (isSatelliteMode ? satelliteLayer : streetLayer).addTo(map);
                L.control.zoom({ position: 'bottomright' }).addTo(map);
                
                mapInstance.current = map;

                if (trip.path && trip.path.length > 0) {
                    const latlngs = trip.path.map(p => [p.lat, p.lng]);
                    
                    // Polyline
                    L.polyline(latlngs, { color: '#3699ff', weight: 6, opacity: 0.8 }).addTo(map);
                    
                    // Icons
                    const startIcon = L.divIcon({ className: 'custom-marker marker-start', html: `<div class="marker-pin"></div><i class="fas fa-play marker-icon"></i>`, iconSize: [30, 30], iconAnchor: [15, 30] });
                    const endIcon = L.divIcon({ className: 'custom-marker marker-end', html: `<div class="marker-pin"></div><i class="fas fa-flag-checkered marker-icon"></i>`, iconSize: [30, 30], iconAnchor: [15, 30] });
                    const stopIcon = L.divIcon({ className: 'custom-marker marker-stop', html: `<div class="marker-pin"></div><i class="fas fa-parking marker-icon"></i>`, iconSize: [24, 24], iconAnchor: [12, 12] });

                    L.marker(latlngs[0], { icon: startIcon }).addTo(map).bindPopup("Start Time: " + new Date(trip.date).toLocaleTimeString());
                    L.marker(latlngs[latlngs.length - 1], { icon: endIcon }).addTo(map).bindPopup("End Point");

                    if (trip.stops) {
                        trip.stops.forEach(stop => L.marker([stop.lat, stop.lng], { icon: stopIcon }).addTo(map));
                    }
                    
                    map.fitBounds(latlngs, { padding: [50, 50] });
                }
            }, 100);
        }
    }, [loading, trip]);

    if (loading) return <div style={{color:'white', padding:'20px'}}>Loading Trip Details...</div>;

    return (
        <Layout>
            <div className="dashboard-content">
                <div className="main-header">
                    <div className="header-left">
                        {/* Back Button */}
                        <button onClick={() => navigate('/tripreport')} style={{background:'none', border:'none', color:'white', fontSize:'20px', cursor:'pointer', marginRight:'10px'}}>
                            <i className="fas fa-arrow-left"></i>
                        </button>
                        <div>
                            <h1>{trip?.tripName || "Trip View"}</h1>
                            <span className="breadcrumb">{new Date(trip?.date).toDateString()} | {trip?.distance} km</span>
                        </div>
                    </div>
                </div>

                <div className="trip-container">
                    {/* Reuse Map Wrapper Design from Trip Manage */}
                    <div className="map-wrapper" style={{height: '70vh'}}>
                        
                        {/* Controls Group */}
                        <div className="map-controls-group">
                            <div className="status-badge online">
                                <div className="blink-dot"></div> COMPLETED
                            </div>
                            <div className="sat-badge-bars">
                                <span className="sat-count"><i className="fas fa-stopwatch"></i> {Math.floor(trip?.totalDuration)} min</span>
                            </div>
                            <div className="sat-badge-bars">
                                <span className="sat-count"><i className="fas fa-parking"></i> {trip?.stops?.length || 0} Stops</span>
                            </div>
                        </div>

                        {/* Speed Stats (Max Speed) */}
                        <div className="speed-capsule-modern">
                            <span className="speed-val" style={{fontSize:'24px'}}>TOP: {trip?.topSpeed}</span>
                            <span className="speed-unit">KM/H</span>
                        </div>

                        <div id="view-map" style={{width:'100%', height:'100%', borderRadius:'16px'}}></div>
                    </div>

                    {/* Stats Grid */}
                    <div className="trip-info-grid">
                        <Card icon="fa-road" label="Distance" value={`${trip?.distance} km`} color="#3699ff" />
                        <Card icon="fa-gas-pump" label="Fuel Used" value={`${trip?.fuelUsed} L`} color="#ffa800" />
                        <Card icon="fa-money-bill" label="Cost" value={`Rs. ${trip?.cost}`} color="#1bc5bd" />
                        <Card icon="fa-clock" label="Moving Time" value={`${Math.floor(trip?.movingDuration)} min`} color="#f64e60" />
                    </div>
                </div>
            </div>
        </Layout>
    );
};

// Helper Card Component
const Card = ({ icon, label, value, color }) => (
    <div className="trip-card">
        <div className="trip-icon" style={{color: color}}><i className={`fas ${icon}`}></i></div>
        <div className="trip-details"><span className="trip-label">{label}</span><span className="trip-value">{value}</span></div>
    </div>
);

export default TripView;
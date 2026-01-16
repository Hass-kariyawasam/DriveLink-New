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
    const tileLayerRef = useRef(null); // Keep track of the layer to remove it later

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

    // 2. Map Initialization (Runs once when trip loads)
    useEffect(() => {
        if (!loading && trip && !mapInstance.current) {
            setTimeout(() => {
                const map = L.map('view-map', { zoomControl: false }).setView([6.9271, 79.8612], 13);
                
                // Add Initial Layer
                tileLayerRef.current = L.tileLayer(SATELLITE_MAP, { maxZoom: 20 }).addTo(map);
                
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

    // 3. Toggle Map Function (Fixes unused var error)
    const toggleMapMode = () => {
        if (mapInstance.current && tileLayerRef.current) {
            // Remove old layer
            mapInstance.current.removeLayer(tileLayerRef.current);
            
            // Add new layer
            const newUrl = isSatelliteMode ? STREET_MAP : SATELLITE_MAP;
            tileLayerRef.current = L.tileLayer(newUrl, { maxZoom: 20 }).addTo(mapInstance.current);
            
            // Update State
            setIsSatelliteMode(!isSatelliteMode);
        }
    };

    if (loading) return <div style={{color:'white', padding:'20px'}}>Loading Trip Details...</div>;

    return (
        <Layout>
           {/* Stats Grid (New Widget Design) */}
                    <div className="tv-grid">
                        
                        {/* Distance */}
                        <div className="tv-card dist">
                            <div className="tv-icon"><i className="fas fa-road"></i></div>
                            <div className="tv-content">
                                <span className="tv-label">Distance</span>
                                <span className="tv-value">{trip?.distance} km</span>
                            </div>
                        </div>

                        {/* Total Duration */}
                        <div className="tv-card time">
                            <div className="tv-icon"><i className="fas fa-clock"></i></div>
                            <div className="tv-content">
                                <span className="tv-label">Duration</span>
                                <span className="tv-value">{Math.floor(trip?.totalDuration)} min</span>
                            </div>
                        </div>

                        {/* Top Speed */}
                        <div className="tv-card speed">
                            <div className="tv-icon"><i className="fas fa-tachometer-alt"></i></div>
                            <div className="tv-content">
                                <span className="tv-label">Top Speed</span>
                                <span className="tv-value">{trip?.topSpeed} km/h</span>
                            </div>
                        </div>

                        {/* Moving Time */}
                        <div className="tv-card avg">
                            <div className="tv-icon"><i className="fas fa-stopwatch"></i></div>
                            <div className="tv-content">
                                <span className="tv-label">Moving Time</span>
                                <span className="tv-value">{Math.floor(trip?.movingDuration)} min</span>
                            </div>
                        </div>

                        {/* Fuel Used */}
                        <div className="tv-card fuel">
                            <div className="tv-icon"><i className="fas fa-gas-pump"></i></div>
                            <div className="tv-content">
                                <span className="tv-label">Fuel Used</span>
                                <span className="tv-value">{trip?.fuelUsed} L</span>
                            </div>
                        </div>

                        {/* Cost */}
                        <div className="tv-card cost">
                            <div className="tv-icon"><i className="fas fa-money-bill-wave"></i></div>
                            <div className="tv-content">
                                <span className="tv-label">Cost</span>
                                <span className="tv-value">Rs. {trip?.cost}</span>
                            </div>
                        </div>

                        {/* Consumption (Calculated if distance > 0) */}
                        <div className="tv-card avg">
                            <div className="tv-icon"><i className="fas fa-burn"></i></div>
                            <div className="tv-content">
                                <span className="tv-label">Avg Consump.</span>
                                <span className="tv-value">
                                    {trip?.distance > 0 ? ((trip.fuelUsed / trip.distance) * 100).toFixed(1) : 0} L/100km
                                </span>
                            </div>
                        </div>

                        {/* Stops */}
                        <div className="tv-card time">
                            <div className="tv-icon"><i className="fas fa-parking"></i></div>
                            <div className="tv-content">
                                <span className="tv-label">Stops</span>
                                <span className="tv-value">{trip?.stops?.length || 0}</span>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default TripView;
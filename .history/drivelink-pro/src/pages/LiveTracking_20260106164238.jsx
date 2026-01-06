import React, { useState, useEffect, useRef } from 'react';
import Layout from '../components/Layout';
import { auth, db, database } from '../firebase';
import { ref, onValue } from 'firebase/database';
import { doc, getDoc } from 'firebase/firestore';
import { onAuthStateChanged } from "firebase/auth";
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import '../css/tripmanage.css'; // Reusing common styles
import '../css/livetracking.css'; // Specific styles

// --- ICONS ---
const liveVehicleIcon = L.icon({
    iconUrl: '/icon/start-marker.png', 
    iconSize: [35, 50],
    iconAnchor: [17, 50],
    popupAnchor: [0, -20]
});

// --- MAP LAYERS ---
const STREET_MAP = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
const SATELLITE_MAP = 'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}'; // Google Hybrid

const LiveTracking = () => {
    // State
    const [deviceId, setDeviceId] = useState(null);
    const [location, setLocation] = useState({ lat: 6.9271, lng: 79.8612 }); // Default Colombo
    const [speed, setSpeed] = useState(0);
    const [lastUpdated, setLastUpdated] = useState(null);
    const [isOnline, setIsOnline] = useState(false);
    const [isSatelliteMode, setIsSatelliteMode] = useState(true); // 👇 හරි නම මේකයි

    // Refs
    const mapInstance = useRef(null);
    const markerRef = useRef(null);
    const tileLayerRef = useRef(null);

    // 1. Get User & Device ID
    useEffect(() => {
        const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
            if (user) {
                const userDoc = await getDoc(doc(db, "users", user.uid));
                if (userDoc.exists()) {
                    setDeviceId(userDoc.data().deviceId);
                }
            }
        });
        return () => unsubscribeAuth();
    }, []);

    // 2. Initialize Map
    useEffect(() => {
        if (!mapInstance.current) {
            const map = L.map('live-map', { zoomControl: false }).setView([location.lat, location.lng], 15);
            
            // Initial Layer (Satellite)
            tileLayerRef.current = L.tileLayer(SATELLITE_MAP, {
                maxZoom: 20,
                attribution: 'Google / OSM'
            }).addTo(map);

            // Vehicle Marker
            markerRef.current = L.marker([location.lat, location.lng], { icon: liveVehicleIcon }).addTo(map);
            
            L.control.zoom({ position: 'bottomright' }).addTo(map);
            mapInstance.current = map;
        }
    }, []);

    // --- Toggle Map Theme Function ---
    const toggleMapMode = () => {
        if (mapInstance.current && tileLayerRef.current) {
            mapInstance.current.removeLayer(tileLayerRef.current);
            const newUrl = isSatelliteMode ? STREET_MAP : SATELLITE_MAP;
            tileLayerRef.current = L.tileLayer(newUrl, { maxZoom: 20 }).addTo(mapInstance.current);
            setIsSatelliteMode(!isSatelliteMode);
        }
    };

    // 3. Listen to Realtime Data
    useEffect(() => {
        if (!deviceId) return;

        const trackingRef = ref(database, `${deviceId}/tracking`);
        const unsubscribe = onValue(trackingRef, (snapshot) => {
            if (snapshot.exists()) {
                const data = snapshot.val();
                
                if (data.latitude && data.longitude) {
                    const newLat = data.latitude;
                    const newLng = data.longitude;
                    const newSpeed = parseFloat(data.speed || 0);
                    const timestamp = data.timestamp || Date.now();

                    // Update State
                    setLocation({ lat: newLat, lng: newLng });
                    setSpeed(newSpeed);
                    setLastUpdated(new Date(timestamp).toLocaleTimeString());
                    
                    // Check Online Status
                    const timeDiff = (Date.now() - new Date(timestamp).getTime()) / 1000;
                    setIsOnline(timeDiff < 120); 

                    // Update Map Marker Position
                    if (markerRef.current) {
                        markerRef.current.setLatLng([newLat, newLng]);
                    }
                    // Auto-center map
                    if (mapInstance.current) {
                        mapInstance.current.flyTo([newLat, newLng], mapInstance.current.getZoom());
                    }
                }
            }
        });

        return () => unsubscribe();
    }, [deviceId]);

    return (
        <Layout>
            <div className="dashboard-content">
                <div className="main-header">
                    <div className="header-left">
                        <h1>Live Tracking</h1>
                        <span className="breadcrumb">Dashboard / Live Map</span>
                    </div>
                </div>

                <div className="tracking-wrapper">
                    
                    {/* 👇 Map Toggle Button (ERROR FIXED HERE) */}
                    <button className="map-toggle-btn live-toggle-pos" onClick={toggleMapMode} title="Switch Map View">
                        {/* isDarkMode වෙනුවට isSatelliteMode පාවිච්චි කළා */}
                        <i className={`fas ${isSatelliteMode ? 'fa-map' : 'fa-satellite'}`}></i>
                    </button>

                    {/* Map Container */}
                    <div id="live-map"></div>

                    {/* Floating Info Panel */}
                    <div className="tracking-stats-panel">
                        <div className="panel-header">
                            <h3>
                                <i className="fas fa-location-crosshairs" style={{color:'#3699ff'}}></i> 
                                Vehicle Status
                            </h3>
                            <div className={`status-indicator ${isOnline ? 'status-online' : 'status-offline'}`}>
                                <div className="blink-dot"></div>
                                {isOnline ? 'ONLINE' : 'OFFLINE'}
                            </div>
                        </div>

                        <div className="panel-row">
                            <span className="panel-label">Last Update</span>
                            <span className="panel-value">{lastUpdated || "Waiting..."}</span>
                        </div>
                        
                        <div className="panel-row">
                            <span className="panel-label">Coordinates</span>
                            <span className="panel-value">{location.lat.toFixed(4)}, {location.lng.toFixed(4)}</span>
                        </div>

                        {/* Big Speedometer */}
                        <div className="speed-display-large">
                            <div className="speed-number">{speed.toFixed(0)}</div>
                            <div className="speed-text">KM/H</div>
                        </div>
                    </div>

                </div>
            </div>
        </Layout>
    );
};

export default LiveTracking;
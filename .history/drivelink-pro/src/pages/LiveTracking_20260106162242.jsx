import React, { useState, useEffect, useRef } from 'react';
import Layout from '../components/Layout';
import { auth, db, database } from '../firebase';
import { ref, onValue } from 'firebase/database';
import { doc, getDoc } from 'firebase/firestore';
import { onAuthStateChanged } from "firebase/auth";
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import '../css/tripmanage.css'; // Reusing some base styles
import '../css/livetracking.css'; // New styles

// Icons
const carIcon = L.icon({
    iconUrl: '/icon/car-marker.png', // Make sure you have a car icon or use start-marker.png
    iconSize: [40, 40],
    iconAnchor: [20, 20],
    popupAnchor: [0, -20]
});

// Map Layers
const DARK_MAP = 'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}'; // Google Hybrid

const LiveTracking = () => {
    const [deviceId, setDeviceId] = useState(null);
    const [location, setLocation] = useState({ lat: 6.9271, lng: 79.8612 }); // Default Colombo
    const [speed, setSpeed] = useState(0);
    const [lastUpdated, setLastUpdated] = useState(null);
    const [isOnline, setIsOnline] = useState(false);
    const [address, setAddress] = useState("Fetching location...");

    const mapInstance = useRef(null);
    const markerRef = useRef(null);

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
            const map = L.map('live-map').setView([location.lat, location.lng], 15);
            
            L.tileLayer(DARK_MAP, {
                maxZoom: 20,
                attribution: 'Google Maps'
            }).addTo(map);

            // Car Marker
            markerRef.current = L.marker([location.lat, location.lng], { icon: carIcon }).addTo(map);
            
            mapInstance.current = map;
        }
    }, []);

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
                    
                    // Check if data is fresh (within last 2 minutes = Online)
                    const timeDiff = (Date.now() - new Date(timestamp).getTime()) / 1000;
                    setIsOnline(timeDiff < 120); 

                    // Update Map Marker
                    if (markerRef.current) {
                        markerRef.current.setLatLng([newLat, newLng]);
                    }
                    if (mapInstance.current) {
                        mapInstance.current.setView([newLat, newLng]); // Auto-center
                    }

                    // Get Address (Optional: Throttled)
                    // getAddress(newLat, newLng); 
                }
            }
        });

        return () => unsubscribe();
    }, [deviceId]);

    // Optional: Simple Reverse Geocoding
    const getAddress = async (lat, lng) => {
        try {
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
            const data = await res.json();
            setAddress(data.display_name.split(',')[0] + ", " + data.display_name.split(',')[1]);
        } catch (e) {
            setAddress(`${lat.toFixed(4)}, ${lng.toFixed(4)}`);
        }
    };

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
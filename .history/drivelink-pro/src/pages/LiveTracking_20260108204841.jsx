import React, { useState, useEffect, useRef } from 'react';
import Layout from '../components/Layout';
import TripStatsWidget from '../components/widgets/TripStatsWidget';
import { auth, db, database } from '../firebase';
import { ref, onValue } from 'firebase/database';
import { doc, getDoc } from 'firebase/firestore';
import { onAuthStateChanged } from "firebase/auth";
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import '../css/tripmanage.css';
import '../css/livetracking.css';
import '../css/tripwidget.css';

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

const STREET_MAP = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
const SATELLITE_MAP = 'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}'; 

const LiveTracking = () => {
    const [deviceId, setDeviceId] = useState(null);
    const [location, setLocation] = useState({ lat: 6.9271, lng: 79.8612 });
    const [speed, setSpeed] = useState(0);
    const [satellites, setSatellites] = useState(0);
    const [isOnline, setIsOnline] = useState(false);
    const [isSatelliteMode, setIsSatelliteMode] = useState(true);

    const mapInstance = useRef(null);
    const markerRef = useRef(null);
    const tileLayerRef = useRef(null);

    // Get User & Device ID
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

    // Initialize Map
    useEffect(() => {
        if (!mapInstance.current) {
            const map = L.map('live-map', { zoomControl: false }).setView([location.lat, location.lng], 15);
            tileLayerRef.current = L.tileLayer(SATELLITE_MAP, { maxZoom: 20 }).addTo(map);
            markerRef.current = L.marker([location.lat, location.lng]).addTo(map);
            L.control.zoom({ position: 'bottomleft' }).addTo(map);
            mapInstance.current = map;
            
            setTimeout(() => { 
                map.invalidateSize(); 
            }, 500);
        }
    }, [location.lat, location.lng]);

    // Toggle Map Mode
    const toggleMapMode = () => {
        if (mapInstance.current && tileLayerRef.current) {
            mapInstance.current.removeLayer(tileLayerRef.current);
            const newUrl = isSatelliteMode ? STREET_MAP : SATELLITE_MAP;
            tileLayerRef.current = L.tileLayer(newUrl, { maxZoom: 20 }).addTo(mapInstance.current);
            setIsSatelliteMode(!isSatelliteMode);
        }
    };

    // Real-time GPS Tracking
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
                    const sats = data.satellites || 0;
                    const timestamp = data.timestamp || Date.now();

                    setLocation({ lat: newLat, lng: newLng });
                    setSpeed(newSpeed);
                    setSatellites(sats);
                    
                    // Check if online (data less than 2 minutes old)
                    const timeDiff = (Date.now() - new Date(timestamp).getTime()) / 1000;
                    setIsOnline(timeDiff < 120); 

                    // Update Map
                    if (markerRef.current) {
                        markerRef.current.setLatLng([newLat, newLng]);
                    }
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
                        <span className="breadcrumb">Real-time Vehicle Location</span>
                    </div>
                </div>

                {/* Map Container */}
                <div className="trip-container"> 
                    <div className="map-wrapper live-map-height">
                        
                        {/* Location Capsule (Left) */}
                        <div className="lt-location-capsule">
                            <i className="fas fa-location-dot"></i>
                            <span>{location.lat.toFixed(4)}, {location.lng.toFixed(4)}</span>
                        </div>

                        {/* Controls Group (Right) */}
                        <div className="lt-controls-group">
                            
                            {/* Online/Offline Badge */}
                            <div className={`lt-status-badge ${isOnline ? 'online' : 'offline'}`}>
                                <div className="lt-blink-dot"></div>
                                {isOnline ? 'ONLINE' : 'OFFLINE'}
                            </div>

                            {/* Satellite Badge */}
                            <div className="lt-sat-badge">
                                <SignalBars count={satellites} />
                                <span className="lt-sat-count">{satellites}</span>
                            </div>

                            {/* Map Toggle */}
                            <button className="lt-control-btn" onClick={toggleMapMode}>
                                <i className={`fas ${isSatelliteMode ? 'fa-map' : 'fa-satellite'}`}></i>
                            </button>
                        </div>

                        {/* Speedometer Capsule */}
                        <div className="lt-speed-capsule">
                            <span className="lt-speed-val">{speed.toFixed(0)}</span>
                            <span className="lt-speed-unit">KM/H</span>
                        </div>

                        <div id="live-map"></div>
                    </div>

                   

                {/* Connection Status Info */}
                <div style={{
                    marginTop: '20px',
                    padding: '20px',
                    background: isOnline ? 'rgba(27, 197, 189, 0.1)' : 'rgba(246, 78, 96, 0.1)',
                    borderRadius: '12px',
                    border: `1px solid ${isOnline ? 'rgba(27, 197, 189, 0.3)' : 'rgba(246, 78, 96, 0.3)'}`
                }}>
                    <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
                        <i className={`fas ${isOnline ? 'fa-check-circle' : 'fa-exclamation-triangle'}`} 
                           style={{fontSize: '24px', color: isOnline ? '#1bc5bd' : '#f64e60'}}></i>
                        <div>
                            <h3 style={{margin: 0, fontSize: '16px', color: 'white'}}>
                                {isOnline ? 'Device Connected' : 'Device Offline'}
                            </h3>
                            <p style={{margin: '5px 0 0 0', fontSize: '13px', color: '#8fa2b6'}}>
                                {isOnline 
                                    ? `Current speed: ${speed.toFixed(1)} km/h | GPS: ${satellites} satellites` 
                                    : 'Waiting for GPS data. Check device connection.'}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

// Signal Bars Component
const SignalBars = ({ count }) => {
    let activeBars = 1;
    if (count > 3) activeBars = 2;
    if (count > 6) activeBars = 3;
    if (count > 9) activeBars = 4;

    return (
        <div className="lt-signal-icon">
            {[1, 2, 3, 4].map(bar => (
                <div 
                    key={bar} 
                    className={`lt-bar ${bar <= activeBars ? 'active' : ''}`} 
                    style={{height: `${bar * 3 + 4}px`}}
                />
            ))}
        </div>
    );
};

export default LiveTracking;
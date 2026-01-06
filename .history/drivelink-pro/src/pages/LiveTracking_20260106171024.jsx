import React, { useState, useEffect, useRef } from 'react';
import Layout from '../components/Layout';
import { auth, db, database } from '../firebase';
import { ref, onValue, get } from 'firebase/database';
import { doc, getDoc } from 'firebase/firestore';
import { onAuthStateChanged } from "firebase/auth";
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import '../css/tripmanage.css'; 
import '../css/livetracking.css'; 

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
    const [lastUpdated, setLastUpdated] = useState(null);
    const [isOnline, setIsOnline] = useState(false);
    const [isSatelliteMode, setIsSatelliteMode] = useState(true);

    const mapInstance = useRef(null);
    const markerRef = useRef(null);
    const tileLayerRef = useRef(null);

    useEffect(() => {
        const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
            if (user) {
                const userDoc = await getDoc(doc(db, "users", user.uid));
                if (userDoc.exists()) setDeviceId(userDoc.data().deviceId);
            }
        });
        return () => unsubscribeAuth();
    }, []);

    useEffect(() => {
        if (!mapInstance.current) {
            const map = L.map('live-map', { zoomControl: false }).setView([location.lat, location.lng], 15);
            tileLayerRef.current = L.tileLayer(SATELLITE_MAP, { maxZoom: 20 }).addTo(map);
            markerRef.current = L.marker([location.lat, location.lng]).addTo(map);
            L.control.zoom({ position: 'bottomright' }).addTo(map);
            mapInstance.current = map;

            // 🔥 FIX: මැප් එක කොටුවක් වගේ පෙනෙන එක හදන්න (Force Resize)
            setTimeout(() => {
                map.invalidateSize();
            }, 500);
        }
    }, []);

    const toggleMapMode = () => {
        if (mapInstance.current && tileLayerRef.current) {
            mapInstance.current.removeLayer(tileLayerRef.current);
            const newUrl = isSatelliteMode ? STREET_MAP : SATELLITE_MAP;
            tileLayerRef.current = L.tileLayer(newUrl, { maxZoom: 20 }).addTo(mapInstance.current);
            setIsSatelliteMode(!isSatelliteMode);
        }
    };

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
                    setLastUpdated(new Date(timestamp).toLocaleTimeString());
                    
                    const timeDiff = (Date.now() - new Date(timestamp).getTime()) / 1000;
                    setIsOnline(timeDiff < 120); 

                    if (markerRef.current) markerRef.current.setLatLng([newLat, newLng]);
                    if (mapInstance.current) mapInstance.current.flyTo([newLat, newLng], mapInstance.current.getZoom());
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
                        <span className="breadcrumb">Real-time Location</span>
                    </div>
                </div>

                <div className="tracking-wrapper">
                    
                    {/* Top Left: Location */}
                    <div className="location-capsule">
                        <i className="fas fa-location-dot"></i>
                        <span>{location.lat.toFixed(4)}, {location.lng.toFixed(4)}</span>
                    </div>

                    {/* Top Right: Controls */}
                    <div className="map-controls-group">
                        <div className={`status-badge ${isOnline ? 'online' : 'offline'}`}>
                            <div className="blink-dot"></div>
                            {isOnline ? 'ONLINE' : 'OFFLINE'}
                        </div>

                        <div className="sat-badge-bars">
                            <SignalBars count={satellites} />
                            <span className="sat-count">{satellites}</span>
                        </div>

                        <button className="control-btn" onClick={toggleMapMode}>
                            <i className={`fas ${isSatelliteMode ? 'fa-map' : 'fa-satellite'}`}></i>
                        </button>
                    </div>

                    {/* Bottom Center: Speed */}
                    <div className="speed-capsule-modern">
                        <span className="speed-val">{speed.toFixed(0)}</span>
                        <span className="speed-unit">KM/H</span>
                    </div>

                    <div id="live-map"></div>
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
        <div className="signal-bars-icon">
            {[1, 2, 3, 4].map(bar => (
                <div key={bar} className={`bar ${bar <= activeBars ? 'active' : ''}`} style={{height: `${bar * 3 + 4}px`}}></div>
            ))}
        </div>
    );
};

export default LiveTracking;
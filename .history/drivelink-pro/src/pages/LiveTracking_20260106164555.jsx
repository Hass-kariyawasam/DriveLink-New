import React, { useState, useEffect, useRef } from 'react';
import Layout from '../components/Layout';
import { auth, db, database } from '../firebase';
import { ref, onValue } from 'firebase/database';
import { doc, getDoc } from 'firebase/firestore';
import { onAuthStateChanged } from "firebase/auth";
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import '../css/tripmanage.css'; 
import '../css/livetracking.css'; 

// --- FIX DEFAULT ICON ISSUE IN REACT ---
import markerIconPng from "leaflet/dist/images/marker-icon.png";
import markerIcon2xPng from "leaflet/dist/images/marker-icon-2x.png";
import markerShadowPng from "leaflet/dist/images/marker-shadow.png";

// Default Icon එක Force කරලා දානවා (Start Icon එක ඕන නෑ)
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2xPng,
  iconUrl: markerIconPng,
  shadowUrl: markerShadowPng,
});

// --- MAP LAYERS ---
const STREET_MAP = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
const SATELLITE_MAP = 'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}'; 

const LiveTracking = () => {
    // State
    const [deviceId, setDeviceId] = useState(null);
    const [location, setLocation] = useState({ lat: 6.9271, lng: 79.8612 });
    const [speed, setSpeed] = useState(0);
    const [satellites, setSatellites] = useState(0); // Satellite State එකතු කළා
    const [lastUpdated, setLastUpdated] = useState(null);
    const [isOnline, setIsOnline] = useState(false);
    const [isSatelliteMode, setIsSatelliteMode] = useState(true);

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
            
            // Initial Layer
            tileLayerRef.current = L.tileLayer(SATELLITE_MAP, {
                maxZoom: 20,
                attribution: 'Google / OSM'
            }).addTo(map);

            // Marker (Default Icon එක දැන් වැඩ කරයි)
            markerRef.current = L.marker([location.lat, location.lng]).addTo(map);
            
            L.control.zoom({ position: 'bottomright' }).addTo(map);
            mapInstance.current = map;
        }
    }, []);

    // Toggle Map Function
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
                    const sats = data.satellites || 0; // Satellite අගය ගන්නවා
                    const timestamp = data.timestamp || Date.now();

                    // Update State
                    setLocation({ lat: newLat, lng: newLng });
                    setSpeed(newSpeed);
                    setSatellites(sats); // State එක Update කරනවා
                    setLastUpdated(new Date(timestamp).toLocaleTimeString());
                    
                    // Check Online Status
                    const timeDiff = (Date.now() - new Date(timestamp).getTime()) / 1000;
                    setIsOnline(timeDiff < 120); 

                    // Update Map Marker
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
                        <span className="breadcrumb">Dashboard / Live Map</span>
                    </div>
                </div>

                <div className="tracking-wrapper">
                    
                    {/* Toggle Button */}
                    <button className="map-toggle-btn live-toggle-pos" onClick={toggleMapMode} title="Switch Map View">
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
                        
                        {/* 👇 Satellites Row එකතු කළා */}
                        <div className="panel-row">
                            <span className="panel-label">Satellites</span>
                            <span className="panel-value" style={{color: satellites > 3 ? '#1bc5bd' : '#f64e60'}}>
                                <i className="fas fa-satellite" style={{marginRight:'5px'}}></i>
                                {satellites}
                            </span>
                        </div>

                        <div className="panel-row">
                            <span className="panel-label">Location</span>
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
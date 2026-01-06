import React, { useState, useEffect, useRef } from 'react';
import Layout from '../components/Layout';
import { auth, db, database } from '../firebase';
import { ref, onValue, get } from 'firebase/database';
import { collection, addDoc, doc, getDoc } from 'firebase/firestore';
import { onAuthStateChanged } from "firebase/auth";
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import '../css/tripmanage.css';

// Icons Config
const startIcon = L.icon({ iconUrl: '/icon/start-marker.png', iconSize: [35, 50], iconAnchor: [17, 50] });
const endIcon = L.icon({ iconUrl: '/icon/end-marker.png', iconSize: [35, 50], iconAnchor: [17, 50] });
const stopIcon = L.icon({ iconUrl: '/icon/stop-marker.png', iconSize: [30, 30], iconAnchor: [15, 15] });

// Map Styles
const LIGHT_MAP = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
const DARK_MAP = 'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}';

const TripManage = () => {
    // UI State
    const [trackingActive, setTrackingActive] = useState(false);
    const [deviceId, setDeviceId] = useState(null);
    const [tripName, setTripName] = useState('');
    const [tripNotes, setTripNotes] = useState('');
    const [showSaveModal, setShowSaveModal] = useState(false);
    const [isDarkMode, setIsDarkMode] = useState(true);
    
    // Live Stats
    const [stats, setStats] = useState({
        distance: 0, totalDuration: 0, movingDuration: 0, speed: 0, 
        topSpeed: 0, fuelUsed: 0, cost: 0, consumption: 0, 
        satellites: 0, currentFuelLevel: 0, range: 0
    });

    // Refs
    const mapRef = useRef(null);
    const mapInstance = useRef(null);
    const tileLayerRef = useRef(null);
    const markerRef = useRef(null);
    const polylineRef = useRef(null);
    const pathRef = useRef([]); 
    const stopsRef = useRef([]); 
    const stopMarkersRef = useRef([]); 
    
    const trackingData = useRef({
        startTime: null, initialFuel: 0, fuelUsed: 0, totalDistance: 0, 
        topSpeed: 0, lastStopCheckTime: null, isMoving: false, 
        accumulatedMovingTime: 0, lastMoveTime: null
    });

    // 1. Get User
    useEffect(() => {
        const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
            if (user) {
                const userDoc = await getDoc(doc(db, "users", user.uid));
                if (userDoc.exists()) setDeviceId(userDoc.data().deviceId);
            }
        });
        return () => unsubscribeAuth();
    }, []);

    // 2. Init Map
    useEffect(() => {
        if (!mapInstance.current) {
            const map = L.map('map').setView([6.9271, 79.8612], 13);
            tileLayerRef.current = L.tileLayer(DARK_MAP, { maxZoom: 20 }).addTo(map);
            markerRef.current = L.marker([6.9271, 79.8612]).addTo(map);
            polylineRef.current = L.polyline([], { color: '#3699ff', weight: 5 }).addTo(map);
            mapInstance.current = map;
        }
    }, []);

    const toggleMapTheme = () => {
        if (mapInstance.current && tileLayerRef.current) {
            mapInstance.current.removeLayer(tileLayerRef.current);
            const newUrl = isDarkMode ? LIGHT_MAP : DARK_MAP;
            tileLayerRef.current = L.tileLayer(newUrl, { maxZoom: 20 }).addTo(mapInstance.current);
            setIsDarkMode(!isDarkMode);
        }
    };

    const getPlaceName = async (lat, lng) => {
        try {
            const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
            const data = await response.json();
            return `Trip from ${data.address.city || data.address.town || "Unknown"}`;
        } catch { return "Trip " + new Date().toLocaleDateString(); }
    };

    // 3. Tracking Logic (FIXED TOP SPEED)
    useEffect(() => {
        if (!deviceId) return;
        const trackingRef = ref(database, `${deviceId}/tracking`);
        const unsubscribeGPS = onValue(trackingRef, (snapshot) => {
            if (snapshot.exists()) {
                const data = snapshot.val();
                if (data.latitude && data.longitude) {
                    const newPos = [data.latitude, data.longitude];
                    const currentSpeed = parseFloat(data.speed || 0);

                    // Update Map
                    if (mapInstance.current) {
                        markerRef.current.setLatLng(newPos);
                        mapInstance.current.setView(newPos);
                    }

                    // Tracking Logic
                    if (trackingActive) {
                        // 1. Path Update
                        if (pathRef.current.length === 0) {
                            L.marker(newPos, {icon: startIcon}).addTo(mapInstance.current);
                            trackingData.current.lastMoveTime = new Date();
                        }
                        pathRef.current.push(newPos);
                        if (polylineRef.current) polylineRef.current.setLatLngs(pathRef.current);

                        // 2. Distance
                        if (pathRef.current.length > 1) {
                            const lastPos = pathRef.current[pathRef.current.length - 2];
                            const dist = calculateDistance(lastPos, newPos);
                            if (dist > 0.002) trackingData.current.totalDistance += dist;
                        }

                        // 3. Moving Time
                        if (currentSpeed > 1) {
                            if (!trackingData.current.isMoving) {
                                trackingData.current.isMoving = true;
                                trackingData.current.lastMoveTime = new Date();
                            }
                        } else {
                            if (trackingData.current.isMoving) {
                                trackingData.current.isMoving = false;
                                const now = new Date();
                                trackingData.current.accumulatedMovingTime += (now - trackingData.current.lastMoveTime);
                            }
                        }

                        // 4. TOP SPEED LOGIC (FIXED)
                        if (currentSpeed > trackingData.current.topSpeed) {
                            trackingData.current.topSpeed = currentSpeed;
                        }
                    }

                    // Update UI State (Including Top Speed from Ref)
                    setStats(prev => ({ 
                        ...prev, 
                        speed: currentSpeed, 
                        satellites: data.satellites || 0,
                        topSpeed: trackingActive ? trackingData.current.topSpeed : prev.topSpeed 
                    }));
                }
            }
        });

        const fuelRef = ref(database, `${deviceId}/fuel_sensor/value`);
        const unsubscribeFuel = onValue(fuelRef, (snapshot) => {
            if (snapshot.exists()) {
                const currentFuel = parseFloat(snapshot.val());
                const estRange = currentFuel * 12;
                if (trackingActive) {
                    const used = Math.max(0, trackingData.current.initialFuel - currentFuel);
                    trackingData.current.fuelUsed = used;
                    const dist = trackingData.current.totalDistance;
                    const rate = dist > 0.1 ? (used / dist) * 100 : 0;
                    setStats(prev => ({ ...prev, currentFuelLevel: currentFuel, range: estRange, fuelUsed: used, cost: used * 380, consumption: rate }));
                } else {
                    setStats(prev => ({ ...prev, currentFuelLevel: currentFuel, range: estRange }));
                }
            }
        });
        return () => { unsubscribeGPS(); unsubscribeFuel(); };
    }, [deviceId, trackingActive]);

    useEffect(() => {
        let interval;
        if (trackingActive) {
            interval = setInterval(() => {
                const now = new Date();
                const totalDiff = (now - trackingData.current.startTime) / 1000 / 60;
                let currentMoving = trackingData.current.accumulatedMovingTime;
                if (trackingData.current.isMoving) currentMoving += (now - trackingData.current.lastMoveTime);
                setStats(prev => ({ ...prev, totalDuration: totalDiff, movingDuration: currentMoving / 1000 / 60, distance: trackingData.current.totalDistance }));
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [trackingActive]);

    const calculateDistance = (pos1, pos2) => {
        const R = 6371; 
        const dLat = (pos2[0] - pos1[0]) * Math.PI / 180;
        const dLon = (pos2[1] - pos1[1]) * Math.PI / 180;
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(pos1[0] * Math.PI / 180) * Math.cos(pos2[0] * Math.PI / 180) * Math.sin(dLon/2) * Math.sin(dLon/2);
        return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    };

    const handleStart = async () => {
        if (!deviceId) return alert("Device ID not found!");
        try {
            const fuelSnap = await get(ref(database, `${deviceId}/fuel_sensor/value`));
            const initialFuel = fuelSnap.exists() ? parseFloat(fuelSnap.val()) : 0;
            trackingData.current = { startTime: new Date(), initialFuel, fuelUsed: 0, totalDistance: 0, topSpeed: 0, lastStopCheckTime: null, isMoving: false, accumulatedMovingTime: 0, lastMoveTime: null };
            pathRef.current = []; stopsRef.current = [];
            if(polylineRef.current) polylineRef.current.setLatLngs([]);
            stopMarkersRef.current.forEach(m => m.remove());
            setTrackingActive(true);
            
            // Reset Stats on Start
            setStats(prev => ({...prev, topSpeed: 0, distance: 0, totalDuration: 0}));

            setTimeout(async () => {
                if(pathRef.current.length > 0 && !tripName) {
                    const [lat, lng] = pathRef.current[0];
                    setTripName(await getPlaceName(lat, lng));
                }
            }, 2000);
        } catch (e) { console.error(e); }
    };

    const handleEndClick = () => {
        setTrackingActive(false);
        if (pathRef.current.length > 0) {
            const lastPos = pathRef.current[pathRef.current.length - 1];
            L.marker(lastPos, {icon: endIcon}).addTo(mapInstance.current);
        }
        setShowSaveModal(true);
    };

    const handleConfirmSave = async () => {
        const user = auth.currentUser;
        if (!user) return;
        const formattedPath = pathRef.current.map(p => ({ lat: p[0], lng: p[1] }));
        const tripData = {
            userId: user.uid, tripName: tripName || "Unnamed Trip", notes: tripNotes,
            date: new Date().toISOString(), distance: stats.distance.toFixed(2),
            totalDuration: stats.totalDuration.toFixed(2), movingDuration: stats.movingDuration.toFixed(2),
            fuelUsed: stats.fuelUsed.toFixed(2), cost: stats.cost.toFixed(2),
            topSpeed: trackingData.current.topSpeed.toFixed(2), path: formattedPath, stops: stopsRef.current
        };
        try {
            await addDoc(collection(db, `tripReports/${user.uid}/trips`), tripData);
            alert("Saved!");
            window.location.reload();
        } catch (e) { alert("Error: " + e.message); }
    };

    const handleDiscard = () => { if(window.confirm("Discard?")) window.location.reload(); };

    return (
        <Layout>
            <div className="dashboard-content">
                <div className="main-header">
                    <div className="header-left">
                        <h1>Trip Manager</h1>
                        <span className="breadcrumb">Live Tracking</span>
                    </div>
                </div>

                <div className="map-wrapper">
                    {/* Top Right Controls */}
                    <div className="map-controls-top-right">
                        {trackingActive && <div className="live-badge"><div className="pulsing-dot"></div>LIVE</div>}
                        <button className="map-toggle-btn" onClick={toggleMapTheme} title="Switch Map View">
                            <i className={`fas ${isDarkMode ? 'fa-satellite' : 'fa-map'}`}></i>
                        </button>
                    </div>

                    {/* Speedometer (Capsule) */}
                    <div className="speed-capsule">
                        <span className="speed-val">{stats.speed.toFixed(0)}</span>
                        <span className="speed-unit">KM/H</span>
                    </div>

                    <div id="map"></div>
                </div>

                {/* INFO GRID */}
                <div className="trip-info-grid">
                    <Card icon="fa-road" label="Distance" value={`${stats.distance.toFixed(2)} km`} color="#3699ff" />
                    <Card icon="fa-clock" label="Total Time" value={`${Math.floor(stats.totalDuration)} min`} color="#8950fc" />
                    <Card icon="fa-stopwatch" label="Drive Time" value={`${Math.floor(stats.movingDuration)} min`} color="#28a745" />
                    <Card icon="fa-rocket" label="Max Speed" value={`${stats.topSpeed.toFixed(0)} km/h`} color="#f64e60" />
                    <Card icon="fa-gas-pump" label="Fuel Used" value={`${stats.fuelUsed.toFixed(2)} L`} color="#ffa800" />
                    <Card icon="fa-money-bill" label="Cost" value={`Rs. ${stats.cost.toFixed(0)}`} color="#1bc5bd" />
                    <Card icon="fa-flask" label="Fuel Level" value={`${stats.currentFuelLevel.toFixed(1)} L`} color="#00d2fc" />
                    
                    {/* NEW SATELLITE WIDGET */}
                    <SatelliteWidget count={stats.satellites} />
                </div>

                <div className="trip-controls">
                    <div className="input-row">
                        <div className="input-group"><input type="text" placeholder="Trip Name" value={tripName} onChange={(e) => setTripName(e.target.value)} /></div>
                        <div className="input-group"><input type="text" placeholder="Notes" value={tripNotes} onChange={(e) => setTripNotes(e.target.value)} /></div>
                    </div>
                    <div className="control-buttons">
                        {!trackingActive ? 
                            <button className="btn-modern btn-start" onClick={handleStart}><i className="fas fa-play"></i> START</button> : 
                            <button className="btn-modern btn-end" onClick={handleEndClick}><i className="fas fa-stop"></i> END</button>
                        }
                    </div>
                </div>

                {/* MODAL */}
                {showSaveModal && (
                    <div className="save-modal-overlay">
                        <div className="save-modal">
                            <i className="fas fa-check-circle"></i>
                            <h2>Trip Completed!</h2>
                            <p>Distance: <strong>{stats.distance.toFixed(2)} km</strong></p>
                            <div className="modal-actions">
                                <button className="btn-cancel" onClick={handleDiscard}>Discard</button>
                                <button className="btn-confirm" onClick={handleConfirmSave}>Save Report</button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </Layout>
    );
};

// Custom Satellite Widget
const SatelliteWidget = ({ count }) => {
    let signalColor = '#f64e60'; // Weak (Red)
    let label = 'Weak';
    let bars = 1;

    if (count >= 4) { signalColor = '#ffa800'; label = 'Good'; bars = 2; }
    if (count >= 7) { signalColor = '#1bc5bd'; label = 'Excellent'; bars = 4; }

    return (
        <div className="trip-card satellite-card">
            <div className="satellite-info">
                <span className="trip-label">GPS Signal</span>
                <span className="trip-value" style={{color: signalColor}}>{count} Sats</span>
            </div>
            <div className="signal-bars">
                {[1, 2, 3, 4].map(i => (
                    <div key={i} className="signal-bar" 
                         style={{
                             height: `${i * 4 + 6}px`, 
                             backgroundColor: i <= bars ? signalColor : 'rgba(255,255,255,0.1)'
                         }}>
                    </div>
                ))}
            </div>
        </div>
    );
};

const Card = ({ icon, label, value, color }) => (
    <div className="trip-card">
        <div className="trip-icon" style={{color: color}}><i className={`fas ${icon}`}></i></div>
        <div className="trip-details"><span className="trip-label">{label}</span><span className="trip-value">{value}</span></div>
    </div>
);

export default TripManage;
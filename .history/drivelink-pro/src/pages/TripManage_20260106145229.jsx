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
const stopIcon = L.icon({ iconUrl: '/icon/stop-marker.png', iconSize: [30, 45], iconAnchor: [15, 45] }); // Parking Icon

const TripManage = () => {
    const [trackingActive, setTrackingActive] = useState(false);
    const [deviceId, setDeviceId] = useState(null);
    const [tripName, setTripName] = useState('');
    const [tripNotes, setTripNotes] = useState('');
    const [showSaveModal, setShowSaveModal] = useState(false);
    
    const [stats, setStats] = useState({
        distance: 0, duration: 0, speed: 0, topSpeed: 0,
        fuelUsed: 0, cost: 0, consumption: 0, satellites: 0
    });

    // Refs
    const mapRef = useRef(null);
    const mapInstance = useRef(null);
    const markerRef = useRef(null);
    const polylineRef = useRef(null);
    
    // Data Storage Refs
    const pathRef = useRef([]); 
    const stopsRef = useRef([]); // Parking Points
    const stopMarkersRef = useRef([]); // Map Markers for stops
    
    const trackingData = useRef({
        startTime: null,
        initialFuel: 0,
        fuelUsed: 0,
        totalDistance: 0,
        topSpeed: 0,
        lastStopCheckTime: null
    });

    // 1. User & Device ID ලබා ගැනීම
    useEffect(() => {
        const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
            if (user) {
                const userDoc = await getDoc(doc(db, "users", user.uid));
                if (userDoc.exists()) setDeviceId(userDoc.data().deviceId);
            }
        });
        return () => unsubscribeAuth();
    }, []);

    // 2. Map Initialize
    useEffect(() => {
        if (!mapInstance.current) {
            const map = L.map('map').setView([6.9271, 79.8612], 13);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
            
            markerRef.current = L.marker([6.9271, 79.8612]).addTo(map);
            polylineRef.current = L.polyline([], { color: '#3699ff', weight: 5 }).addTo(map);
            
            mapInstance.current = map;
        }
    }, []);

    // 3. Real-time Logic (GPS & Fuel)
    useEffect(() => {
        if (!deviceId) return;

        // --- GPS Tracking ---
        const trackingRef = ref(database, `${deviceId}/tracking`);
        const unsubscribeGPS = onValue(trackingRef, (snapshot) => {
            if (snapshot.exists()) {
                const data = snapshot.val();
                if (data.latitude && data.longitude) {
                    const newPos = [data.latitude, data.longitude];
                    const speed = data.speed || 0;

                    // Map Update
                    if (mapInstance.current) {
                        markerRef.current.setLatLng(newPos);
                        mapInstance.current.setView(newPos);
                    }

                    setStats(prev => ({ ...prev, speed: speed, satellites: data.satellites || 0 }));

                    if (trackingActive) {
                        // පළමු Start Marker එක ගැසීම
                        if (pathRef.current.length === 0) {
                            L.marker(newPos, {icon: startIcon}).addTo(mapInstance.current);
                        }

                        // Path එකට එකතු කිරීම
                        pathRef.current.push(newPos);
                        if (polylineRef.current) polylineRef.current.setLatLngs(pathRef.current);

                        // Distance Calculation
                        if (pathRef.current.length > 1) {
                            const lastPos = pathRef.current[pathRef.current.length - 2];
                            const dist = calculateDistance(lastPos, newPos);
                            
                            // බොරු GPS පැනීම් නතර කිරීම (0.5m ට වැඩි, 500m ට අඩු නම් පමණක්)
                            if (dist > 0.0005 && dist < 0.5) {
                                trackingData.current.totalDistance += dist;
                            }
                        }

                        // Top Speed Update
                        if (speed > trackingData.current.topSpeed) {
                            trackingData.current.topSpeed = speed;
                        }

                        // --- PARKING / STOP DETECTION ---
                        // වේගය 1 km/h ට අඩු නම් සහ විනාඩියකට වඩා එක තැන නම්
                        if (speed < 1) {
                            if (!trackingData.current.lastStopCheckTime) {
                                trackingData.current.lastStopCheckTime = new Date();
                            } else {
                                const timeStopped = (new Date() - trackingData.current.lastStopCheckTime) / 1000; // seconds
                                if (timeStopped > 60) { // තත්පර 60කට වඩා වැඩි නම්
                                    // කලින් Stop එකක් මාර්ක් කරලා නැත්නම් විතරක් දාන්න (එකම තැන ගොඩක් නොවදින්න)
                                    const lastStop = stopsRef.current[stopsRef.current.length - 1];
                                    if (!lastStop || calculateDistance([lastStop.lat, lastStop.lng], newPos) > 0.02) {
                                        const stopMarker = L.marker(newPos, {icon: stopIcon}).addTo(mapInstance.current);
                                        stopMarkersRef.current.push(stopMarker);
                                        
                                        // Save Stop Point
                                        stopsRef.current.push({
                                            lat: newPos[0],
                                            lng: newPos[1],
                                            time: new Date().toISOString()
                                        });
                                    }
                                }
                            }
                        } else {
                            trackingData.current.lastStopCheckTime = null; // වාහනය දුවනවා නම් Reset කරන්න
                        }
                    }
                }
            }
        });

        // --- Fuel Monitoring ---
        const fuelRef = ref(database, `${deviceId}/fuel_sensor/value`);
        const unsubscribeFuel = onValue(fuelRef, (snapshot) => {
            if (trackingActive && snapshot.exists()) {
                const currentFuel = parseFloat(snapshot.val());
                const used = trackingData.current.initialFuel - currentFuel;
                const finalUsed = used > 0 ? used : 0;
                
                const dist = trackingData.current.totalDistance;
                const rate = dist > 0.1 ? (finalUsed / dist) * 100 : 0;

                trackingData.current.fuelUsed = finalUsed; // Update ref

                setStats(prev => ({
                    ...prev,
                    fuelUsed: finalUsed,
                    cost: finalUsed * 380,
                    consumption: rate
                }));
            }
        });

        return () => { unsubscribeGPS(); unsubscribeFuel(); };
    }, [deviceId, trackingActive]);

    // Timer Interval
    useEffect(() => {
        let interval;
        if (trackingActive) {
            interval = setInterval(() => {
                const now = new Date();
                const diff = (now - trackingData.current.startTime) / 1000 / 60;
                setStats(prev => ({ 
                    ...prev, 
                    duration: diff, 
                    distance: trackingData.current.totalDistance // Real-time distance update
                }));
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [trackingActive]);

    // Distance Function
    const calculateDistance = (pos1, pos2) => {
        const R = 6371; 
        const dLat = (pos2[0] - pos1[0]) * Math.PI / 180;
        const dLon = (pos2[1] - pos1[1]) * Math.PI / 180;
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(pos1[0] * Math.PI / 180) * Math.cos(pos2[0] * Math.PI / 180) * Math.sin(dLon/2) * Math.sin(dLon/2);
        return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    };

    // Button Handlers
    const handleStart = async () => {
        if (!deviceId) return alert("Device ID not found!");
        try {
            const fuelSnap = await get(ref(database, `${deviceId}/fuel_sensor/value`));
            const initialFuel = fuelSnap.exists() ? parseFloat(fuelSnap.val()) : 0;
            
            // Reset Data
            trackingData.current = {
                startTime: new Date(), initialFuel, fuelUsed: 0, 
                totalDistance: 0, topSpeed: 0, lastStopCheckTime: null
            };
            pathRef.current = [];
            stopsRef.current = [];
            
            // Clear old map layers
            if(polylineRef.current) polylineRef.current.setLatLngs([]);
            stopMarkersRef.current.forEach(m => m.remove());
            stopMarkersRef.current = [];

            setTrackingActive(true);
        } catch (e) { console.error(e); }
    };

    const handleEndClick = () => {
        setTrackingActive(false);
        // End Marker එක අන්තිම Point එකට ගහනවා
        if (pathRef.current.length > 0) {
            const lastPos = pathRef.current[pathRef.current.length - 1];
            L.marker(lastPos, {icon: endIcon}).addTo(mapInstance.current);
        }
        setShowSaveModal(true);
    };

    const handleConfirmSave = async () => {
        const user = auth.currentUser;
        if (!user) return;

        // 🔥 FIX 1: Array of Arrays -> Array of Objects (Firestore Error Fix)
        const formattedPath = pathRef.current.map(point => ({
            lat: point[0],
            lng: point[1]
        }));

        const tripData = {
            userId: user.uid,
            tripName: tripName || "Unnamed Trip",
            notes: tripNotes,
            date: new Date().toISOString(),
            distance: stats.distance.toFixed(2),
            duration: stats.duration.toFixed(2),
            fuelUsed: stats.fuelUsed.toFixed(2),
            cost: stats.cost.toFixed(2),
            topSpeed: trackingData.current.topSpeed.toFixed(2),
            path: formattedPath, // දැන් මේක වලංගු Object Array එකක්
            stops: stopsRef.current // Parking points
        };

        try {
            await addDoc(collection(db, `tripReports/${user.uid}/trips`), tripData);
            alert("Trip Saved Successfully!");
            resetTrip();
        } catch (e) {
            console.error("Save Error:", e);
            alert("Error saving report: " + e.message);
        }
    };

    const handleDiscard = () => {
        if(window.confirm("Discard trip? Data will be lost.")) resetTrip();
    };

    const resetTrip = () => {
        setStats({ distance: 0, duration: 0, speed: 0, topSpeed: 0, fuelUsed: 0, cost: 0, consumption: 0, satellites: 0 });
        setTripName(''); setTripNotes('');
        pathRef.current = [];
        if(polylineRef.current) polylineRef.current.setLatLngs([]);
        stopMarkersRef.current.forEach(m => m.remove());
        setShowSaveModal(false);
    };

    return (
        <Layout>
            <div className="dashboard-content">
                <div className="main-header">
                    <div className="header-left">
                        <h1>Trip Manager</h1>
                        <span className="breadcrumb">Live Tracking & Management</span>
                    </div>
                </div>

                <div style={{position:'relative'}}>
                    {trackingActive && <div className="live-badge"><div className="pulsing-dot"></div>LIVE</div>}
                    <div id="map"></div>
                </div>

                <div className="trip-info-grid">
                    <Card icon="fa-road" label="Distance" value={`${stats.distance.toFixed(2)} km`} color="#3699ff" />
                    <Card icon="fa-clock" label="Duration" value={`${stats.duration.toFixed(0)} min`} color="#8950fc" />
                    <Card icon="fa-gauge-high" label="Speed" value={`${stats.speed.toFixed(1)} km/h`} color="#1bc5bd" />
                    <Card icon="fa-rocket" label="Top Speed" value={`${stats.topSpeed?.toFixed(1) || 0} km/h`} color="#f64e60" />
                    <Card icon="fa-gas-pump" label="Fuel" value={`${stats.fuelUsed.toFixed(2)} L`} color="#ffa800" />
                    <Card icon="fa-satellite" label="GPS" value={stats.satellites} color="#8fa2b6" />
                </div>

                <div className="trip-controls">
                    <div className="input-row">
                        <div className="input-group"><input type="text" placeholder="Trip Name" value={tripName} onChange={(e) => setTripName(e.target.value)} /></div>
                        <div className="input-group"><input type="text" placeholder="Notes" value={tripNotes} onChange={(e) => setTripNotes(e.target.value)} /></div>
                    </div>
                    <div className="control-buttons">
                        {!trackingActive ? 
                            <button className="btn-modern btn-start" onClick={handleStart}><i className="fas fa-play"></i> Start</button> : 
                            <button className="btn-modern btn-end" onClick={handleEndClick}><i className="fas fa-stop"></i> End</button>
                        }
                    </div>
                </div>

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

const Card = ({ icon, label, value, color }) => (
    <div className="trip-card">
        <div className="trip-icon" style={{color: color}}><i className={`fas ${icon}`}></i></div>
        <div className="trip-details"><span className="trip-label">{label}</span><span className="trip-value">{value}</span></div>
    </div>
);

export default TripManage;
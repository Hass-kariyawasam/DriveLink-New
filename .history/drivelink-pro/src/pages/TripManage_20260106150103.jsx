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

const TripManage = () => {
    // UI State
    const [trackingActive, setTrackingActive] = useState(false);
    const [deviceId, setDeviceId] = useState(null);
    const [tripName, setTripName] = useState('');
    const [tripNotes, setTripNotes] = useState('');
    const [showSaveModal, setShowSaveModal] = useState(false);
    
    // Live Stats State
    const [stats, setStats] = useState({
        distance: 0, 
        totalDuration: 0, // මුළු කාලය
        movingDuration: 0, // ධාවනය වූ කාලය
        speed: 0, 
        topSpeed: 0,
        fuelUsed: 0, 
        cost: 0, 
        consumption: 0, 
        satellites: 0,
        currentFuelLevel: 0, // දැනට තියෙන ඉන්ධන
        range: 0 // යන්න පුළුවන් දුර
    });

    // Refs (Map & Logic)
    const mapRef = useRef(null);
    const mapInstance = useRef(null);
    const markerRef = useRef(null);
    const polylineRef = useRef(null);
    
    const pathRef = useRef([]); 
    const stopsRef = useRef([]); 
    const stopMarkersRef = useRef([]); 
    
    // Tracking Logic Refs (Values change fast without re-render)
    const trackingData = useRef({
        startTime: null,
        initialFuel: 0,
        fuelUsed: 0,
        totalDistance: 0,
        topSpeed: 0,
        lastStopCheckTime: null,
        isMoving: false,
        accumulatedMovingTime: 0, // ms
        lastMoveTime: null
    });

    // 1. Get User & Device ID
    useEffect(() => {
        const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
            if (user) {
                const userDoc = await getDoc(doc(db, "users", user.uid));
                if (userDoc.exists()) setDeviceId(userDoc.data().deviceId);
            }
        });
        return () => unsubscribeAuth();
    }, []);

    // 2. Map Initialization
    useEffect(() => {
        if (!mapInstance.current) {
            const map = L.map('map').setView([6.9271, 79.8612], 13);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
            
            markerRef.current = L.marker([6.9271, 79.8612]).addTo(map);
            polylineRef.current = L.polyline([], { color: '#3699ff', weight: 5 }).addTo(map);
            
            mapInstance.current = map;
        }
    }, []);

    // 3. Real-time Tracking Logic
    useEffect(() => {
        if (!deviceId) return;

        // --- GPS Data Listener ---
        const trackingRef = ref(database, `${deviceId}/tracking`);
        const unsubscribeGPS = onValue(trackingRef, (snapshot) => {
            if (snapshot.exists()) {
                const data = snapshot.val();
                
                if (data.latitude && data.longitude) {
                    const newPos = [data.latitude, data.longitude];
                    const speed = parseFloat(data.speed || 0);

                    // Map Update
                    if (mapInstance.current) {
                        markerRef.current.setLatLng(newPos);
                        mapInstance.current.setView(newPos);
                    }

                    // Live Speed & Satellites Update
                    setStats(prev => ({ ...prev, speed: speed, satellites: data.satellites || 0 }));

                    // Tracking Logic (Only if Started)
                    if (trackingActive) {
                        // First Point
                        if (pathRef.current.length === 0) {
                            L.marker(newPos, {icon: startIcon}).addTo(mapInstance.current);
                            trackingData.current.lastMoveTime = new Date();
                        }

                        // Add to Path
                        pathRef.current.push(newPos);
                        if (polylineRef.current) polylineRef.current.setLatLngs(pathRef.current);

                        // --- Distance Calculation ---
                        if (pathRef.current.length > 1) {
                            const lastPos = pathRef.current[pathRef.current.length - 2];
                            const dist = calculateDistance(lastPos, newPos);
                            
                            // Filter GPS Jitter (only add if moved > 2 meters)
                            if (dist > 0.002) {
                                trackingData.current.totalDistance += dist;
                            }
                        }

                        // --- Moving Time Logic ---
                        if (speed > 1) { // 1 km/h ට වැඩි නම් moving
                            if (!trackingData.current.isMoving) {
                                trackingData.current.isMoving = true;
                                trackingData.current.lastMoveTime = new Date();
                            }
                        } else {
                            if (trackingData.current.isMoving) {
                                trackingData.current.isMoving = false;
                                // Add duration chunk
                                const now = new Date();
                                trackingData.current.accumulatedMovingTime += (now - trackingData.current.lastMoveTime);
                            }
                        }

                        // --- Top Speed ---
                        if (speed > trackingData.current.topSpeed) {
                            trackingData.current.topSpeed = speed;
                        }

                        // --- Parking Point Detection (Stop > 60s) ---
                        if (speed < 1) {
                            if (!trackingData.current.lastStopCheckTime) {
                                trackingData.current.lastStopCheckTime = new Date();
                            } else {
                                const timeStopped = (new Date() - trackingData.current.lastStopCheckTime) / 1000;
                                if (timeStopped > 60) { // 1 Minute Stopped
                                    const lastStop = stopsRef.current[stopsRef.current.length - 1];
                                    // Add marker only if far from last stop
                                    if (!lastStop || calculateDistance([lastStop.lat, lastStop.lng], newPos) > 0.05) {
                                        const stopMarker = L.marker(newPos, {icon: stopIcon}).addTo(mapInstance.current)
                                            .bindPopup(`Stopped: ${new Date().toLocaleTimeString()}`);
                                        stopMarkersRef.current.push(stopMarker);
                                        
                                        stopsRef.current.push({
                                            lat: newPos[0],
                                            lng: newPos[1],
                                            time: new Date().toISOString()
                                        });
                                    }
                                }
                            }
                        } else {
                            trackingData.current.lastStopCheckTime = null;
                        }
                    }
                }
            }
        });

        // --- Fuel Listener ---
        const fuelRef = ref(database, `${deviceId}/fuel_sensor/value`);
        const unsubscribeFuel = onValue(fuelRef, (snapshot) => {
            if (snapshot.exists()) {
                const currentFuel = parseFloat(snapshot.val());
                const fuelPrice = 380; // Rs per Liter
                const avgMileage = 12; // km per Liter (Assumed)

                // Calculate Range (හැම වෙලාවෙම පෙන්නන්න)
                const estRange = currentFuel * avgMileage;

                // Tracking Active නම් Used ගණන් හදන්න
                if (trackingActive) {
                    const used = trackingData.current.initialFuel - currentFuel;
                    const finalUsed = used > 0 ? used : 0;
                    trackingData.current.fuelUsed = finalUsed;

                    const dist = trackingData.current.totalDistance;
                    const rate = dist > 0.1 ? (finalUsed / dist) * 100 : 0;

                    setStats(prev => ({
                        ...prev,
                        currentFuelLevel: currentFuel,
                        range: estRange,
                        fuelUsed: finalUsed,
                        cost: finalUsed * fuelPrice,
                        consumption: rate
                    }));
                } else {
                    // Tracking Off නම් Range එක විතරක් පෙන්නන්න
                    setStats(prev => ({
                        ...prev,
                        currentFuelLevel: currentFuel,
                        range: estRange
                    }));
                }
            }
        });

        return () => { unsubscribeGPS(); unsubscribeFuel(); };
    }, [deviceId, trackingActive]);

    // 4. Timer Loop (UI Update)
    useEffect(() => {
        let interval;
        if (trackingActive) {
            interval = setInterval(() => {
                const now = new Date();
                
                // Total Duration
                const totalDiff = (now - trackingData.current.startTime) / 1000 / 60; // Minutes
                
                // Calculate Moving Time Live
                let currentMoving = trackingData.current.accumulatedMovingTime;
                if (trackingData.current.isMoving) {
                    currentMoving += (now - trackingData.current.lastMoveTime);
                }
                const movingDiff = currentMoving / 1000 / 60; // Minutes

                setStats(prev => ({ 
                    ...prev, 
                    totalDuration: totalDiff,
                    movingDuration: movingDiff,
                    distance: trackingData.current.totalDistance
                }));
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [trackingActive]);

    // Haversine Distance
    const calculateDistance = (pos1, pos2) => {
        const R = 6371; 
        const dLat = (pos2[0] - pos1[0]) * Math.PI / 180;
        const dLon = (pos2[1] - pos1[1]) * Math.PI / 180;
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(pos1[0] * Math.PI / 180) * Math.cos(pos2[0] * Math.PI / 180) * Math.sin(dLon/2) * Math.sin(dLon/2);
        return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    };

    // --- Actions ---

    const handleStart = async () => {
        if (!deviceId) return alert("Device ID not found!");
        try {
            const fuelSnap = await get(ref(database, `${deviceId}/fuel_sensor/value`));
            const initialFuel = fuelSnap.exists() ? parseFloat(fuelSnap.val()) : 0;
            
            // Reset Data
            trackingData.current = {
                startTime: new Date(),
                initialFuel: initialFuel,
                fuelUsed: 0,
                totalDistance: 0,
                topSpeed: 0,
                lastStopCheckTime: null,
                isMoving: false,
                accumulatedMovingTime: 0,
                lastMoveTime: null
            };
            
            pathRef.current = [];
            stopsRef.current = [];
            
            if(polylineRef.current) polylineRef.current.setLatLngs([]);
            stopMarkersRef.current.forEach(m => m.remove());
            stopMarkersRef.current = [];

            setTrackingActive(true);
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

        // Prepare Data (Fix Nested Arrays)
        const formattedPath = pathRef.current.map(point => ({ lat: point[0], lng: point[1] }));

        const tripData = {
            userId: user.uid,
            tripName: tripName || "Unnamed Trip",
            notes: tripNotes,
            date: new Date().toISOString(),
            distance: stats.distance.toFixed(2),
            totalDuration: stats.totalDuration.toFixed(2),
            movingDuration: stats.movingDuration.toFixed(2),
            fuelUsed: stats.fuelUsed.toFixed(2),
            cost: stats.cost.toFixed(2),
            topSpeed: trackingData.current.topSpeed.toFixed(2),
            avgSpeed: (stats.distance / (stats.movingDuration/60 || 1)).toFixed(1), // km/h
            path: formattedPath,
            stops: stopsRef.current
        };

        try {
            await addDoc(collection(db, `tripReports/${user.uid}/trips`), tripData);
            alert("Trip Saved Successfully!");
            window.location.reload(); // 🔥 Auto Refresh Page
        } catch (e) {
            console.error("Save Error:", e);
            alert("Error: " + e.message);
        }
    };

    const handleDiscard = () => {
        if(window.confirm("Discard trip?")) window.location.reload();
    };

    return (
        <Layout>
            <div className="dashboard-content">
                <div className="main-header">
                    <div className="header-left">
                        <h1>Trip Manager</h1>
                        <span className="breadcrumb">Live Tracking & Fuel Analysis</span>
                    </div>
                </div>

                <div style={{position:'relative'}}>
                    {trackingActive && <div className="live-badge"><div className="pulsing-dot"></div>LIVE</div>}
                    <div id="map"></div>
                </div>

                {/* --- Updated Stats Grid --- */}
                <div className="trip-info-grid">
                    <Card icon="fa-road" label="Distance" value={`${stats.distance.toFixed(2)} km`} color="#3699ff" />
                    
                    {/* Duration Split */}
                    <Card icon="fa-clock" label="Total Time" value={`${Math.floor(stats.totalDuration)} min`} color="#8950fc" />
                    <Card icon="fa-stopwatch" label="Drive Time" value={`${Math.floor(stats.movingDuration)} min`} color="#28a745" />
                    
                    <Card icon="fa-gauge-high" label="Top Speed" value={`${stats.topSpeed?.toFixed(1) || 0} km/h`} color="#f64e60" />
                    
                    {/* Fuel Metrics */}
                    <Card icon="fa-gas-pump" label="Fuel Used" value={`${stats.fuelUsed.toFixed(2)} L`} color="#ffa800" />
                    <Card icon="fa-money-bill" label="Fuel Cost" value={`Rs. ${stats.cost.toFixed(0)}`} color="#1bc5bd" />
                    
                    {/* Range & Level */}
                    <Card icon="fa-flask" label="Fuel Level" value={`${stats.currentFuelLevel.toFixed(1)} L`} color="#00d2fc" />
                    <Card icon="fa-route" label="Est. Range" value={`${stats.range.toFixed(0)} km`} color="#ffc107" />
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
                            <div style={{textAlign:'left', margin:'20px', fontSize:'14px', color:'#ccc'}}>
                                <p>📏 Distance: <strong>{stats.distance.toFixed(2)} km</strong></p>
                                <p>⏱️ Moving Time: <strong>{Math.floor(stats.movingDuration)} min</strong></p>
                                <p>⛽ Fuel Cost: <strong>Rs. {stats.cost.toFixed(0)}</strong></p>
                            </div>
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
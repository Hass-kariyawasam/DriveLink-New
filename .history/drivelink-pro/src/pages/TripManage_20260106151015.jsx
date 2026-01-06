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
        totalDuration: 0, 
        movingDuration: 0, // ✅ Fixed
        speed: 0, 
        topSpeed: 0, // ✅ Fixed
        fuelUsed: 0, 
        cost: 0, 
        consumption: 0, 
        satellites: 0,
        currentFuelLevel: 0,
        range: 0
    });

    const mapRef = useRef(null);
    const mapInstance = useRef(null);
    const markerRef = useRef(null);
    const polylineRef = useRef(null);
    
    const pathRef = useRef([]); 
    const stopsRef = useRef([]); 
    const stopMarkersRef = useRef([]); 
    
    // Tracking Logic Refs
    const trackingData = useRef({
        startTime: null,
        initialFuel: 0,
        fuelUsed: 0,
        totalDistance: 0,
        topSpeed: 0,
        currentSpeed: 0, // වේගය මෙතනත් තියාගන්නවා Timer එකට ඕන නිසා
        accumulatedMovingTime: 0, // ms වලින්
        lastStopCheckTime: null
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
                    
                    // Ref Update (Timer එකට පාවිච්චි කරන්න)
                    trackingData.current.currentSpeed = speed;

                    // Map Update
                    if (mapInstance.current) {
                        markerRef.current.setLatLng(newPos);
                        mapInstance.current.setView(newPos);
                    }

                    // Tracking Active නම් විතරක් ගණන් හදන්න
                    if (trackingActive) {
                        // First Point
                        if (pathRef.current.length === 0) {
                            L.marker(newPos, {icon: startIcon}).addTo(mapInstance.current);
                        }

                        // Add to Path
                        pathRef.current.push(newPos);
                        if (polylineRef.current) polylineRef.current.setLatLngs(pathRef.current);

                        // --- Distance Calculation ---
                        if (pathRef.current.length > 1) {
                            const lastPos = pathRef.current[pathRef.current.length - 2];
                            const dist = calculateDistance(lastPos, newPos);
                            // Filter GPS Jitter
                            if (dist > 0.002) {
                                trackingData.current.totalDistance += dist;
                            }
                        }

                        // --- ✅ Top Speed Fix ---
                        // කලින් තිබුන Top Speed එකට වඩා දැන් වේගය වැඩි නම් විතරක් Update කරන්න
                        if (speed > trackingData.current.topSpeed) {
                            trackingData.current.topSpeed = speed;
                        }

                        // --- Parking Point Detection ---
                        if (speed < 1) {
                            if (!trackingData.current.lastStopCheckTime) {
                                trackingData.current.lastStopCheckTime = new Date();
                            } else {
                                const timeStopped = (new Date() - trackingData.current.lastStopCheckTime) / 1000;
                                if (timeStopped > 60) { 
                                    const lastStop = stopsRef.current[stopsRef.current.length - 1];
                                    if (!lastStop || calculateDistance([lastStop.lat, lastStop.lng], newPos) > 0.05) {
                                        const stopMarker = L.marker(newPos, {icon: stopIcon}).addTo(mapInstance.current);
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

                    // ✅ State Update (හැම GPS Update එකේදීම UI එක අලුත් කරන්න)
                    setStats(prev => ({ 
                        ...prev, 
                        speed: speed, 
                        topSpeed: trackingData.current.topSpeed, // Top Speed එක මෙතනින් යවනවා
                        satellites: data.satellites || 0 
                    }));
                }
            }
        });

        // --- Fuel Listener ---
        const fuelRef = ref(database, `${deviceId}/fuel_sensor/value`);
        const unsubscribeFuel = onValue(fuelRef, (snapshot) => {
            if (snapshot.exists()) {
                const currentFuel = parseFloat(snapshot.val());
                const fuelPrice = 380;
                const avgMileage = 12;

                const estRange = currentFuel * avgMileage;

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
                    setStats(prev => ({ ...prev, currentFuelLevel: currentFuel, range: estRange }));
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
                
                // --- ✅ Moving Time Fix ---
                // වේගය 1 km/h ට වැඩි නම් මේ තත්පරය Moving Time එකට එකතු කරන්න
                if (trackingData.current.currentSpeed > 1) {
                    trackingData.current.accumulatedMovingTime += 1000; // Add 1 second (1000ms)
                }
                const movingDiff = trackingData.current.accumulatedMovingTime / 1000 / 60; // Convert to Minutes

                // Update Stats
                setStats(prev => ({ 
                    ...prev, 
                    totalDuration: totalDiff,
                    movingDuration: movingDiff,
                    distance: trackingData.current.totalDistance,
                    topSpeed: trackingData.current.topSpeed // Ensure Top Speed stays synced
                }));
            }, 1000); // හැම තත්පරයකම
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
                currentSpeed: 0,
                lastStopCheckTime: null,
                accumulatedMovingTime: 0 // Reset Moving Time
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
            path: formattedPath,
            stops: stopsRef.current
        };

        try {
            await addDoc(collection(db, `tripReports/${user.uid}/trips`), tripData);
            alert("Trip Saved Successfully!");
            window.location.reload(); 
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

                {/* --- Stats Grid --- */}
                <div className="trip-info-grid">
                    <Card icon="fa-road" label="Distance" value={`${stats.distance.toFixed(2)} km`} color="#3699ff" />
                    <Card icon="fa-clock" label="Total Time" value={`${Math.floor(stats.totalDuration)} min`} color="#8950fc" />
                    <Card icon="fa-stopwatch" label="Drive Time" value={`${Math.floor(stats.movingDuration)} min`} color="#28a745" />
                    <Card icon="fa-gauge-high" label="Top Speed" value={`${stats.topSpeed?.toFixed(1) || 0} km/h`} color="#f64e60" />
                    <Card icon="fa-gas-pump" label="Fuel Used" value={`${stats.fuelUsed.toFixed(2)} L`} color="#ffa800" />
                    <Card icon="fa-money-bill" label="Fuel Cost" value={`Rs. ${stats.cost.toFixed(0)}`} color="#1bc5bd" />
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
                                <p>🚀 Top Speed: <strong>{stats.topSpeed.toFixed(1)} km/h</strong></p>
                                <p>⏱️ Moving Time: <strong>{Math.floor(stats.movingDuration)} min</strong></p>
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
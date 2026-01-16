import React, { useState, useEffect, useRef } from 'react';
import Layout from '../components/Layout';
import TripStatsWidget from '../components/widgets/TripStatsWidget';
import { auth, db, database } from '../firebase';
import { ref, onValue, get } from 'firebase/database';
import { collection, addDoc, doc, getDoc } from 'firebase/firestore';
import { onAuthStateChanged } from "firebase/auth";
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import '../css/tripmanage.css';
import '../css/tripwidget.css';

// Icons Config
const startIcon = L.icon({ iconUrl: '/icon/start-marker.png', iconSize: [35, 50], iconAnchor: [17, 50] });
const endIcon = L.icon({ iconUrl: '/icon/end-marker.png', iconSize: [35, 50], iconAnchor: [17, 50] });

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
        distance: 0, 
        totalDuration: 0, 
        movingDuration: 0, 
        speed: 0, 
        topSpeed: 0, 
        fuelUsed: 0, 
        cost: 0, 
        satellites: 0, 
        currentFuelLevel: 0
    });

    // Refs
    const mapInstance = useRef(null);
    const tileLayerRef = useRef(null);
    const markerRef = useRef(null);
    const polylineRef = useRef(null);
    const pathRef = useRef([]); 
    const stopsRef = useRef([]); 
    const stopMarkersRef = useRef([]); 
    
    const trackingData = useRef({
        startTime: null, 
        initialFuel: 0, 
        fuelUsed: 0, 
        totalDistance: 0, 
        topSpeed: 0, 
        lastStopCheckTime: null, 
        isMoving: false, 
        accumulatedMovingTime: 0, 
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

    // 2. Initialize Map
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
        } catch { 
            return "Trip " + new Date().toLocaleDateString(); 
        }
    };

    // 3. Real-time GPS Tracking
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

                        // 2. Distance Calculation
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

                        // 4. Top Speed
                        if (currentSpeed > trackingData.current.topSpeed) {
                            trackingData.current.topSpeed = currentSpeed;
                        }
                    }

                    // Update UI Stats
                    setStats(prev => ({ 
                        ...prev, 
                        speed: currentSpeed, 
                        satellites: data.satellites || 0,
                        topSpeed: trackingActive ? trackingData.current.topSpeed : prev.topSpeed 
                    }));
                }
            }
        });

        // Fuel Monitoring
        const fuelRef = ref(database, `${deviceId}/fuel_sensor/value`);
        const unsubscribeFuel = onValue(fuelRef, (snapshot) => {
            if (snapshot.exists()) {
                const currentFuel = parseFloat(snapshot.val());
                
                if (trackingActive) {
                    const used = Math.max(0, trackingData.current.initialFuel - currentFuel);
                    trackingData.current.fuelUsed = used;
                    setStats(prev => ({ 
                        ...prev, 
                        currentFuelLevel: currentFuel, 
                        fuelUsed: used, 
                        cost: used * 380
                    }));
                } else {
                    setStats(prev => ({ ...prev, currentFuelLevel: currentFuel }));
                }
            }
        });

        return () => { 
            unsubscribeGPS(); 
            unsubscribeFuel(); 
        };
    }, [deviceId, trackingActive]);

    // 4. Duration Timer
    useEffect(() => {
        let interval;
        if (trackingActive) {
            interval = setInterval(() => {
                const now = new Date();
                const totalDiff = (now - trackingData.current.startTime) / 1000 / 60;
                
                let currentMoving = trackingData.current.accumulatedMovingTime;
                if (trackingData.current.isMoving) {
                    currentMoving += (now - trackingData.current.lastMoveTime);
                }
                
                setStats(prev => ({ 
                    ...prev, 
                    totalDuration: totalDiff, 
                    movingDuration: currentMoving / 1000 / 60, 
                    distance: trackingData.current.totalDistance 
                }));
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [trackingActive]);

    const calculateDistance = (pos1, pos2) => {
        const R = 6371; 
        const dLat = (pos2[0] - pos1[0]) * Math.PI / 180;
        const dLon = (pos2[1] - pos1[1]) * Math.PI / 180;
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) + 
                  Math.cos(pos1[0] * Math.PI / 180) * Math.cos(pos2[0] * Math.PI / 180) * 
                  Math.sin(dLon/2) * Math.sin(dLon/2);
        return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    };

    const handleStart = async () => {
        if (!deviceId) return alert("Device ID not found!");
        
        try {
            const fuelSnap = await get(ref(database, `${deviceId}/fuel_sensor/value`));
            const initialFuel = fuelSnap.exists() ? parseFloat(fuelSnap.val()) : 0;
            
            trackingData.current = { 
                startTime: new Date(), 
                initialFuel, 
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
            
            setTrackingActive(true);
            setStats(prev => ({...prev, topSpeed: 0, distance: 0, totalDuration: 0}));

            setTimeout(async () => {
                if(pathRef.current.length > 0 && !tripName) {
                    const [lat, lng] = pathRef.current[0];
                    setTripName(await getPlaceName(lat, lng));
                }
            }, 2000);
        } catch (e) { 
            console.error(e); 
        }
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
            alert("Error: " + e.message); 
        }
    };

    const handleDiscard = () => { 
        if(window.confirm("Discard this trip?")) window.location.reload(); 
    };

    return (
        <Layout>
            <div className="dashboard-content">
                <div className="main-header">
                    <div className="header-left">
                        <h1>Trip Manager</h1>
                        <span className="breadcrumb">Live Trip Tracking</span>
                    </div>
                </div>

                <div className="map-wrapper">
                    {/* Top Right Controls */}
                    <div className="map-controls-top-right">
                        {trackingActive && (
                            <div className="live-badge">
                                <div className="pulsing-dot"></div>
                                LIVE
                            </div>
                        )}
                        <button className="map-toggle-btn" onClick={toggleMapTheme} title="Switch Map View">
                            <i className={`fas ${isDarkMode ? 'fa-satellite' : 'fa-map'}`}></i>
                        </button>
                    </div>

                    {/* Speedometer Capsule */}
                    <div className="speed-capsule">
                        <span className="speed-val">{stats.speed.toFixed(0)}</span>
                        <span className="speed-unit">KM/H</span>
                    </div>

                    <div id="map"></div>
                </div>

                {/* ✅ REUSABLE WIDGET COMPONENT */}
                <TripStatsWidget 
                    stats={stats}
                    showSatellite={true}
                    compact={false}
                />

                {/* Trip Controls */}
                <div className="trip-controls">
                    <div className="input-row">
                        <div className="input-group">
                            <input 
                                type="text" 
                                placeholder="Trip Name" 
                                value={tripName} 
                                onChange={(e) => setTripName(e.target.value)} 
                            />
                        </div>
                        <div className="input-group">
                            <input 
                                type="text" 
                                placeholder="Notes (Optional)" 
                                value={tripNotes} 
                                onChange={(e) => setTripNotes(e.target.value)} 
                            />
                        </div>
                    </div>
                    <div className="control-buttons">
                        {!trackingActive ? (
                            <button className="btn-modern btn-start" onClick={handleStart}>
                                <i className="fas fa-play"></i> START TRIP
                            </button>
                        ) : (
                            <button className="btn-modern btn-end" onClick={handleEndClick}>
                                <i className="fas fa-stop"></i> END TRIP
                            </button>
                        )}
                    </div>
                </div>

                {/* Save Modal */}
                {showSaveModal && (
                    <div className="save-modal-overlay">
                        <div className="save-modal">
                            <i className="fas fa-check-circle" style={{fontSize:'50px', color:'#1bc5bd', marginBottom:'15px'}}></i>
                            <h2>Trip Completed!</h2>
                            <p style={{margin:'15px 0', color:'#8fa2b6'}}>
                                Distance: <strong style={{color:'white'}}>{stats.distance.toFixed(2)} km</strong>
                            </p>
                            <div className="modal-actions">
                                <button className="btn-cancel" onClick={handleDiscard}>
                                    <i className="fas fa-trash"></i> Discard
                                </button>
                                <button className="btn-confirm" onClick={handleConfirmSave}>
                                    <i className="fas fa-save"></i> Save Report
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </Layout>
    );
};

export default TripManage;
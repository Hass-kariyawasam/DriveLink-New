import React, { useState, useEffect, useRef } from 'react';
import Layout from '../components/Layout';
import { auth, db, database } from '../firebase';
import { ref, onValue, get } from 'firebase/database';
import { collection, addDoc, doc, getDoc } from 'firebase/firestore';
import { onAuthStateChanged } from "firebase/auth";
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import '../css/tripmanage.css';

// Icons
const startIcon = L.icon({ iconUrl: '/icon/start-marker.png', iconSize: [30, 45], iconAnchor: [15, 45] });
const endIcon = L.icon({ iconUrl: '/icon/end-marker.png', iconSize: [30, 45], iconAnchor: [15, 45] });

const TripManage = () => {
    // State
    const [trackingActive, setTrackingActive] = useState(false);
    const [deviceId, setDeviceId] = useState(null);
    const [tripName, setTripName] = useState('');
    const [tripNotes, setTripNotes] = useState(''); // New: Notes
    const [showSaveModal, setShowSaveModal] = useState(false); // New: Modal State
    
    const [stats, setStats] = useState({
        distance: 0, duration: 0, speed: 0, topSpeed: 0,
        fuelUsed: 0, cost: 0, consumption: 0, satellites: 0
    });

    const mapRef = useRef(null);
    const markerRef = useRef(null);
    const polylineRef = useRef(null);
    const pathRef = useRef([]);
    const mapInstance = useRef(null);
    
    const trackingData = useRef({
        startTime: null,
        initialFuel: 0,
        fuelUsed: 0,
        totalDistance: 0,
        topSpeed: 0,
        movingTime: 0
    });

    // 1. Get User & Device
    useEffect(() => {
        const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
            if (user) {
                try {
                    const userDoc = await getDoc(doc(db, "users", user.uid));
                    if (userDoc.exists()) {
                        setDeviceId(userDoc.data().deviceId);
                    }
                } catch (error) {
                    console.error("Error:", error);
                }
            }
        });
        return () => unsubscribeAuth();
    }, []);

    // 2. Map Init
    useEffect(() => {
        if (!mapInstance.current) {
            const map = L.map('map').setView([6.9271, 79.8612], 13);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
            markerRef.current = L.marker([6.9271, 79.8612]).addTo(map);
            polylineRef.current = L.polyline([], { color: '#3699ff', weight: 5, opacity: 0.7 }).addTo(map);
            mapInstance.current = map;
        }
    }, []);

    // 3. Tracking Logic
    useEffect(() => {
        if (!deviceId) return;

        const trackingRef = ref(database, `${deviceId}/tracking`);
        const unsubscribeGPS = onValue(trackingRef, (snapshot) => {
            if (snapshot.exists()) {
                const data = snapshot.val();
                if (data.latitude && data.longitude) {
                    const newPos = [data.latitude, data.longitude];

                    if (mapInstance.current) {
                        markerRef.current.setLatLng(newPos);
                        mapInstance.current.setView(newPos);
                    }

                    setStats(prev => ({ ...prev, speed: data.speed || 0, satellites: data.satellites || 0 }));

                    if (trackingActive) {
                        pathRef.current.push(newPos);
                        if (polylineRef.current) polylineRef.current.setLatLngs(pathRef.current);

                        if (pathRef.current.length > 1) {
                            const lastPos = pathRef.current[pathRef.current.length - 2];
                            const dist = calculateDistance(lastPos, newPos);
                            if (dist > 0.001 && dist < 10) trackingData.current.totalDistance += dist;
                        }
                        if (data.speed > trackingData.current.topSpeed) trackingData.current.topSpeed = data.speed;
                    }
                }
            }
        });

        const fuelRef = ref(database, `${deviceId}/fuel_sensor/value`);
        const unsubscribeFuel = onValue(fuelRef, (snapshot) => {
            if (trackingActive && snapshot.exists()) {
                const currentFuel = parseFloat(snapshot.val());
                const used = trackingData.current.initialFuel - currentFuel;
                trackingData.current.fuelUsed = used > 0 ? used : 0;
                const dist = trackingData.current.totalDistance;
                const rate = dist > 0.1 ? (trackingData.current.fuelUsed / dist) * 100 : 0;

                setStats(prev => ({
                    ...prev,
                    fuelUsed: trackingData.current.fuelUsed,
                    cost: trackingData.current.fuelUsed * 380,
                    consumption: rate
                }));
            }
        });

        return () => { unsubscribeGPS(); unsubscribeFuel(); };
    }, [deviceId, trackingActive]);

    // Timer
    useEffect(() => {
        let interval;
        if (trackingActive) {
            interval = setInterval(() => {
                const now = new Date();
                const diff = (now - trackingData.current.startTime) / 1000 / 60;
                setStats(prev => ({ ...prev, duration: diff, distance: trackingData.current.totalDistance }));
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [trackingActive]);

    const calculateDistance = (pos1, pos2) => {
        const R = 6371;
        const dLat = (pos2[0] - pos1[0]) * Math.PI / 180;
        const dLon = (pos2[1] - pos1[1]) * Math.PI / 180;
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(pos1[0] * Math.PI / 180) * Math.cos(pos2[0] * Math.PI / 180) * Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
    };

    // --- BUTTON HANDLERS ---

    const handleStart = async () => {
        if (!deviceId) return alert("Device ID not found!");
        try {
            const fuelSnap = await get(ref(database, `${deviceId}/fuel_sensor/value`));
            const initialFuel = fuelSnap.exists() ? parseFloat(fuelSnap.val()) : 0;
            
            trackingData.current = {
                startTime: new Date(), initialFuel, fuelUsed: 0, totalDistance: 0, topSpeed: 0, movingTime: 0
            };
            pathRef.current = [];
            if(polylineRef.current) polylineRef.current.setLatLngs([]);
            
            setTrackingActive(true);
            if(pathRef.current.length > 0) L.marker(pathRef.current[0], {icon: startIcon}).addTo(mapInstance.current);
        } catch (e) { console.error(e); }
    };

    // End බටන් එක එබුවම Modal එක පෙන්වනවා
    const handleEndClick = () => {
        setTrackingActive(false); // Tracking නවත්වනවා
        const lastPos = pathRef.current[pathRef.current.length - 1];
        if (lastPos) L.marker(lastPos, {icon: endIcon}).addTo(mapInstance.current);
        setShowSaveModal(true); // Modal එක පෙන්නනවා
    };

    // Modal එකෙන් Save කරන්න කිව්වම
    const handleConfirmSave = async () => {
        const user = auth.currentUser;
        if (!user) return;

        const tripData = {
            userId: user.uid,
            tripName: tripName || "Unnamed Trip",
            notes: tripNotes, // Save notes
            date: new Date().toISOString(),
            distance: stats.distance.toFixed(2),
            duration: stats.duration.toFixed(2),
            fuelUsed: stats.fuelUsed.toFixed(2),
            cost: stats.cost.toFixed(2),
            topSpeed: trackingData.current.topSpeed.toFixed(2),
            path: pathRef.current
        };

        try {
            await addDoc(collection(db, `tripReports/${user.uid}/trips`), tripData);
            alert("Trip Report Saved Successfully!");
            resetTrip();
        } catch (e) {
            console.error(e);
            alert("Error saving report.");
        }
    };

    // Modal එකෙන් Cancel කළාම
    const handleDiscard = () => {
        if(window.confirm("Are you sure you want to discard this trip data?")) {
            resetTrip();
        } else {
            // Modal එක ආයේ පෙන්නන්න හෝ එහෙමම තියන්න
        }
    };

    const resetTrip = () => {
        setStats({ distance: 0, duration: 0, speed: 0, topSpeed: 0, fuelUsed: 0, cost: 0, consumption: 0, satellites: 0 });
        setTripName('');
        setTripNotes('');
        pathRef.current = [];
        if(polylineRef.current) polylineRef.current.setLatLngs([]);
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

                {/* Map Section */}
                <div style={{position:'relative'}}>
                    {trackingActive && (
                        <div className="live-badge">
                            <div className="pulsing-dot"></div>
                            LIVE TRACKING
                        </div>
                    )}
                    <div id="map"></div>
                </div>

                {/* Stats Grid */}
                <div className="trip-info-grid">
                    <Card icon="fa-road" label="Distance" value={`${stats.distance.toFixed(2)} km`} color="#3699ff" />
                    <Card icon="fa-clock" label="Duration" value={`${stats.duration.toFixed(0)} min`} color="#8950fc" />
                    <Card icon="fa-gauge-high" label="Current Speed" value={`${stats.speed.toFixed(1)} km/h`} color="#1bc5bd" />
                    <Card icon="fa-rocket" label="Top Speed" value={`${stats.topSpeed?.toFixed(1) || 0} km/h`} color="#f64e60" />
                    <Card icon="fa-gas-pump" label="Fuel Used" value={`${stats.fuelUsed.toFixed(2)} L`} color="#ffa800" />
                    <Card icon="fa-money-bill" label="Est. Cost" value={`Rs. ${stats.cost.toFixed(0)}`} color="#1bc5bd" />
                </div>

                {/* Modern Controls */}
                <div className="trip-controls">
                    <div className="control-header">
                        <h3><i className="fas fa-sliders-h" style={{color:'#C4FB6D'}}></i> Trip Controls</h3>
                    </div>
                    
                    <div className="input-row">
                        <div className="input-group">
                            <input 
                                type="text" 
                                placeholder="Trip Name (e.g. Office Run)" 
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
                                <i className="fas fa-play"></i> Start Trip
                            </button>
                        ) : (
                            <button className="btn-modern btn-end" onClick={handleEndClick}>
                                <i className="fas fa-stop"></i> End Trip
                            </button>
                        )}
                    </div>
                </div>

                {/* Save Confirmation Modal */}
                {showSaveModal && (
                    <div className="save-modal-overlay">
                        <div className="save-modal">
                            <i className="fas fa-check-circle"></i>
                            <h2>Trip Completed!</h2>
                            <p>
                                Distance: <strong>{stats.distance.toFixed(2)} km</strong> <br/>
                                Do you want to save this trip report?
                            </p>
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
        <div className="trip-icon" style={{color: color}}>
            <i className={`fas ${icon}`}></i>
        </div>
        <div className="trip-details">
            <span className="trip-label">{label}</span>
            <span className="trip-value">{value}</span>
        </div>
    </div>
);

export default TripManage;
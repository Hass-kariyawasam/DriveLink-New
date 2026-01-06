import React, { useState, useEffect, useRef } from 'react';
import Layout from '../components/Layout';
import { auth, db, database } from '../firebase'; // db = Firestore, database = Realtime
import { ref, onValue, get } from 'firebase/database';
import { collection, addDoc, doc, getDoc, setDoc } from 'firebase/firestore';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import '../css/tripmanage.css';

// Icons Import (Make sure these exist in public/icon/ folder or change path)
// ඔයාගේ public/icon ෆෝල්ඩර් එකේ මේ පින්තූර තියෙන්න ඕන. නැත්නම් Map එකේ Icon පේන්නේ නෑ.
const startIconUrl = '/icon/start-marker.png';
const endIconUrl = '/icon/end-marker.png';

const TripManage = () => {
    // State
    const [trackingActive, setTrackingActive] = useState(false);
    const [tripName, setTripName] = useState('');
    const [stats, setStats] = useState({
        distance: 0,
        duration: 0,
        speed: 0,
        topSpeed: 0,
        fuelUsed: 0,
        cost: 0,
        consumption: 0,
        satellites: 0
    });

    // Refs for Map and Logic
    const mapRef = useRef(null);
    const markerRef = useRef(null);
    const polylineRef = useRef(null);
    const pathRef = useRef([]);
    const mapInstance = useRef(null);
    
    // Tracking Refs (values that change frequently)
    const trackingData = useRef({
        startTime: null,
        initialFuel: 0,
        fuelUsed: 0,
        totalDistance: 0,
        topSpeed: 0,
        movingTime: 0
    });

    // 1. Initialize Map
    useEffect(() => {
        if (!mapInstance.current) {
            const map = L.map('map').setView([6.9271, 79.8612], 13); // Default Colombo
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
            
            // Marker & Polyline
            markerRef.current = L.marker([6.9271, 79.8612]).addTo(map);
            polylineRef.current = L.polyline([], { color: 'red' }).addTo(map);
            
            mapInstance.current = map;
        }
    }, []);

    // 2. Real-time Tracking
    useEffect(() => {
        const user = auth.currentUser;
        if (!user) return;

        // GPS Data Listener
        const trackingRef = ref(database, `${user.uid}/tracking`);
        const unsubscribeGPS = onValue(trackingRef, (snapshot) => {
            if (snapshot.exists()) {
                const data = snapshot.val();
                const newPos = [data.latitude, data.longitude];

                // Update Map
                if (mapInstance.current) {
                    markerRef.current.setLatLng(newPos);
                    mapInstance.current.setView(newPos);
                }

                // Update Stats
                setStats(prev => ({ 
                    ...prev, 
                    speed: data.speed || 0,
                    satellites: data.satellites || 0 
                }));

                // Logic if Tracking is Active
                if (trackingActive) {
                    // Update Path
                    pathRef.current.push(newPos);
                    if (polylineRef.current) {
                        polylineRef.current.setLatLngs(pathRef.current);
                    }

                    // Calculate Distance
                    if (pathRef.current.length > 1) {
                        const lastPos = pathRef.current[pathRef.current.length - 2];
                        const dist = calculateDistance(lastPos, newPos);
                        trackingData.current.totalDistance += dist;
                    }

                    // Update Top Speed
                    if (data.speed > trackingData.current.topSpeed) {
                        trackingData.current.topSpeed = data.speed;
                    }
                }
            }
        });

        // Fuel Data Listener
        const fuelRef = ref(database, `${user.uid}/fuel_sensor/value`);
        const unsubscribeFuel = onValue(fuelRef, (snapshot) => {
            if (trackingActive && snapshot.exists()) {
                const currentFuel = parseFloat(snapshot.val());
                const used = trackingData.current.initialFuel - currentFuel;
                trackingData.current.fuelUsed = used > 0 ? used : 0;
                
                // Calculate real-time consumption
                const dist = trackingData.current.totalDistance;
                const rate = dist > 0 ? (trackingData.current.fuelUsed / dist) * 100 : 0;

                setStats(prev => ({
                    ...prev,
                    fuelUsed: trackingData.current.fuelUsed,
                    cost: trackingData.current.fuelUsed * 250, // Rs. 250 per Liter
                    consumption: rate
                }));
            }
        });

        return () => {
            unsubscribeGPS();
            unsubscribeFuel();
        };
    }, [trackingActive]);

    // 3. Timer Effect
    useEffect(() => {
        let interval;
        if (trackingActive) {
            interval = setInterval(() => {
                const now = new Date();
                const diff = (now - trackingData.current.startTime) / 1000 / 60; // Minutes
                setStats(prev => ({ ...prev, duration: diff, distance: trackingData.current.totalDistance }));
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [trackingActive]);

    // Helper: Distance Calculation (Haversine)
    const calculateDistance = (pos1, pos2) => {
        const R = 6371;
        const dLat = (pos2[0] - pos1[0]) * Math.PI / 180;
        const dLon = (pos2[1] - pos1[1]) * Math.PI / 180;
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                  Math.cos(pos1[0] * Math.PI / 180) * Math.cos(pos2[0] * Math.PI / 180) *
                  Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
    };

    // Button Handlers
    const handleStart = async () => {
        const user = auth.currentUser;
        if (!user) return;

        // Get Initial Fuel
        try {
            const fuelSnap = await get(ref(database, `${user.uid}/fuel_sensor/value`));
            const initialFuel = fuelSnap.exists() ? parseFloat(fuelSnap.val()) : 0;
            
            trackingData.current = {
                startTime: new Date(),
                initialFuel: initialFuel,
                fuelUsed: 0,
                totalDistance: 0,
                topSpeed: 0,
                movingTime: 0
            };
            
            pathRef.current = [];
            if(polylineRef.current) polylineRef.current.setLatLngs([]);
            
            setTrackingActive(true);
            alert("Trip Started!");
        } catch (e) {
            console.error(e);
            alert("Error starting trip");
        }
    };

    const handleEnd = () => {
        setTrackingActive(false);
        alert("Trip Ended. You can now generate the report.");
    };

    const handleReport = async () => {
        const user = auth.currentUser;
        if (!user) return;

        const tripData = {
            userId: user.uid,
            tripName: tripName || "Unnamed Trip",
            date: new Date().toISOString(),
            distance: stats.distance.toFixed(2),
            duration: stats.duration.toFixed(2),
            fuelUsed: stats.fuelUsed.toFixed(2),
            cost: stats.cost.toFixed(2),
            topSpeed: trackingData.current.topSpeed.toFixed(2),
            path: pathRef.current // Coordinate array
        };

        try {
            await addDoc(collection(db, `tripReports/${user.uid}/trips`), tripData);
            alert("Trip Report Saved Successfully!");
            // Reset UI
            setStats({
                distance: 0, duration: 0, speed: 0, topSpeed: 0,
                fuelUsed: 0, cost: 0, consumption: 0, satellites: 0
            });
            setTripName('');
            pathRef.current = [];
            polylineRef.current.setLatLngs([]);
        } catch (e) {
            console.error(e);
            alert("Error saving report.");
        }
    };

    return (
        <Layout>
            <div className="dashboard-content">
                <div className="main-header">
                    <div className="header-left">
                        <h1>Trip Manager</h1>
                        <span className="breadcrumb">Dashboard / Trip Manage</span>
                    </div>
                </div>

                {/* Map Section */}
                <div id="map"></div>

                {/* Stats Grid */}
                <div className="trip-info-grid">
                    <Card icon="fa-road" label="Distance" value={`${stats.distance.toFixed(2)} km`} color="#3699ff" />
                    <Card icon="fa-clock" label="Duration" value={`${stats.duration.toFixed(0)} min`} color="#8950fc" />
                    <Card icon="fa-gauge-high" label="Speed" value={`${stats.speed.toFixed(1)} km/h`} color="#1bc5bd" />
                    <Card icon="fa-rocket" label="Top Speed" value={`${stats.topSpeed?.toFixed(1) || 0} km/h`} color="#f64e60" />
                    <Card icon="fa-gas-pump" label="Fuel Used" value={`${stats.fuelUsed.toFixed(2)} L`} color="#ffa800" />
                    <Card icon="fa-money-bill" label="Cost" value={`Rs. ${stats.cost.toFixed(0)}`} color="#1bc5bd" />
                    <Card icon="fa-satellite" label="Satellites" value={stats.satellites} color="#8fa2b6" />
                </div>

                {/* Controls */}
                <div className="trip-controls">
                    <div className="input-group">
                        <input 
                            type="text" 
                            placeholder="Enter Trip Name (e.g., Office to Home)" 
                            value={tripName}
                            onChange={(e) => setTripName(e.target.value)}
                        />
                    </div>
                    <div className="control-buttons">
                        <button className="btn btn-start" onClick={handleStart} disabled={trackingActive}>
                            <i className="fas fa-play"></i> Start Trip
                        </button>
                        <button className="btn btn-end" onClick={handleEnd} disabled={!trackingActive}>
                            <i className="fas fa-stop"></i> End Trip
                        </button>
                        <button className="btn btn-report" onClick={handleReport} disabled={trackingActive || stats.distance === 0}>
                            <i className="fas fa-file-export"></i> Generate Report
                        </button>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

// Mini Component for Info Cards
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
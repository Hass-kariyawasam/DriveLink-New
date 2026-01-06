import React, { useState, useEffect, useRef } from 'react';
import Layout from '../components/Layout';
import { auth, db, database } from '../firebase';
import { ref, onValue, get } from 'firebase/database';
import { collection, addDoc, doc, getDoc } from 'firebase/firestore';
import { onAuthStateChanged } from "firebase/auth";
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import '../css/tripmanage.css'; // Updated CSS

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

// Map Layers
const STREET_MAP = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
const SATELLITE_MAP = 'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}'; 

const TripManage = () => {
    const [trackingActive, setTrackingActive] = useState(false);
    const [deviceId, setDeviceId] = useState(null);
    const [tripName, setTripName] = useState('');
    const [tripNotes, setTripNotes] = useState('');
    const [showSaveModal, setShowSaveModal] = useState(false);
    const [isSatelliteMode, setIsSatelliteMode] = useState(true);
    
    // Live Stats
    const [stats, setStats] = useState({
        distance: 0, totalDuration: 0, movingDuration: 0, speed: 0, 
        topSpeed: 0, fuelUsed: 0, cost: 0, consumption: 0, 
        satellites: 0, currentFuelLevel: 0, range: 0
    });

    const mapRef = useRef(null);
    const mapInstance = useRef(null);
    const tileLayerRef = useRef(null);
    const markerRef = useRef(null);
    const polylineRef = useRef(null);
    
    const pathRef = useRef([]); 
    const stopsRef = useRef([]); 
    
    const trackingData = useRef({
        startTime: null, initialFuel: 0, fuelUsed: 0, totalDistance: 0, 
        topSpeed: 0, lastStopCheckTime: null, isMoving: false, 
        accumulatedMovingTime: 0, lastMoveTime: null
    });

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
            const map = L.map('map', { zoomControl: false }).setView([6.9271, 79.8612], 13);
            
            tileLayerRef.current = L.tileLayer(SATELLITE_MAP, { maxZoom: 20 }).addTo(map);
            markerRef.current = L.marker([6.9271, 79.8612]).addTo(map);
            polylineRef.current = L.polyline([], { color: '#3699ff', weight: 5 }).addTo(map);
            L.control.zoom({ position: 'bottomleft' }).addTo(map);
            
            mapInstance.current = map;
            setTimeout(() => { map.invalidateSize(); }, 500);
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

    // Tracking Logic
    useEffect(() => {
        if (!deviceId) return;

        const trackingRef = ref(database, `${deviceId}/tracking`);
        const unsubscribeGPS = onValue(trackingRef, (snapshot) => {
            if (snapshot.exists()) {
                const data = snapshot.val();
                if (data.latitude && data.longitude) {
                    const newPos = [data.latitude, data.longitude];
                    const speed = parseFloat(data.speed || 0);

                    if (mapInstance.current) {
                        markerRef.current.setLatLng(newPos);
                        if(trackingActive) mapInstance.current.setView(newPos);
                    }

                    setStats(prev => ({ ...prev, speed: speed, satellites: data.satellites || 0 }));

                    if (trackingActive) {
                        if (pathRef.current.length === 0) {
                            trackingData.current.lastMoveTime = new Date();
                        }

                        pathRef.current.push(newPos);
                        if (polylineRef.current) polylineRef.current.setLatLngs(pathRef.current);

                        if (pathRef.current.length > 1) {
                            const lastPos = pathRef.current[pathRef.current.length - 2];
                            const dist = calculateDistance(lastPos, newPos);
                            if (dist > 0.002) trackingData.current.totalDistance += dist;
                        }

                        if (speed > 1) {
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

                        if (speed > trackingData.current.topSpeed) trackingData.current.topSpeed = speed;
                    }
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

                    setStats(prev => ({
                        ...prev, currentFuelLevel: currentFuel, range: estRange,
                        fuelUsed: used, cost: used * 380, consumption: rate
                    }));
                } else {
                    setStats(prev => ({ ...prev, currentFuelLevel: currentFuel, range: estRange }));
                }
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
                const totalDiff = (now - trackingData.current.startTime) / 1000 / 60;
                
                let currentMoving = trackingData.current.accumulatedMovingTime;
                if (trackingData.current.isMoving) {
                    currentMoving += (now - trackingData.current.lastMoveTime);
                }
                
                setStats(prev => ({ 
                    ...prev, 
                    totalDuration: totalDiff,
                    movingDuration: currentMoving / 1000 / 60,
                    distance: trackingData.current.totalDistance,
                    topSpeed: trackingData.current.topSpeed // Ensure UI updates
                }));
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
            
            trackingData.current = {
                startTime: new Date(), initialFuel, fuelUsed: 0, totalDistance: 0, topSpeed: 0, 
                lastStopCheckTime: null, isMoving: false, accumulatedMovingTime: 0, lastMoveTime: null
            };
            pathRef.current = [];
            stopsRef.current = [];
            if(polylineRef.current) polylineRef.current.setLatLngs([]);
            
            setTrackingActive(true);
            setStats(prev => ({...prev, distance: 0, topSpeed: 0, fuelUsed: 0}));

        } catch (e) { console.error(e); }
    };

    const handleEndClick = () => {
        setTrackingActive(false);
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
            topSpeed: trackingData.current.topSpeed.toFixed(2), path: formattedPath
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
                        <span className="breadcrumb">Track & Record Trips</span>
                    </div>
                </div>

                <div className="map-wrapper">
                    
                    {/* --- CONTROLS GROUP (Updated to match LiveTracking) --- */}
                    <div className="map-controls-group">
                        
                        {/* 1. Status Badge */}
                        {trackingActive && (
                            <div className="status-badge online">
                                <div className="blink-dot"></div>
                                RECORDING
                            </div>
                        )}

                        {/* 2. Satellite Badge with Bars */}
                        <div className="sat-badge-bars">
                            <SignalBars count={stats.satellites} />
                            <span className="sat-count">{
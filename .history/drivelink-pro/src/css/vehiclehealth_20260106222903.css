import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { auth, db, database } from '../firebase';
// 1. setDoc අයින් කළා (Fixes ESLint Error)
import { collection, getDocs, doc, getDoc, updateDoc } from 'firebase/firestore';
import { ref, onValue } from 'firebase/database';
import { onAuthStateChanged } from "firebase/auth";
import '../css/vehiclehealth.css';

const VehicleHealth = () => {
    // 1. Stats State
    const [stats, setStats] = useState({
        totalDistance: 0,
        nextServiceDue: 0,
        remainingKm: 0,
        healthScore: 95,
        avgConsumption: 12,
        batteryVoltage: 12.6,
        currentFuelLitters: 0,
    });

    // 2. Settings State (Added serviceInterval)
    const [settings, setSettings] = useState({
        fuelPrice: 380,
        tankCapacity: 50,
        manualOdometer: 0,
        serviceInterval: 5000 // 🔥 New: Service Interval Setting
    });

    const [loading, setLoading] = useState(true);
    const [userUid, setUserUid] = useState(null);
    const [deviceId, setDeviceId] = useState(null);
    const [isEditing, setIsEditing] = useState(false);

    // --- DATA FETCHING & CALCULATIONS ---
    useEffect(() => {
        const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
            if (user) {
                setUserUid(user.uid);
                try {
                    // A. Get User Profile
                    const userDocRef = doc(db, "users", user.uid);
                    const userDocSnap = await getDoc(userDocRef);
                    
                    // Load saved settings
                    if (userDocSnap.exists()) {
                        const userData = userDocSnap.data();
                        setDeviceId(userData.deviceId);
                        if (userData.vehicleSettings) {
                            setSettings(prev => ({...prev, ...userData.vehicleSettings}));
                        }
                    }

                    // B. Get Trips
                    const querySnapshot = await getDocs(collection(db, `tripReports/${user.uid}/trips`));
                    let tripDistance = 0;
                    let totalFuel = 0;
                    
                    querySnapshot.forEach((doc) => {
                        const data = doc.data();
                        tripDistance += parseFloat(data.distance || 0);
                        totalFuel += parseFloat(data.fuelUsed || 0);
                    });

                    // C. Calculate Totals using Settings
                    const currentOdometer = Math.max(tripDistance, parseFloat(settings.manualOdometer || 0));
                    
                    // 🔥 Use Dynamic Service Interval
                    const interval = parseFloat(settings.serviceInterval) || 5000;
                    
                    const distanceSinceLastService = currentOdometer % interval;
                    const remaining = interval - distanceSinceLastService;
                    const efficiency = totalFuel > 0 ? (tripDistance / totalFuel).toFixed(1) : 12;

                    setStats(prev => ({
                        ...prev,
                        totalDistance: currentOdometer.toFixed(1),
                        nextServiceDue: (Math.ceil(currentOdometer / interval) * interval),
                        remainingKm: remaining.toFixed(0),
                        avgConsumption: efficiency,
                    }));

                } catch (error) {
                    console.error("Error:", error);
                }
                setLoading(false);
            }
        });
        return () => unsubscribeAuth();
    }, [settings.manualOdometer, settings.serviceInterval]); // Re-calc when settings change

    // --- REALTIME SENSORS ---
    useEffect(() => {
        if (deviceId) {
            const batRef = ref(database, `${deviceId}/battery_sensor/value`);
            const fuelRef = ref(database, `${deviceId}/fuel_sensor/value`);

            onValue(batRef, (snap) => {
                if(snap.exists()) setStats(prev => ({...prev, batteryVoltage: snap.val()}));
            });

            onValue(fuelRef, (snap) => {
                if(snap.exists()) setStats(prev => ({...prev, currentFuelLitters: parseFloat(snap.val())}));
            });
        }
    }, [deviceId]);

    // --- SAVE SETTINGS ---
    const handleSaveSettings = async () => {
        if (!userUid) return;
        try {
            const userDocRef = doc(db, "users", userUid);
            await updateDoc(userDocRef, {
                vehicleSettings: {
                    fuelPrice: parseFloat(settings.fuelPrice),
                    tankCapacity: parseFloat(settings.tankCapacity),
                    manualOdometer: parseFloat(settings.manualOdometer),
                    serviceInterval: parseFloat(settings.serviceInterval) // Save Interval
                }
            });
            setIsEditing(false);
            alert("Settings updated!");
        } catch (error) {
            console.error("Error saving:", error);
            alert("Failed to save.");
        }
    };

    // Helper Calcs
    const fuelPercentage = ((stats.currentFuelLitters / settings.tankCapacity) * 100).toFixed(0);
    const range = (stats.currentFuelLitters * stats.avgConsumption).toFixed(0);
    const fullTankCost = (settings.tankCapacity * settings.fuelPrice).toLocaleString();

    if (loading) return <Layout><div style={{color:'white', padding:'20px'}}>Loading...</div></Layout>;

    return (
        <Layout>
            <div className="dashboard-content">
                <div className="main-header">
                    <div className="header-left">
                        <h1>Vehicle Health</h1>
                        <span className="breadcrumb">Configuration & Status</span>
                    </div>
                    <button 
                        className="btn-edit-settings" 
                        onClick={() => isEditing ? handleSaveSettings() : setIsEditing(true)}
                    >
                        {isEditing ? <><i className="fas fa-save"></i> Save Config</> : <><i className="fas fa-cog"></i> Configure</>}
                    </button>
                </div>

                <div className="vh-container">
                    
                    {/* SETTINGS CARD */}
                    <div className="vh-fuel-card" style={{ padding: '25px' }}>
                        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px'}}>
                            <h3><i className="fas fa-sliders-h" style={{color:'#3699ff'}}></i> Vehicle Config</h3>
                            <span className="status-badge" style={{background:'#3699ff20', color:'#3699ff'}}>Active</span>
                        </div>

                        <div className="settings-grid">
                            
                            {/* Service Interval Input */}
                            <div className="setting-item highlight">
                                <label>Service Interval (KM)</label>
                                {isEditing ? (
                                    <input 
                                        type="number" 
                                        value={settings.serviceInterval} 
                                        onChange={(e) => setSettings({...settings, serviceInterval: e.target.value})}
                                    />
                                ) : (
                                    <div className="setting-value">{settings.serviceInterval} km</div>
                                )}
                            </div>

                            <div className="setting-item">
                                <label>Odometer (KM)</label>
                                {isEditing ? (
                                    <input 
                                        type="number" 
                                        value={settings.manualOdometer} 
                                        onChange={(e) => setSettings({...settings, manualOdometer: e.target.value})}
                                    />
                                ) : (
                                    <div className="setting-value">{stats.totalDistance} km</div>
                                )}
                            </div>

                            <div className="setting-item">
                                <label>Fuel Price (Rs/L)</label>
                                {isEditing ? (
                                    <input 
                                        type="number" 
                                        value={settings.fuelPrice} 
                                        onChange={(e) => setSettings({...settings, fuelPrice: e.target.value})}
                                    />
                                ) : (
                                    <div className="setting-value">Rs. {settings.fuelPrice}</div>
                                )}
                            </div>

                            <div className="setting-item">
                                <label>Tank Capacity (L)</label>
                                {isEditing ? (
                                    <input 
                                        type="number" 
                                        value={settings.tankCapacity} 
                                        onChange={(e) => setSettings({...settings, tankCapacity: e.target.value})}
                                    />
                                ) : (
                                    <div className="setting-value">{settings.tankCapacity} L</div>
                                )}
                            </div>

                        </div>
                    </div>

                    {/* WIDGETS GRID */}
                    <div className="vh-grid">
                        
                        {/* Service Status */}
                        <div className="vh-card service-card">
                            <div className="vh-icon-box blue"><i className="fas fa-wrench"></i></div>
                            <div className="vh-info">
                                <h3>Service Due In</h3>
                                <div className="progress-bar-bg">
                                    <div className="progress-bar-fill" style={{width: `${(stats.remainingKm / settings.serviceInterval) * 100}%`}}></div>
                                </div>
                                <div className="vh-stat-row">
                                    <span className="big-num">{stats.remainingKm} <small>km</small></span>
                                    <span className="sub-text">Next at: {stats.nextServiceDue} km</span>
                                </div>
                            </div>
                        </div>

                        {/* Fuel Info */}
                        <div className="vh-card">
                            <div className="vh-icon-box orange"><i className="fas fa-gas-pump"></i></div>
                            <div className="vh-info">
                                <h3>Fuel Range</h3>
                                <span className="big-num">{range} <small>km</small></span>
                                <p className="sub-text">Tank: {fuelPercentage}% ({fullTankCost} Rs full)</p>
                            </div>
                        </div>

                        {/* Efficiency */}
                        <div className="vh-card">
                            <div className="vh-icon-box green"><i className="fas fa-leaf"></i></div>
                            <div className="vh-info">
                                <h3>Efficiency</h3>
                                <span className="big-num">{stats.avgConsumption} <small>km/L</small></span>
                            </div>
                        </div>

                        {/* Battery */}
                        <div className="vh-card">
                            <div className="vh-icon-box red"><i className="fas fa-car-battery"></i></div>
                            <div className="vh-info">
                                <h3>Battery</h3>
                                <span className="big-num">{stats.batteryVoltage} <small>V</small></span>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default VehicleHealth;
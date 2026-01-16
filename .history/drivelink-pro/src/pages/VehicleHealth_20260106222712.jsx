import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { auth, db, database } from '../firebase';
import { collection, getDocs, doc, getDoc, updateDoc, setDoc } from 'firebase/firestore';
import { ref, onValue } from 'firebase/database';
import { onAuthStateChanged } from "firebase/auth";
import '../css/vehiclehealth.css';

const VehicleHealth = () => {
    // 1. Stats State
    const [stats, setStats] = useState({
        totalDistance: 0,
        nextServiceDue: 5000,
        remainingKm: 5000,
        healthScore: 95,
        avgConsumption: 12, // Default
        batteryVoltage: 12.6,
        currentFuelLitters: 0,
    });

    // 2. Settings State (User Inputs)
    const [settings, setSettings] = useState({
        fuelPrice: 380,      // Default Rs.
        tankCapacity: 50,    // Default Liters
        manualOdometer: 0    // Manual Correction
    });

    const [loading, setLoading] = useState(true);
    const [userUid, setUserUid] = useState(null);
    const [deviceId, setDeviceId] = useState(null);
    const [isEditing, setIsEditing] = useState(false); // Edit Mode

    // --- DATA FETCHING ---
    useEffect(() => {
        const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
            if (user) {
                setUserUid(user.uid);
                try {
                    // A. Get User Profile (Device ID & Settings)
                    const userDocRef = doc(db, "users", user.uid);
                    const userDocSnap = await getDoc(userDocRef);
                    
                    if (userDocSnap.exists()) {
                        const userData = userDocSnap.data();
                        setDeviceId(userData.deviceId);
                        
                        // Load saved settings if exist
                        if (userData.vehicleSettings) {
                            setSettings(userData.vehicleSettings);
                        }
                    }

                    // B. Get Trips (To calculate Total Distance)
                    const querySnapshot = await getDocs(collection(db, `tripReports/${user.uid}/trips`));
                    let tripDistance = 0;
                    let totalFuel = 0;
                    
                    querySnapshot.forEach((doc) => {
                        const data = doc.data();
                        tripDistance += parseFloat(data.distance || 0);
                        totalFuel += parseFloat(data.fuelUsed || 0);
                    });

                    // C. Calculate Totals
                    // If user entered a manual odometer reading, use that as base
                    const finalTotalDistance = Math.max(tripDistance, parseFloat(settings.manualOdometer || 0));
                    
                    const serviceInterval = 5000;
                    const distanceSinceLastService = finalTotalDistance % serviceInterval;
                    const remaining = serviceInterval - distanceSinceLastService;
                    const efficiency = totalFuel > 0 ? (tripDistance / totalFuel).toFixed(1) : 12;

                    setStats(prev => ({
                        ...prev,
                        totalDistance: finalTotalDistance.toFixed(1),
                        nextServiceDue: (Math.ceil(finalTotalDistance / serviceInterval) * serviceInterval),
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
    }, [settings.manualOdometer]); // Re-run if odometer changes

    // --- REALTIME SENSOR DATA ---
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

    // --- SAVE SETTINGS FUNCTION ---
    const handleSaveSettings = async () => {
        if (!userUid) return;
        try {
            const userDocRef = doc(db, "users", userUid);
            await updateDoc(userDocRef, {
                vehicleSettings: {
                    fuelPrice: parseFloat(settings.fuelPrice),
                    tankCapacity: parseFloat(settings.tankCapacity),
                    manualOdometer: parseFloat(settings.manualOdometer)
                }
            });
            setIsEditing(false);
            alert("Vehicle settings updated!");
        } catch (error) {
            console.error("Error saving settings:", error);
            alert("Failed to save settings.");
        }
    };

    // Helper Calculations
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
                        <span className="breadcrumb">Settings & Diagnostics</span>
                    </div>
                    {/* EDIT BUTTON */}
                    <button 
                        className="btn-edit-settings" 
                        onClick={() => isEditing ? handleSaveSettings() : setIsEditing(true)}
                    >
                        {isEditing ? <><i className="fas fa-save"></i> Save</> : <><i className="fas fa-cog"></i> Settings</>}
                    </button>
                </div>

                <div className="vh-container">
                    
                    {/* 1. SETTINGS & FUEL CARD (Combined) */}
                    <div className="vh-fuel-card" style={{ padding: '25px' }}>
                        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px'}}>
                            <h3><i className="fas fa-gas-pump" style={{color:'#3699ff'}}></i> Fuel & Config</h3>
                            <span className="status-badge" style={{background:'#3699ff20', color:'#3699ff'}}>{fuelPercentage}% Full</span>
                        </div>

                        <div className="settings-grid">
                            
                            {/* Input: Fuel Price */}
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

                            {/* Input: Tank Capacity */}
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

                            {/* Input: Odometer Correction */}
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

                            {/* Calculated: Full Tank Cost */}
                            <div className="setting-item highlight">
                                <label>Full Tank Cost</label>
                                <div className="setting-value">Rs. {fullTankCost}</div>
                            </div>

                        </div>

                        {/* Range Bar */}
                        <div style={{marginTop:'25px'}}>
                            <div style={{display:'flex', justifyContent:'space-between', marginBottom:'5px', fontSize:'12px', color:'#8fa2b6'}}>
                                <span>Current Range</span>
                                <span>{range} km</span>
                            </div>
                            <div className="progress-bar-bg">
                                <div className="progress-bar-fill" style={{width: `${fuelPercentage}%`}}></div>
                            </div>
                        </div>
                    </div>

                    {/* 2. OTHER WIDGETS (Grid) */}
                    <div className="vh-grid">
                        
                        {/* Service Reminder */}
                        <div className="vh-card service-card">
                            <div className="vh-icon-box blue"><i className="fas fa-wrench"></i></div>
                            <div className="vh-info">
                                <h3>Next Service</h3>
                                <div className="vh-stat-row">
                                    <span className="big-num">{stats.remainingKm} <small>km</small></span>
                                    <span className="sub-text">Target: {stats.nextServiceDue} km</span>
                                </div>
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
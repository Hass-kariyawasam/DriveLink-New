import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { auth, db, database } from '../firebase';
import { collection, getDocs, doc, getDoc, updateDoc } from 'firebase/firestore';
import { ref, onValue } from 'firebase/database';
import { onAuthStateChanged } from "firebase/auth";
import '../css/vehiclehealth.css';

const VehicleHealth = () => {
    // 1. Data State
    const [data, setData] = useState({
        odometer: 0,
        batteryVolts: 12.0,
        fuelLevel: 0, // Liters
        totalCost: 0,
        totalFuelUsed: 0,
        totalIdleTime: 0,
        totalDuration: 0
    });

    // 2. Settings State
    const [config, setConfig] = useState({
        serviceInterval: 5000, 
        tankCapacity: 50,
        fuelPrice: 380,
        manualOdometer: 0
    });

    const [loading, setLoading] = useState(true);
    const [userUid, setUserUid] = useState(null);
    const [deviceId, setDeviceId] = useState(null);
    const [isConfigOpen, setIsConfigOpen] = useState(false); 

    // --- DATA LOADING ---
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                setUserUid(user.uid);
                try {
                    // Load Settings
                    const userSnap = await getDoc(doc(db, "users", user.uid));
                    if (userSnap.exists()) {
                        const uData = userSnap.data();
                        setDeviceId(uData.deviceId);
                        if (uData.vehicleSettings) setConfig(prev => ({...prev, ...uData.vehicleSettings}));
                    }

                    // Load Trip History
                    const tripSnap = await getDocs(collection(db, `tripReports/${user.uid}/trips`));
                    let tDist = 0, tFuel = 0, tCost = 0, tDur = 0, tMov = 0;

                    tripSnap.forEach(doc => {
                        const d = doc.data();
                        tDist += parseFloat(d.distance || 0);
                        tFuel += parseFloat(d.fuelUsed || 0);
                        tCost += parseFloat(d.cost || 0);
                        tDur += parseFloat(d.totalDuration || 0);
                        tMov += parseFloat(d.movingDuration || 0);
                    });

                    // Update Data State
                    setData(prev => ({
                        ...prev,
                        odometer: Math.max(tDist, parseFloat(config.manualOdometer || 0)),
                        totalCost: tCost,
                        totalFuelUsed: tFuel,
                        totalDuration: tDur,
                        totalIdleTime: Math.max(0, tDur - tMov)
                    }));

                } catch (error) { 
                    console.error("Error loading data:", error); 
                }
                setLoading(false);
            }
        });
        return () => unsubscribe();
    }, [config.manualOdometer]);

    // --- REALTIME SENSORS ---
    useEffect(() => {
        if (deviceId) {
            onValue(ref(database, `${deviceId}/battery_sensor/value`), s => {
                if(s.exists()) setData(p => ({...p, batteryVolts: parseFloat(s.val())}));
            });
            onValue(ref(database, `${deviceId}/fuel_sensor/value`), s => {
                if(s.exists()) setData(p => ({...p, fuelLevel: parseFloat(s.val())}));
            });
        }
    }, [deviceId]);

    // --- SAVE CONFIG ---
    const saveConfig = async () => {
        if (!userUid) return;
        try {
            await updateDoc(doc(db, "users", userUid), {
                vehicleSettings: {
                    serviceInterval: parseFloat(config.serviceInterval),
                    tankCapacity: parseFloat(config.tankCapacity),
                    fuelPrice: parseFloat(config.fuelPrice),
                    manualOdometer: parseFloat(config.manualOdometer)
                }
            });
            alert("Settings Saved!");
            setIsConfigOpen(false);
        } catch (error) { 
            // 🔥 Fixed Error 1: Used 'error' variable
            console.error("Save failed:", error);
            alert("Error saving settings"); 
        }
    };

    // --- CALCULATIONS ---
    const nextServiceAt = (Math.ceil(data.odometer / config.serviceInterval) * config.serviceInterval);
    const kmRemaining = nextServiceAt - data.odometer;
    const serviceProgress = ((config.serviceInterval - kmRemaining) / config.serviceInterval) * 100;
    
    const avgMpg = data.totalFuelUsed > 0 ? (data.odometer / data.totalFuelUsed).toFixed(1) : 0;
    const costPerKm = data.odometer > 0 ? (data.totalCost / data.odometer).toFixed(2) : 0;
    
    const estRange = (data.fuelLevel * avgMpg).toFixed(0);
    // 🔥 Fixed Error 2: fuelPercent is now used in the JSX below
    const fuelPercent = ((data.fuelLevel / config.tankCapacity) * 100).toFixed(0);

    const idlePercent = data.totalDuration > 0 ? ((data.totalIdleTime / data.totalDuration) * 100).toFixed(0) : 0;

    // Health Score
    let healthScore = 100;
    if (kmRemaining < 500) healthScore -= 20; 
    if (data.batteryVolts < 12.2) healthScore -= 15; 
    if (idlePercent > 30) healthScore -= 10; 
    if (avgMpg < 8) healthScore -= 5; 

    if (loading) return <Layout><div style={{padding:'20px', color:'white'}}>Analyzing Vehicle Data...</div></Layout>;

    return (
        <Layout>
            <div className="dashboard-content">
                <div className="main-header">
                    <div className="header-left">
                        <h1>Vehicle Health Monitor</h1>
                        <span className="breadcrumb">Live Diagnostics & Maintenance</span>
                    </div>
                </div>

                <div className="vh-container">
                    
                    {/* --- TOP HERO SECTION --- */}
                    <div className="vh-hero-split">
                        
                        {/* 1. Health Score */}
                        <div className="hero-box main-score">
                            <div className="score-circle-outer">
                                <svg viewBox="0 0 36 36" className="circular-chart">
                                    <path className="circle-bg" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                                    <path className="circle" strokeDasharray={`${healthScore}, 100`} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" stroke={healthScore > 80 ? '#22c55e' : '#f59e0b'} />
                                </svg>
                                <div className="score-text">
                                    <span className="label">Health</span>
                                    <span className="value">{healthScore}%</span>
                                </div>
                            </div>
                            <div className="hero-text">
                                <h3>Overall Condition</h3>
                                <p>{healthScore > 80 ? "Optimal Performance" : "Maintenance Required"}</p>
                            </div>
                        </div>

                        {/* 2. Service Monitor */}
                        <div className="hero-box service-monitor">
                            <div className="service-header">
                                <div className="icon-box"><i className="fas fa-tools"></i></div>
                                <div>
                                    <h3>Service Due</h3>
                                    <span className="sub">Interval: {config.serviceInterval} km</span>
                                </div>
                            </div>
                            <div className="service-bar-container">
                                <div className="service-labels">
                                    <span>Progress</span>
                                    <span>{Math.floor(serviceProgress)}%</span>
                                </div>
                                <div className="progress-track">
                                    <div className="progress-fill" style={{width: `${serviceProgress}%`, background: serviceProgress > 90 ? '#ef4444' : '#3699ff'}}></div>
                                </div>
                                <div className="service-remaining">
                                    <strong>{kmRemaining} km</strong> remaining until service
                                </div>
                            </div>
                        </div>

                    </div>

                    {/* --- WIDGET GRID --- */}
                    <div className="vh-stats-grid">
                        
                        {/* Odometer */}
                        <div className="stat-card">
                            <i className="fas fa-tachometer-alt icon blue"></i>
                            <div>
                                <span className="label">Odometer</span>
                                <span className="value">{parseFloat(data.odometer).toFixed(0)} km</span>
                            </div>
                        </div>

                        {/* Efficiency */}
                        <div className="stat-card">
                            <i className="fas fa-gas-pump icon green"></i>
                            <div>
                                <span className="label">Efficiency</span>
                                <span className="value">{avgMpg} km/L</span>
                            </div>
                        </div>

                        {/* Range (Updated with Fuel %) */}
                        <div className="stat-card">
                            <i className="fas fa-road icon orange"></i>
                            <div>
                                <span className="label">Range ({fuelPercent}%)</span> {/* 🔥 Used here */}
                                <span className="value">{estRange} km</span>
                            </div>
                        </div>

                        {/* Battery */}
                        <div className="stat-card">
                            <i className="fas fa-car-battery icon red"></i>
                            <div>
                                <span className="label">Battery</span>
                                <span className="value">{data.batteryVolts} V</span>
                            </div>
                        </div>

                        {/* Idle Time */}
                        <div className="stat-card">
                            <i className="fas fa-clock icon purple"></i>
                            <div>
                                <span className="label">Idle Time</span>
                                <span className="value">{idlePercent}%</span>
                            </div>
                        </div>

                        {/* Running Cost */}
                        <div className="stat-card">
                            <i className="fas fa-coins icon yellow"></i>
                            <div>
                                <span className="label">Cost/KM</span>
                                <span className="value">Rs. {costPerKm}</span>
                            </div>
                        </div>

                    </div>

                    {/* --- CONFIGURATION --- */}
                    <div className="config-section">
                        <button className="config-toggle-btn" onClick={() => setIsConfigOpen(!isConfigOpen)}>
                            <i className={`fas ${isConfigOpen ? 'fa-chevron-down' : 'fa-cog'}`}></i> 
                            {isConfigOpen ? "Hide Configuration" : "Vehicle Settings & Calibration"}
                        </button>

                        {isConfigOpen && (
                            <div className="config-panel">
                                <div className="input-group">
                                    <label>Service Interval (KM)</label>
                                    <input type="number" value={config.serviceInterval} onChange={(e) => setConfig({...config, serviceInterval: e.target.value})} />
                                    <small>How often do you service?</small>
                                </div>
                                <div className="input-group">
                                    <label>Current Odometer (KM)</label>
                                    <input type="number" value={config.manualOdometer} onChange={(e) => setConfig({...config, manualOdometer: e.target.value})} />
                                    <small>Correct if tracking differs</small>
                                </div>
                                <div className="input-group">
                                    <label>Fuel Tank Size (L)</label>
                                    <input type="number" value={config.tankCapacity} onChange={(e) => setConfig({...config, tankCapacity: e.target.value})} />
                                </div>
                                <div className="input-group">
                                    <label>Fuel Price (Rs/L)</label>
                                    <input type="number" value={config.fuelPrice} onChange={(e) => setConfig({...config, fuelPrice: e.target.value})} />
                                </div>
                                <button className="save-btn" onClick={saveConfig}>Save Changes</button>
                            </div>
                        )}
                    </div>

                </div>
            </div>
        </Layout>
    );
};

export default VehicleHealth;
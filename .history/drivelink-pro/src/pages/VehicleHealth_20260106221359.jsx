import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { auth, db, database } from '../firebase'; 
import { collection, getDocs, doc, getDoc } from 'firebase/firestore'; 
import { ref, onValue } from 'firebase/database'; 
import { onAuthStateChanged } from "firebase/auth";
import '../css/vehiclehealth.css';

const VehicleHealth = () => {
    const [stats, setStats] = useState({
        totalDistance: 0,
        nextServiceDue: 5000,
        remainingKm: 5000,
        healthScore: 95,
        avgConsumption: 0,
        totalIdleTime: 0,
        batteryVoltage: 12.6 
    });
    const [loading, setLoading] = useState(true);
    const [deviceId, setDeviceId] = useState(null); 

    // 1. Get User, Device ID & Trip Data
    useEffect(() => {
        const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
            if (user) {
                try {
                    // 1.1 Get Device ID from User Profile
                    const userDocRef = doc(db, "users", user.uid);
                    const userDocSnap = await getDoc(userDocRef);
                    
                    if (userDocSnap.exists()) {
                        setDeviceId(userDocSnap.data().deviceId); // ✅ මෙතනදී setDeviceId පාවිච්චි වෙනවා
                    }

                    // 1.2 Get Trips
                    const querySnapshot = await getDocs(collection(db, `tripReports/${user.uid}/trips`));
                    
                    let totalDist = 0;
                    let totalFuel = 0;
                    let totalDuration = 0;
                    let totalMoving = 0;
                    
                    querySnapshot.forEach((doc) => {
                        const data = doc.data();
                        totalDist += parseFloat(data.distance || 0);
                        totalFuel += parseFloat(data.fuelUsed || 0);
                        totalDuration += parseFloat(data.totalDuration || 0);
                        totalMoving += parseFloat(data.movingDuration || 0);
                    });

                    // Calculations
                    const serviceInterval = 5000; 
                    const distanceSinceLastService = totalDist % serviceInterval;
                    const remaining = serviceInterval - distanceSinceLastService;
                    
                    const efficiency = totalFuel > 0 ? (totalDist / totalFuel).toFixed(1) : 0;
                    const idleTime = Math.max(0, totalDuration - totalMoving).toFixed(0);

                    // Health Score Logic
                    let score = 100;
                    if (remaining < 1000) score -= 10;
                    if (parseInt(idleTime) > 120) score -= 5;
                    if (parseFloat(efficiency) < 8) score -= 5;

                    setStats(prev => ({
                        ...prev,
                        totalDistance: totalDist.toFixed(2),
                        nextServiceDue: (Math.ceil(totalDist / serviceInterval) * serviceInterval),
                        remainingKm: remaining.toFixed(0),
                        healthScore: score,
                        avgConsumption: efficiency,
                        totalIdleTime: idleTime
                    }));

                } catch (error) {
                    console.error("Error fetching data:", error);
                }
                setLoading(false);
            }
        });
        return () => unsubscribeAuth();
    }, []);

    // 2. Battery Listener (Realtime)
    useEffect(() => {
        if (deviceId) {
            const batRef = ref(database, `${deviceId}/battery_sensor/value`);
            const unsubscribe = onValue(batRef, (snapshot) => {
                if(snapshot.exists()) {
                    setStats(prev => ({...prev, batteryVoltage: snapshot.val()}));
                }
            });
            return () => unsubscribe();
        }
    }, [deviceId]);

    if (loading) {
        return (
            <Layout>
                <div className="dashboard-content">
                    <div style={{color: 'white', padding: '20px', textAlign: 'center'}}>Loading Health Diagnostics...</div>
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="dashboard-content">
                <div className="main-header">
                    <div className="header-left">
                        <h1>Vehicle Health</h1>
                        <span className="breadcrumb">Diagnostics & Maintenance</span>
                    </div>
                </div>

                <div className="vh-container">
                    
                    {/* 1. Health Score Hero Card */}
                    <div className="vh-hero-card">
                        <div className="score-ring-container">
                            <svg className="progress-ring" width="120" height="120">
                                <circle className="progress-ring__circle" stroke={stats.healthScore > 80 ? "#22c55e" : "#f59e0b"} strokeWidth="8" fill="transparent" r="52" cx="60" cy="60"/>
                            </svg>
                            <div className="score-value">
                                <h1>{stats.healthScore}%</h1>
                                <span>Health</span>
                            </div>
                        </div>
                        <div className="hero-details">
                            <h2>Overall Condition</h2>
                            <p>{stats.healthScore > 80 ? "Your vehicle is in great shape." : "Scheduled maintenance recommended."}</p>
                            <div className="total-odo">
                                <i className="fas fa-tachometer-alt"></i> Odometer: <strong>{stats.totalDistance} km</strong>
                            </div>
                        </div>
                    </div>

                    {/* 2. Widgets Grid */}
                    <div className="vh-grid">
                        
                        {/* Service Reminder */}
                        <div className="vh-card service-card">
                            <div className="vh-icon-box blue">
                                <i className="fas fa-wrench"></i>
                            </div>
                            <div className="vh-info">
                                <h3>Next Service</h3>
                                <div className="progress-bar-bg">
                                    <div className="progress-bar-fill" style={{width: `${(stats.remainingKm / 5000) * 100}%`}}></div>
                                </div>
                                <div className="vh-stat-row">
                                    <span className="big-num">{stats.remainingKm} <small>km</small></span>
                                    <span className="sub-text">Target: {stats.nextServiceDue} km</span>
                                </div>
                            </div>
                        </div>

                        {/* Engine Efficiency */}
                        <div className="vh-card">
                            <div className="vh-icon-box green">
                                <i className="fas fa-gas-pump"></i>
                            </div>
                            <div className="vh-info">
                                <h3>Engine Efficiency</h3>
                                <span className="big-num">{stats.avgConsumption} <small>km/L</small></span>
                                <p className="sub-text" style={{color:'#22c55e'}}>Based on recent trips</p>
                            </div>
                        </div>

                        {/* Idling Time */}
                        <div className="vh-card">
                            <div className="vh-icon-box orange">
                                <i className="fas fa-hourglass-half"></i>
                            </div>
                            <div className="vh-info">
                                <h3>Total Idle Time</h3>
                                <span className="big-num">{stats.totalIdleTime} <small>min</small></span>
                                <p className="sub-text">Engine run without moving</p>
                            </div>
                        </div>

                        {/* Battery Status */}
                        <div className="vh-card">
                            <div className="vh-icon-box red">
                                <i className="fas fa-car-battery"></i>
                            </div>
                            <div className="vh-info">
                                <h3>Battery Voltage</h3>
                                <span className="big-num">{stats.batteryVoltage} <small>V</small></span>
                                <p className="sub-text" style={{color: stats.batteryVoltage > 12 ? '#22c55e' : '#ef4444'}}>
                                    {stats.batteryVoltage > 12 ? 'Good Condition' : 'Check Battery'}
                                </p>
                            </div>
                        </div>

                    </div>

                </div>
            </div>
        </Layout>
    );
};

export default VehicleHealth;
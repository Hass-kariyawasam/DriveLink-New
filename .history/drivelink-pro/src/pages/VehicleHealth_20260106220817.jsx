import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { auth, db } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';
import { onAuthStateChanged } from "firebase/auth";
import '../css/vehiclehealth.css';

const VehicleHealth = () => {
    const [stats, setStats] = useState({
        totalDistance: 0,
        nextServiceDue: 5000,
        remainingKm: 5000,
        healthScore: 100
    });
    
    // loading state එක හඳුන්වා දීම
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                try {
                    // Firebase එකෙන් Trips ගන්නවා
                    const querySnapshot = await getDocs(collection(db, `tripReports/${user.uid}/trips`));
                    
                    let totalDist = 0;
                    
                    querySnapshot.forEach((doc) => {
                        const data = doc.data();
                        totalDist += parseFloat(data.distance || 0);
                    });

                    // Service Logic
                    const serviceInterval = 5000; 
                    const distanceSinceLastService = totalDist % serviceInterval;
                    const remaining = serviceInterval - distanceSinceLastService;
                    
                    // Health Score Logic
                    let score = 100;
                    if (remaining < 1000) score -= 10;
                    if (remaining < 500) score -= 20;

                    setStats({
                        totalDistance: totalDist.toFixed(2),
                        nextServiceDue: (Math.ceil(totalDist / serviceInterval) * serviceInterval),
                        remainingKm: remaining.toFixed(0),
                        healthScore: score
                    });

                } catch (error) {
                    console.error("Error fetching health stats:", error);
                }
                setLoading(false); // දත්ත ලැබුණු පසු loading නවත්වනවා
            }
        });
        return () => unsubscribe();
    }, []);

    // 🔥 FIX: Loading එක පාවිච්චි කරන කොටස
    if (loading) {
        return (
            <Layout>
                <div className="dashboard-content">
                    <div style={{color: 'white', padding: '20px', textAlign: 'center'}}>
                        Loading Diagnostics...
                    </div>
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
                    
                    {/* 1. Health Score Card */}
                    <div className="vh-hero-card">
                        <div className="score-ring-container">
                            <svg className="progress-ring" width="120" height="120">
                                <circle className="progress-ring__circle" stroke={stats.healthScore > 80 ? "#22c55e" : "#f59e0b"} strokeWidth="8" fill="transparent" r="52" cx="60" cy="60"/>
                            </svg>
                            <div className="score-value">
                                <h1>{stats.healthScore}%</h1>
                                <span>Condition</span>
                            </div>
                        </div>
                        <div className="hero-details">
                            <h2>Overall Vehicle Health</h2>
                            <p>{stats.healthScore > 80 ? "Excellent Condition. Keep it up!" : "Attention Needed soon."}</p>
                            <div className="total-odo">
                                <i className="fas fa-road"></i> Total Odometer: <strong>{stats.totalDistance} km</strong>
                            </div>
                        </div>
                    </div>

                    {/* 2. Service Reminder Widget */}
                    <div className="vh-grid">
                        <div className="vh-card service-card">
                            <div className="vh-icon-box blue">
                                <i className="fas fa-wrench"></i>
                            </div>
                            <div className="vh-info">
                                <h3>Next Service In</h3>
                                <div className="progress-bar-bg">
                                    <div className="progress-bar-fill" style={{width: `${(stats.remainingKm / 5000) * 100}%`}}></div>
                                </div>
                                <div className="vh-stat-row">
                                    <span className="big-num">{stats.remainingKm} <small>km</small></span>
                                    <span className="sub-text">Target: {stats.nextServiceDue} km</span>
                                </div>
                            </div>
                        </div>
                        
                    </div>

                </div>
            </div>
        </Layout>
    );
};

export default VehicleHealth;
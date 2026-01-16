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
        batteryVoltage: 12.6,
        currentFuelLitters: 0, // In Liters
        runningCost: 0
    });
    
    const [loading, setLoading] = useState(true);
    const [deviceId, setDeviceId] = useState(null);
    
    // Animation State for Fuel
    const [animatedFuel, setAnimatedFuel] = useState(0);

    // Tank Settings
    const tankCapacity = 50; // Liters
    const fuelPrice = 380; // Rs.

    // 1. Fetch Data
    useEffect(() => {
        const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
            if (user) {
                try {
                    // Get Device ID
                    const userDocRef = doc(db, "users", user.uid);
                    const userDocSnap = await getDoc(userDocRef);
                    if (userDocSnap.exists()) {
                        setDeviceId(userDocSnap.data().deviceId);
                    }

                    // Get Trips
                    const querySnapshot = await getDocs(collection(db, `tripReports/${user.uid}/trips`));
                    
                    let totalDist = 0;
                    let totalFuel = 0;
                    let totalDuration = 0;
                    let totalMoving = 0;
                    let totalCost = 0;
                    
                    querySnapshot.forEach((doc) => {
                        const data = doc.data();
                        totalDist += parseFloat(data.distance || 0);
                        totalFuel += parseFloat(data.fuelUsed || 0);
                        totalDuration += parseFloat(data.totalDuration || 0);
                        totalMoving += parseFloat(data.movingDuration || 0);
                        totalCost += parseFloat(data.cost || 0);
                    });

                    // Logic
                    const serviceInterval = 5000; 
                    const distanceSinceLastService = totalDist % serviceInterval;
                    const remaining = serviceInterval - distanceSinceLastService;
                    
                    const efficiency = totalFuel > 0 ? (totalDist / totalFuel).toFixed(1) : 12;
                    const idleTime = Math.max(0, totalDuration - totalMoving).toFixed(0);
                    const costPerKm = totalDist > 0 ? (totalCost / totalDist).toFixed(2) : 0;

                    // Health Score
                    let score = 100;
                    if (remaining < 1000) score -= 10;
                    if (parseInt(idleTime) > 120) score -= 5;

                    setStats(prev => ({
                        ...prev,
                        totalDistance: totalDist.toFixed(2),
                        nextServiceDue: (Math.ceil(totalDist / serviceInterval) * serviceInterval),
                        remainingKm: remaining.toFixed(0),
                        healthScore: score,
                        avgConsumption: efficiency,
                        totalIdleTime: idleTime,
                        runningCost: costPerKm
                    }));

                } catch (error) {
                    console.error("Error:", error);
                }
                setLoading(false);
            }
        });
        return () => unsubscribeAuth();
    }, []);

    // 2. Realtime Fuel & Battery
    useEffect(() => {
        if (deviceId) {
            // Battery
            const batRef = ref(database, `${deviceId}/battery_sensor/value`);
            const unsubBat = onValue(batRef, (snapshot) => {
                if(snapshot.exists()) {
                    setStats(prev => ({...prev, batteryVoltage: snapshot.val()}));
                }
            });

            // Fuel
            const fuelRef = ref(database, `${deviceId}/fuel_sensor/value`);
            const unsubFuel = onValue(fuelRef, (snapshot) => {
                if(snapshot.exists()) {
                    setStats(prev => ({...prev, currentFuelLitters: parseFloat(snapshot.val())}));
                }
            });

            return () => { unsubBat(); unsubFuel(); };
        }
    }, [deviceId]);

    // 3. Animate Fuel
    useEffect(() => {
        const percentage = (stats.currentFuelLitters / tankCapacity) * 100;
        const timer = setTimeout(() => {
            setAnimatedFuel(Math.min(100, Math.max(0, percentage)));
        }, 100);
        return () => clearTimeout(timer);
    }, [stats.currentFuelLitters]);

    // Calculations for Widgets
    const fuelPercentage = ((stats.currentFuelLitters / tankCapacity) * 100).toFixed(0);
    const range = (stats.currentFuelLitters * stats.avgConsumption).toFixed(0);
    const fuelValue = (stats.currentFuelLitters * fuelPrice).toFixed(0);

    // Fuel Color Logic
    let fuelColor = "linear-gradient(180deg, #1bc5bd 0%, #0e8074 100%)"; // Green
    if (fuelPercentage < 15) fuelColor = "linear-gradient(180deg, #f64e60 0%, #c43347 100%)"; // Red
    else if (fuelPercentage < 40) fuelColor = "linear-gradient(180deg, #ffa800 0%, #cc8600 100%)"; // Orange

    if (loading) {
        return <Layout><div style={{color:'white', padding:'20px', textAlign:'center'}}>Loading Diagnostics...</div></Layout>;
    }

    return (
        <Layout>
            <div className="dashboard-content">
                <div className="main-header">
                    <div className="header-left">
                        <h1>Vehicle Health</h1>
                        <span className="breadcrumb">Real-time Diagnostics</span>
                    </div>
                </div>

                <div className="vh-container">
                    
                    <div className="vh-grid">
                        
                        {/* 1. FUEL LEVEL WIDGET (From your code) */}
                        <div className="vh-fuel-card" style={{gridRow: 'span 2'}}>
                            <div className="widget-header">
                                <h2><i className="fas fa-gas-pump" style={{color: '#3699ff'}}></i> Fuel Monitor</h2>
                                <span className="status-badge" style={{background: 'rgba(54, 153, 255, 0.1)', color: '#3699ff'}}>
                                    {fuelPercentage < 20 ? 'Low' : 'Good'}
                                </span>
                            </div>

                            <div style={{display: 'flex', justifyContent: 'center', margin: '20px 0'}}>
                                <div className="fuel-tank-circle">
                                    <div className="fuel-fill" style={{height: `${animatedFuel}%`, background: fuelColor}}>
                                        <div className="fuel-wave-overlay"></div>
                                    </div>
                                    <div className="fuel-text-center">
                                        <div className="fuel-percent">{fuelPercentage}<small>%</small></div>
                                        <div className="fuel-label">LEVEL</div>
                                    </div>
                                    {fuelPercentage < 15 && <div className="fuel-glow"></div>}
                                </div>
                            </div>

                            <div className="fuel-details-grid">
                                <div className="fuel-detail-item">
                                    <span>Volume</span>
                                    <strong>{stats.currentFuelLitters.toFixed(1)} <small>L</small></strong>
                                </div>
                                <div className="fuel-detail-item">
                                    <span>Range</span>
                                    <strong>{range} <small>km</small></strong>
                                </div>
                                <div className="fuel-detail-item full-width">
                                    <span>Value</span>
                                    <strong style={{color: '#1bc5bd'}}>Rs. {Number(fuelValue).toLocaleString()}</strong>
                                </div>
                            </div>
                        </div>

                        {/* 2. NEXT SERVICE WIDGET (Updated Visuals) */}
                        <div className="vh-card service-card">
                            <div className="service-header">
                                <div className="vh-icon-box blue"><i className="fas fa-wrench"></i></div>
                                <div className="service-title">
                                    <h3>Next Service</h3>
                                    <span>Target: {stats.nextServiceDue} km</span>
                                </div>
                            </div>
                            
                            <div className="service-body">
                                <div className="service-stat">
                                    <span className="big-num">{stats.remainingKm} <small>km</small></span>
                                    <span className="sub-text">Remaining</span>
                                </div>
                                <div className="service-progress-container">
                                    <svg viewBox="0 0 36 36" className="circular-chart blue">
                                        <path className="circle-bg" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                                        <path className="circle" 
                                            strokeDasharray={`${(stats.remainingKm / 5000) * 100}, 100`} 
                                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" 
                                        />
                                    </svg>
                                    <i className="fas fa-car-side service-icon-center"></i>
                                </div>
                            </div>
                        </div>

                        {/* 3. HEALTH SCORE */}
                        <div className="vh-card">
                            <div className="vh-icon-box green"><i className="fas fa-heartbeat"></i></div>
                            <div className="vh-info">
                                <h3>Health Score</h3>
                                <span className="big-num">{stats.healthScore}%</span>
                                <p className="sub-text" style={{color: stats.healthScore > 80 ? '#22c55e' : '#f59e0b'}}>
                                    {stats.healthScore > 80 ? 'Excellent' : 'Attention'}
                                </p>
                            </div>
                        </div>

                        {/* 4. COST EFFICIENCY */}
                        <div className="vh-card">
                            <div className="vh-icon-box orange"><i className="fas fa-coins"></i></div>
                            <div className="vh-info">
                                <h3>Running Cost</h3>
                                <span className="big-num">Rs. {stats.runningCost} <small>/km</small></span>
                                <p className="sub-text">Based on history</p>
                            </div>
                        </div>

                        {/* 5. BATTERY */}
                        <div className="vh-card">
                            <div className="vh-icon-box red"><i className="fas fa-car-battery"></i></div>
                            <div className="vh-info">
                                <h3>Battery</h3>
                                <span className="big-num">{stats.batteryVoltage} <small>V</small></span>
                                <p className="sub-text" style={{color: stats.batteryVoltage > 12 ? '#22c55e' : '#ef4444'}}>
                                    {stats.batteryVoltage > 12 ? 'Good' : 'Weak'}
                                </p>
                            </div>
                        </div>

                    </div>

                    {/* Inline CSS for specific animations */}
                    <style>{`
                        /* Fuel Tank Styles */
                        .fuel-tank-circle {
                            width: 160px; height: 160px; border-radius: 50%;
                            border: 5px solid rgba(255,255,255,0.1);
                            background: linear-gradient(145deg, #1a1a27, #252538);
                            position: relative; overflow: hidden;
                            box-shadow: inset 0 0 30px rgba(0,0,0,0.6);
                        }
                        .fuel-fill {
                            position: absolute; bottom: 0; left: 0; width: 100%;
                            transition: height 1s ease; border-radius: 0 0 50% 50%;
                        }
                        .fuel-wave-overlay {
                            position: absolute; top: -10px; left: 0; width: 200%; height: 20px;
                            background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 800 88.7'%3E%3Cpath d='M800 56.9c-155.5 0-204.9-50-405.5-49.9-200 0-250 49.9-394.5 49.9v31.8h800v-.2-31.6z' fill='%23ffffff' fill-opacity='0.2'/%3E%3C/svg%3E");
                            background-size: 400px 20px; animation: wave 8s linear infinite; opacity: 0.3;
                        }
                        .fuel-text-center {
                            position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
                            text-align: center; z-index: 10; text-shadow: 0 2px 5px rgba(0,0,0,0.5);
                        }
                        .fuel-percent { font-size: 36px; font-weight: 800; color: white; line-height: 1; }
                        .fuel-percent small { font-size: 18px; }
                        .fuel-label { font-size: 10px; letter-spacing: 1px; color: rgba(255,255,255,0.7); margin-top: 5px; }
                        .fuel-glow {
                            position: absolute; inset: 0;
                            background: radial-gradient(circle, rgba(246,78,96,0.2) 0%, transparent 70%);
                            animation: pulse 2s infinite;
                        }
                        
                        /* Fuel Details Grid */
                        .fuel-details-grid {
                            display: grid; grid-template-columns: 1fr 1fr; gap: 10px;
                            background: rgba(255,255,255,0.03); padding: 15px; border-radius: 12px;
                        }
                        .fuel-detail-item { text-align: center; display: flex; flex-direction: column; }
                        .fuel-detail-item span { font-size: 11px; color: #8fa2b6; text-transform: uppercase; }
                        .fuel-detail-item strong { font-size: 16px; color: white; }
                        .fuel-detail-item.full-width { grid-column: span 2; border-top: 1px dashed rgba(255,255,255,0.1); padding-top: 8px; margin-top: 5px; }

                        /* Circular Progress for Service */
                        .service-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; }
                        .service-title h3 { margin: 0; font-size: 14px; color: #fff; }
                        .service-title span { font-size: 11px; color: #8fa2b6; }
                        .service-body { display: flex; justify-content: space-between; align-items: center; }
                        .service-progress-container { position: relative; width: 70px; height: 70px; }
                        .circular-chart { display: block; margin: 0 auto; max-width: 80%; max-height: 250px; }
                        .circle-bg { fill: none; stroke: rgba(255,255,255,0.1); stroke-width: 2.5; }
                        .circle { fill: none; stroke-width: 2.5; stroke-linecap: round; animation: progress 1s ease-out forwards; }
                        .circular-chart.blue .circle { stroke: #3699ff; }
                        .service-icon-center { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); color: #8fa2b6; font-size: 16px; }

                        @keyframes wave { 0% { transform: translateX(0); } 100% { transform: translateX(-400px); } }
                        @keyframes pulse { 0%, 100% { opacity: 0.5; } 50% { opacity: 1; } }
                        @keyframes progress { 0% { stroke-dasharray: 0 100; } }
                    `}</style>

                </div>
            </div>
        </Layout>
    );
};

export default VehicleHealth;
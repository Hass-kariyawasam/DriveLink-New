import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { auth, db, database } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { ref, onValue, set } from 'firebase/database';
import '../css/dashboardstyle.css';

const Dashboard = () => {
  const [userData, setUserData] = useState(null);
  const [vehicleData, setVehicleData] = useState(null);
  const [sensorData, setSensorData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch User & Vehicle Config
  useEffect(() => {
    const fetchUserData = async () => {
      const user = auth.currentUser;
      if (user) {
        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          const data = userSnap.data();
          setUserData(data);

          // Fetch vehicle thresholds (min/max fuel)
          if (data.vehicleType) {
            // Note: In your code this was in a "vehicle" collection
            // You might need to adjust this depending on your actual Firestore structure
             // For now, I'll mock these values or you can fetch them if you have that collection setup
            setVehicleData({
                minLevel: 10, // Example defaults
                maxLevel: 100,
                tankVolume: 50
            });
          }
        }
      }
    };
    fetchUserData();
  }, []);

  // Real-time Listener
  useEffect(() => {
    if (userData?.deviceId) {
      const deviceRef = ref(database, userData.deviceId);
      const unsubscribe = onValue(deviceRef, (snapshot) => {
        if (snapshot.exists()) {
          setSensorData(snapshot.val());
        }
        setLoading(false);
      });
      return () => unsubscribe();
    }
  }, [userData]);

  // Toggle Relays
  const toggleRelay = (relayName, currentStatus) => {
    if (userData?.deviceId) {
      set(ref(database, `${userData.deviceId}/${relayName}/status`), !currentStatus);
    }
  };

  if (loading) return <Layout><div style={{color:'white'}}>Loading Dashboard...</div></Layout>;

  return (
    <Layout>
      <div className="dashboard-content">
        <div className="header-welcome">
          <h1>Hi, {userData?.username || 'User'}!</h1>
          <p>Device ID: {userData?.deviceId}</p>
        </div>

        {/* Top Stats Row */}
        <div className="stats-row">
           {/* Engine Temp */}
           <div className="stat-card">
              <div className="stat-info">
                  <h3>Engine Temp</h3>
                  <p>{sensorData?.temperature?.value ? sensorData.temperature.value.toFixed(1) + '°C' : '--'}</p>
              </div>
              <div className="stat-icon"><i className="fas fa-thermometer-half"></i></div>
           </div>
           
           {/* Vehicle Status */}
           <div className="stat-card">
              <div className="stat-info">
                  <h3>Status</h3>
                  <p style={{color: '#5cb85c'}}>Online</p>
              </div>
              <div className="stat-icon"><i className="fas fa-wifi"></i></div>
           </div>

           {/* Battery Voltage */}
           <div className="stat-card">
              <div className="stat-info">
                  <h3>Battery</h3>
                  <p>{sensorData?.battery?.value ? sensorData.battery.value + ' V' : '--'}</p>
              </div>
              <div className="stat-icon"><i className="fas fa-car-battery"></i></div>
           </div>
           
            {/* Last Update */}
           <div className="stat-card">
              <div className="stat-info">
                  <h3>Last Update</h3>
                  <p>{new Date().toLocaleTimeString()}</p>
              </div>
              <div className="stat-icon"><i className="fas fa-clock"></i></div>
           </div>
        </div>

        <div className="dashboard-widgets">
          {/* Fuel Widget */}
          <FuelWidget sensorData={sensorData} vehicleData={vehicleData} />
          
          {/* Battery Widget */}
          <BatteryWidget sensorData={sensorData} />

          {/* Controls Widget */}
          <div className="widget status-widget">
            <div className="widget-header">
                <h2>Controls</h2>
            </div>
            <div className="widget-content">
                <div className="status-items">
                    <div className="status-item" style={{justifyContent:'space-between'}}>
                        <span>Relay 1</span>
                        <label className="switch">
                            <input 
                                type="checkbox" 
                                checked={sensorData?.relay1?.status || false}
                                onChange={() => toggleRelay('relay1', sensorData?.relay1?.status)}
                            />
                            <span className="slider round"></span>
                        </label>
                    </div>
                    <div className="status-item" style={{justifyContent:'space-between'}}>
                        <span>Relay 2</span>
                        <label className="switch">
                            <input 
                                type="checkbox" 
                                checked={sensorData?.relay2?.status || false}
                                onChange={() => toggleRelay('relay2', sensorData?.relay2?.status)}
                            />
                            <span className="slider round"></span>
                        </label>
                    </div>
                </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

// -- Mini Components for Widgets (You can move these to separate files) --

const FuelWidget = ({ sensorData, vehicleData }) => {
    // Calculate logic
    const currentLevel = sensorData?.fuel_sensor?.value || 0;
    const min = vehicleData?.minLevel || 0;
    const max = vehicleData?.maxLevel || 100;
    
    let percentage = ((currentLevel - min) / (max - min)) * 100;
    percentage = Math.max(0, Math.min(100, percentage));

    return (
        <div className="widget fuel-widget">
            <div className="widget-header"><h2>Fuel Level</h2></div>
            <div className="widget-content">
                <div className="fuel-container">
                    <div className="water" style={{ height: `${percentage}%` }}>
                        <div className="wave"></div>
                        <div className="wave"></div>
                    </div>
                    <div className="fuel-text">{percentage.toFixed(0)}%</div>
                </div>
                <div className="fuel-details">
                    <div className="detail-item">
                        <span className="label">Volume</span>
                        <span className="value">{((percentage/100)*50).toFixed(1)} L</span>
                    </div>
                    <div className="detail-item">
                        <span className="label">Range</span>
                        <span className="value">~{Math.round(((percentage/100)*50)*10)} km</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

const BatteryWidget = ({ sensorData }) => {
    const voltage = sensorData?.battery?.value || 0;
    // Simple 12V battery percentage calc
    let percentage = ((voltage - 11.8) / 0.9) * 100;
    percentage = Math.max(0, Math.min(100, percentage));
    
    return (
        <div className="widget battery-widget">
            <div className="widget-header"><h2>Battery Health</h2></div>
            <div className="widget-content">
                 <div className="battery-body">
                    <div className="charge" style={{ height: `${percentage}%` }}></div>
                    <div style={{zIndex:2, position:'absolute', color: percentage > 50 ? 'white' : 'black', fontWeight:'bold'}}>
                        {Math.round(percentage)}%
                    </div>
                 </div>
                 <div className="battery-details" style={{marginTop:'15px'}}>
                    <div className="detail-item">
                        <span className="label">Voltage</span>
                        <span className="value">{voltage} V</span>
                    </div>
                    <div className="detail-item">
                        <span className="label">Health</span>
                        <span className="value" style={{color: voltage > 12.4 ? '#5cb85c' : '#d9534f'}}>
                            {voltage > 12.4 ? 'Good' : 'Weak'}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
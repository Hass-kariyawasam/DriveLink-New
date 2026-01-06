import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { auth, db, database } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { ref, onValue, set } from 'firebase/database';

const Dashboard = () => {
  const [userData, setUserData] = useState(null);
  const [sensorData, setSensorData] = useState(null);
  const [loading, setLoading] = useState(true);

  // 1. User Data සහ Device ID ලබා ගැනීම
  useEffect(() => {
    const fetchUserData = async () => {
      const user = auth.currentUser;
      if (user) {
        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          setUserData(userSnap.data());
        }
      }
    };
    fetchUserData();
  }, []);

  // 2. Real-time Sensor Data ලබා ගැනීම (Firebase Realtime DB)
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

  // Relay On/Off කිරීමේ Function එක
  const toggleRelay = (relayName, currentStatus) => {
    if (userData?.deviceId) {
      set(ref(database, `${userData.deviceId}/${relayName}/status`), !currentStatus);
    }
  };

  if (loading && !userData) return <div style={{color:'white', padding:'20px'}}>Loading Dashboard...</div>;

  return (
    <Layout>
      <div className="dashboard-content">
        {/* Header */}
        <div className="header-welcome" style={{marginBottom:'20px'}}>
          <h1>Hi, {userData?.username || 'User'}!</h1>
          <p style={{color:'#888'}}>Device ID: {userData?.deviceId}</p>
        </div>

        {/* Stats Row */}
        <div className="stats-row">
           <StatCard 
             title="Engine Temp" 
             value={sensorData?.temperature?.value ? sensorData.temperature.value.toFixed(1) + '°C' : '--'} 
             icon="fa-thermometer-half" 
           />
           <StatCard 
             title="Status" 
             value="Online" 
             icon="fa-wifi" 
             color="#5cb85c" 
           />
           <StatCard 
             title="Battery" 
             value={sensorData?.battery?.value ? sensorData.battery.value + ' V' : '--'} 
             icon="fa-car-battery" 
           />
           <StatCard 
             title="Last Update" 
             value={new Date().toLocaleTimeString()} 
             icon="fa-clock" 
           />
        </div>

        <div className="dashboard-widgets">
          {/* Fuel Widget */}
          <FuelWidget sensorData={sensorData} />
          
          {/* Battery Widget */}
          <BatteryWidget sensorData={sensorData} />

          {/* Controls Widget */}
          <div className="widget status-widget">
            <div className="widget-header">
                <h2>Controls</h2>
            </div>
            <div className="widget-content">
                <RelaySwitch 
                  label="Relay 1" 
                  checked={sensorData?.relay1?.status || false} 
                  onChange={() => toggleRelay('relay1', sensorData?.relay1?.status)}
                />
                <RelaySwitch 
                  label="Relay 2" 
                  checked={sensorData?.relay2?.status || false} 
                  onChange={() => toggleRelay('relay2', sensorData?.relay2?.status)}
                />
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

// -- පොඩි Components (Widgets) --

// Stat Card Component
const StatCard = ({ title, value, icon, color }) => (
  <div className="stat-card">
    <div className="stat-info">
        <h3>{title}</h3>
        <p style={{color: color || 'inherit'}}>{value}</p>
    </div>
    <div className="stat-icon"><i className={`fas ${icon}`}></i></div>
  </div>
);

// Fuel Widget Component
const FuelWidget = ({ sensorData }) => {
    const currentLevel = sensorData?.fuel_sensor?.value || 0;
    // මෙතන Min/Max අගයන් වෙනස් කරගන්න පුළුවන්
    const min = 0; 
    const max = 100;
    
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
                    <div className="fuel-text" style={{zIndex: 5, position:'relative'}}>{percentage.toFixed(0)}%</div>
                </div>
                <div className="fuel-details">
                    <div className="detail-item">
                        <span className="label">Volume</span>
                        <span className="value">{((percentage/100)*50).toFixed(1)} L</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Battery Widget Component
const BatteryWidget = ({ sensorData }) => {
    const voltage = sensorData?.battery?.value || 0;
    let percentage = ((voltage - 11.8) / 0.9) * 100;
    percentage = Math.max(0, Math.min(100, percentage));
    
    return (
        <div className="widget battery-widget">
            <div className="widget-header"><h2>Battery Health</h2></div>
            <div className="widget-content">
                 <div className="battery-body">
                    <div className="charge" style={{ height: `${percentage}%`, background: percentage > 20 ? '#06e690' : 'red' }}></div>
                    <div style={{zIndex:2, position:'absolute', top:'40%', width:'100%', textAlign:'center', fontWeight:'bold', color: percentage > 50 ? 'white' : 'white'}}>
                        {Math.round(percentage)}%
                    </div>
                 </div>
                 <div className="battery-details" style={{marginTop:'15px'}}>
                    <div className="detail-item">
                        <span className="label">Voltage</span>
                        <span className="value">{voltage} V</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Relay Switch Component
const RelaySwitch = ({ label, checked, onChange }) => (
    <div className="status-item" style={{display:'flex', justifyContent:'space-between', marginBottom:'15px', background:'#111', padding:'10px', borderRadius:'8px'}}>
        <span>{label}</span>
        <label className="switch" style={{position:'relative', display:'inline-block', width:'50px', height:'24px'}}>
            <input 
                type="checkbox" 
                checked={checked}
                onChange={onChange}
                style={{opacity:0, width:0, height:0}}
            />
            <span className="slider round" style={{
                position:'absolute', cursor:'pointer', top:0, left:0, right:0, bottom:0, 
                backgroundColor: checked ? '#06e690' : '#ccc', transition:'.4s', borderRadius:'34px'
            }}>
                <span style={{
                    position:'absolute', content:"", height:'16px', width:'16px', left:'4px', bottom:'4px', 
                    backgroundColor:'white', transition:'.4s', borderRadius:'50%',
                    transform: checked ? 'translateX(26px)' : 'translateX(0)'
                }}></span>
            </span>
        </label>
    </div>
);

export default Dashboard;
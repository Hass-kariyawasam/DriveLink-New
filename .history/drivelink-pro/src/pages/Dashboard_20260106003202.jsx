import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { auth, db, database } from '../firebase';
import { onAuthStateChanged } from "firebase/auth"; // Auth State එක බලන්න
import { doc, getDoc } from 'firebase/firestore';
import { ref, onValue, set } from 'firebase/database';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const [userData, setUserData] = useState(null);
  const [sensorData, setSensorData] = useState(null);
  const [loading, setLoading] = useState(true); // මුලින්ම Loading...
  const navigate = useNavigate();

  // 1. User සහ Device ID ලබා ගැනීම (නිවැරදි ක්‍රමය)
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // User කෙනෙක් ඉන්නවා නම් Firestore එකෙන් විස්තර ගන්න
        try {
          const userRef = doc(db, "users", user.uid);
          const userSnap = await getDoc(userRef);

          if (userSnap.exists()) {
            setUserData(userSnap.data());
          } else {
            console.log("No such document!");
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
        }
      } else {
        // User කෙනෙක් නැත්නම් Login එකට යවන්න
        navigate('/login');
      }
      // User හිටියත් නැතත් Loading එක නවත්වන්න (නැත්නම් දිගටම කැරකෙයි)
      // හැබැයි userData ආවට පස්සේ තමයි dashboard පෙන්නන්නේ
    });

    return () => unsubscribeAuth();
  }, [navigate]);

  // 2. Real-time Sensor Data ලබා ගැනීම
  useEffect(() => {
    if (userData?.deviceId) {
      const deviceRef = ref(database, userData.deviceId);
      
      const unsubscribeDevice = onValue(deviceRef, (snapshot) => {
        if (snapshot.exists()) {
          setSensorData(snapshot.val());
        }
        setLoading(false); // Data ආවම Loading අයින් කරන්න
      });

      return () => unsubscribeDevice();
    } else if (userData) {
        // User ඉන්නවා ඒත් Device ID නෑ (Loading නවත්තන්න)
        setLoading(false);
    }
  }, [userData]);

  // Relay Function
  const toggleRelay = (relayName, currentStatus) => {
    if (userData?.deviceId) {
      set(ref(database, `${userData.deviceId}/${relayName}/status`), !currentStatus);
    } else {
        alert("No Device ID found!");
    }
  };

  // Loading Screen
  if (loading) {
      return (
        <div style={{
            display:'flex', justifyContent:'center', alignItems:'center', 
            height:'100vh', backgroundColor:'#11121a', color:'white', flexDirection:'column'
        }}>
            <h2>Loading Dashboard...</h2>
            <p>Please wait while we fetch your data.</p>
        </div>
      );
  }

  return (
    <Layout>
      <div className="dashboard-content">
        {/* Header */}
        <div className="header-welcome" style={{marginBottom:'20px'}}>
          <h1>Hi, {userData?.username || 'User'}!</h1>
          <p style={{color:'#888'}}>Device ID: {userData?.deviceId || 'Not Connected'}</p>
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
             value={sensorData ? "Online" : "Offline"} 
             icon="fa-wifi" 
             color={sensorData ? "#5cb85c" : "#d9534f"} 
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

// --- Widgets ---

const StatCard = ({ title, value, icon, color }) => (
  <div className="stat-card">
    <div className="stat-info">
        <h3>{title}</h3>
        <p style={{color: color || 'inherit'}}>{value}</p>
    </div>
    <div className="stat-icon"><i className={`fas ${icon}`}></i></div>
  </div>
);

const FuelWidget = ({ sensorData }) => {
    const currentLevel = sensorData?.fuel_sensor?.value || 0;
    const min = 0; const max = 100;
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
                    <div style={{zIndex:2, position:'absolute', top:'40%', width:'100%', textAlign:'center', fontWeight:'bold', color: 'white'}}>
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
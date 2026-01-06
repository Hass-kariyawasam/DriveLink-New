import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { auth, db, database } from '../firebase';
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from 'firebase/firestore';
import { ref, onValue, set } from 'firebase/database';
import { useNavigate } from 'react-router-dom';

// 👇 Widgets Import කරගන්න
import StatCard from '../components/widgets/StatCard';
import FuelWidget from '../components/widgets/FuelWidget';
import BatteryWidget from '../components/widgets/BatteryWidget';
import ControlWidget from '../components/widgets/ControlWidget';
import StatusWidget from '../components/widgets/StatusWidget';

const Dashboard = () => {
  const [userData, setUserData] = useState(null);
  const [sensorData, setSensorData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // 1. User & Device Data Fetching
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const userRef = doc(db, "users", user.uid);
          const userSnap = await getDoc(userRef);
          if (userSnap.exists()) {
            setUserData(userSnap.data());
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
        }
      } else {
        navigate('/login');
      }
    });
    return () => unsubscribeAuth();
  }, [navigate]);

  // 2. Real-time Sensor Data
  useEffect(() => {
    if (userData?.deviceId) {
      const deviceRef = ref(database, userData.deviceId);
      const unsubscribeDevice = onValue(deviceRef, (snapshot) => {
        if (snapshot.exists()) {
          setSensorData(snapshot.val());
        }
        setLoading(false);
      });
      return () => unsubscribeDevice();
    } else if (userData) {
        setLoading(false);
    }
  }, [userData]);

  // Relay Toggle Function
  const toggleRelay = (relayName, currentStatus) => {
    if (userData?.deviceId) {
      set(ref(database, `${userData.deviceId}/${relayName}/status`), !currentStatus);
    }
  };

  // Loading Screen
  if (loading) {
      return (
        <div className="loading-screen">
            <div className="spinner"></div>
            <h2 style={{color: 'white', marginBottom: '5px'}}>DriveLink</h2>
            <p className="loading-text">Loading Dashboard...</p>
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

        {/* 1. Stats Row (StatCards පාවිච්චි කරලා) */}
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

        {/* 2. Main Widgets Area */}
        <div className="dashboard-widgets">
          
          {/* Fuel Widget */}
          <FuelWidget sensorData={sensorData} />
          
          {/* Battery Widget */}
          <BatteryWidget sensorData={sensorData} />

          {/* Controls Widget (Relays) */}
          <ControlWidget sensorData={sensorData} onToggle={toggleRelay} />

          {/* Vehicle Status Widget (අලුතින් එකතු කළා) */}
          <StatusWidget sensorData={sensorData} />

        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;
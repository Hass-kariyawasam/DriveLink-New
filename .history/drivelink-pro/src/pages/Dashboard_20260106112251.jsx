import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { auth, db, database } from '../firebase';
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from 'firebase/firestore';
import { ref, onValue, set } from 'firebase/database';
import { useNavigate } from 'react-router-dom';

// Widgets Import
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

  // User Authentication
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

  // Real-time Sensor Data
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

  // Toggle Relay Function
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

  // Data Processing
  const temperature = sensorData?.temperature?.value || 0;
  const batteryVoltage = sensorData?.battery?.value || 0;
  const isOnline = sensorData ? true : false;

  return (
    <Layout>
      <div className="dashboard-content">
        
        {/* Header */}
        <div style={{
          marginBottom: '25px',
          paddingBottom: '15px',
          borderBottom: '1px solid rgba(255,255,255,0.05)'
        }}>
          <h1 style={{
            fontSize: '28px',
            fontWeight: '700',
            color: '#fff',
            marginBottom: '8px'
          }}>
            Welcome back, {userData?.username || 'User'}! 👋
          </h1>
          <p style={{
            color: '#8fa2b6',
            fontSize: '14px'
          }}>
            <i className="fas fa-microchip" style={{marginRight: '6px'}}></i>
            Device: <strong style={{color: '#fff'}}>{userData?.deviceId || 'Not Connected'}</strong>
            <span style={{margin: '0 10px'}}>•</span>
            <i className="fas fa-clock" style={{marginRight: '6px'}}></i>
            {new Date().toLocaleTimeString()}
          </p>
        </div>

        {/* Stats Row */}
        <div className="stats-row">
          <StatCard 
            title="Engine Temp" 
            value={temperature ? temperature.toFixed(1) + '°C' : '--'} 
            icon="fa-thermometer-half" 
            color={temperature > 90 ? '#f64e60' : '#3699ff'}
          />

          <StatCard 
            title="Status" 
            value={isOnline ? 'Online' : 'Offline'} 
            icon="fa-wifi" 
            color={isOnline ? '#1bc5bd' : '#f64e60'}
          />

          <StatCard 
            title="Battery" 
            value={batteryVoltage ? batteryVoltage.toFixed(2) + ' V' : '--'} 
            icon="fa-car-battery" 
            color={batteryVoltage < 12.0 ? '#f64e60' : '#1bc5bd'}
          />

          <StatCard 
            title="Speed" 
            value="0 km/h" 
            icon="fa-gauge-high" 
            color="#8950fc"
          />
        </div>

        {/* Widgets Grid */}
        <div className="dashboard-widgets">
          
          <FuelWidget sensorData={sensorData} />
          
          <BatteryWidget sensorData={sensorData} />

          <ControlWidget sensorData={sensorData} onToggle={toggleRelay} />

          <StatusWidget sensorData={sensorData} />

        </div>

      </div>
    </Layout>
  );
};

export default Dashboard;
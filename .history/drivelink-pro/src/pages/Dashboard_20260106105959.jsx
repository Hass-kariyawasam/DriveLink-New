import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { auth, db, database } from '../firebase';
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from 'firebase/firestore';
import { ref, onValue, set } from 'firebase/database';
import { useNavigate } from 'react-router-dom';

// Professional Widgets Import
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

  // Get temperature color
  const getTempColor = (temp) => {
    if (temp > 95) return '#f64e60'; // Critical
    if (temp > 85) return '#ffa800'; // Warning
    return '#3699ff'; // Normal
  };

  // Get connection status
  const getConnectionStatus = () => {
    if (!sensorData) return { status: 'Offline', color: '#f64e60' };
    return { status: 'Online', color: '#1bc5bd' };
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

  const temperature = sensorData?.temperature?.value || 0;
  const batteryVoltage = sensorData?.battery?.value || 0;
  const connectionStatus = getConnectionStatus();

  return (
    <Layout>
      <div className="dashboard-content">
        
        {/* Header Section */}
        <div style={{
          marginBottom: '30px',
          paddingBottom: '20px',
          borderBottom: '1px solid rgba(255,255,255,0.05)'
        }}>
          <h1 style={{
            fontSize: '32px',
            fontWeight: '700',
            color: '#fff',
            marginBottom: '8px'
          }}>
            Welcome back, {userData?.username || 'User'}! 👋
          </h1>
          <p style={{
            color: '#8fa2b6',
            fontSize: '14px',
            display: 'flex',
            alignItems: 'center',
            gap: '15px'
          }}>
            <span>
              <i className="fas fa-microchip" style={{marginRight: '6px'}}></i>
              Device ID: <strong style={{color: '#fff'}}>{userData?.deviceId || 'Not Connected'}</strong>
            </span>
            <span>•</span>
            <span>
              <i className="fas fa-clock" style={{marginRight: '6px'}}></i>
              Last Update: <strong style={{color: '#fff'}}>{new Date().toLocaleTimeString()}</strong>
            </span>
          </p>
        </div>

        {/* Stats Row - Top 4 Cards */}
        <div className="stats-row" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '16px',
          marginBottom: '24px'
        }}>
          {/* Engine Temperature */}
          <StatCard 
            title="Engine Temp" 
            value={temperature ? temperature.toFixed(1) + '°C' : '--'} 
            icon="fa-thermometer-half" 
            color={getTempColor(temperature)}
            trend={temperature > 85 ? 'up' : temperature < 70 ? 'down' : 'stable'}
            trendValue={temperature > 85 ? '+5%' : '-2%'}
          />

          {/* Connection Status */}
          <StatCard 
            title="Connection" 
            value={connectionStatus.status} 
            icon="fa-wifi" 
            color={connectionStatus.color}
          />

          {/* Battery Voltage */}
          <StatCard 
            title="Battery" 
            value={batteryVoltage ? batteryVoltage.toFixed(2) + ' V' : '--'} 
            icon="fa-car-battery" 
            color={batteryVoltage < 12.0 ? '#f64e60' : '#1bc5bd'}
            trend={batteryVoltage > 12.4 ? 'up' : 'down'}
            trendValue={batteryVoltage > 12.4 ? '+3%' : '-1%'}
          />

          {/* Speed (if available) */}
          <StatCard 
            title="Speed" 
            value={sensorData?.speed || '0 km/h'} 
            icon="fa-gauge-high" 
            color="#8950fc"
          />
        </div>

        {/* Main Widgets Area - 3 Column Grid */}
        <div className="dashboard-widgets" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '24px'
        }}>
          
          {/* Fuel Widget */}
          <FuelWidget sensorData={sensorData} />
          
          {/* Battery Widget */}
          <BatteryWidget sensorData={sensorData} />

          {/* Controls Widget */}
          <ControlWidget sensorData={sensorData} onToggle={toggleRelay} />

          {/* Status Widget - Spans 3 columns for full width */}
          <div style={{gridColumn: '1 / -1'}}>
            <StatusWidget sensorData={sensorData} />
          </div>

        </div>

        {/* Optional: Quick Actions Footer */}
        <div style={{
          marginTop: '30px',
          padding: '20px',
          background: 'rgba(255,255,255,0.03)',
          borderRadius: '16px',
          border: '1px solid rgba(255,255,255,0.05)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <h3 style={{
              fontSize: '16px',
              fontWeight: '600',
              color: '#fff',
              marginBottom: '5px'
            }}>
              Need Help?
            </h3>
            <p style={{
              fontSize: '13px',
              color: '#8fa2b6'
            }}>
              Check our documentation or contact support
            </p>
          </div>
          <div style={{display: 'flex', gap: '10px'}}>
            <button style={{
              padding: '10px 20px',
              background: 'rgba(54, 153, 255, 0.1)',
              border: '1px solid rgba(54, 153, 255, 0.3)',
              borderRadius: '8px',
              color: '#3699ff',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => e.target.style.background = 'rgba(54, 153, 255, 0.2)'}
            onMouseLeave={(e) => e.target.style.background = 'rgba(54, 153, 255, 0.1)'}>
              <i className="fas fa-book" style={{marginRight: '8px'}}></i>
              Documentation
            </button>
            <button style={{
              padding: '10px 20px',
              background: 'rgba(27, 197, 189, 0.1)',
              border: '1px solid rgba(27, 197, 189, 0.3)',
              borderRadius: '8px',
              color: '#1bc5bd',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => e.target.style.background = 'rgba(27, 197, 189, 0.2)'}
            onMouseLeave={(e) => e.target.style.background = 'rgba(27, 197, 189, 0.1)'}>
              <i className="fas fa-headset" style={{marginRight: '8px'}}></i>
              Support
            </button>
          </div>
        </div>

      </div>
    </Layout>
  );
};

export default Dashboard;
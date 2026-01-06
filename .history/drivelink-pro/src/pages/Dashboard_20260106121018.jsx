import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { auth, db, database } from '../firebase';
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, updateDoc } from 'firebase/firestore';
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
  const [showProfile, setShowProfile] = useState(false);
  const [editingDeviceId, setEditingDeviceId] = useState(false);
  const [newDeviceId, setNewDeviceId] = useState('');
  const navigate = useNavigate();

  // 1. User & Device Data Fetching
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const userRef = doc(db, "users", user.uid);
          const userSnap = await getDoc(userRef);
          if (userSnap.exists()) {
            const data = userSnap.data();
            setUserData(data);
            setNewDeviceId(data.deviceId || '');
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

  // Update Device ID
  const handleUpdateDeviceId = async () => {
    if (!auth.currentUser || !newDeviceId.trim()) {
      alert('Please enter a valid Device ID');
      return;
    }
    
    try {
      const userRef = doc(db, "users", auth.currentUser.uid);
      await updateDoc(userRef, {
        deviceId: newDeviceId.trim()
      });
      
      setUserData(prev => ({...prev, deviceId: newDeviceId.trim()}));
      setEditingDeviceId(false);
      alert('Device ID updated successfully!');
    } catch (error) {
      console.error("Error updating device ID:", error);
      alert('Failed to update Device ID');
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
        
        {/* Header Section - Simple (No Welcome, No Last Update) */}
        <div style={{
          marginBottom: '30px',
          paddingBottom: '20px',
          borderBottom: '1px solid rgba(255,255,255,0.05)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '15px'
        }}>
          <div>
            <h1 style={{
              fontSize: '32px',
              fontWeight: '700',
              color: '#fff',
              marginBottom: '8px'
            }}>
              Dashboard
            </h1>
            <p style={{
              color: '#8fa2b6',
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              <i className="fas fa-microchip" style={{marginRight: '6px'}}></i>
              Device ID: <strong style={{color: '#C4FB6D'}}>{userData?.deviceId || 'Not Connected'}</strong>
            </p>
          </div>
          
          {/* Profile Button */}
          <button 
            onClick={() => setShowProfile(!showProfile)}
            style={{
              padding: '12px 20px',
              background: showProfile ? '#C4FB6D' : 'rgba(196, 251, 109, 0.1)',
              border: '1px solid rgba(196, 251, 109, 0.3)',
              borderRadius: '10px',
              color: showProfile ? '#11121a' : '#C4FB6D',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.3s ease'
            }}
          >
            <i className="fas fa-user-cog"></i>
            {showProfile ? 'Close Profile' : 'Manage Profile'}
          </button>
        </div>

        {/* Profile Section (Collapsible) */}
        {showProfile && (
          <div style={{
            background: 'linear-gradient(145deg, #1e1e2d, #252538)',
            border: '1px solid rgba(196, 251, 109, 0.2)',
            borderRadius: '16px',
            padding: '24px',
            marginBottom: '30px',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)'
          }}>
            <h2 style={{
              fontSize: '20px',
              fontWeight: '600',
              color: '#fff',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              <i className="fas fa-id-card" style={{color: '#C4FB6D'}}></i>
              Profile Settings
            </h2>

            {/* Device ID Section */}
            <div style={{marginBottom: '20px'}}>
              <label style={{
                display: 'block',
                fontSize: '13px',
                color: '#8fa2b6',
                marginBottom: '10px',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                Current Device ID
              </label>
              
              {editingDeviceId ? (
                <div style={{display: 'flex', gap: '10px', flexWrap: 'wrap'}}>
                  <input 
                    type="text" 
                    value={newDeviceId}
                    onChange={(e) => setNewDeviceId(e.target.value)}
                    placeholder="Enter new Device ID"
                    style={{
                      flex: '1',
                      minWidth: '200px',
                      padding: '12px 15px',
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '14px'
                    }}
                  />
                  <button 
                    onClick={handleUpdateDeviceId}
                    style={{
                      padding: '12px 20px',
                      background: '#1bc5bd',
                      border: 'none',
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '14px',
                      fontWeight: '600',
                      cursor: 'pointer'
                    }}
                  >
                    <i className="fas fa-save" style={{marginRight: '6px'}}></i>
                    Save
                  </button>
                  <button 
                    onClick={() => {
                      setEditingDeviceId(false);
                      setNewDeviceId(userData?.deviceId || '');
                    }}
                    style={{
                      padding: '12px 20px',
                      background: '#f64e60',
                      border: 'none',
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '14px',
                      fontWeight: '600',
                      cursor: 'pointer'
                    }}
                  >
                    <i className="fas fa-times" style={{marginRight: '6px'}}></i>
                    Cancel
                  </button>
                </div>
              ) : (
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '15px',
                  background: 'rgba(196, 251, 109, 0.1)',
                  border: '1px solid rgba(196, 251, 109, 0.2)',
                  borderRadius: '10px'
                }}>
                  <span style={{
                    fontSize: '18px',
                    fontWeight: '700',
                    color: '#C4FB6D',
                    letterSpacing: '1px'
                  }}>
                    {userData?.deviceId || 'Not Set'}
                  </span>
                  <button 
                    onClick={() => setEditingDeviceId(true)}
                    style={{
                      padding: '8px 16px',
                      background: '#3699ff',
                      border: 'none',
                      borderRadius: '6px',
                      color: '#fff',
                      fontSize: '13px',
                      fontWeight: '600',
                      cursor: 'pointer'
                    }}
                  >
                    <i className="fas fa-edit" style={{marginRight: '6px'}}></i>
                    Change
                  </button>
                </div>
              )}
            </div>

            {/* User Info */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '15px'
            }}>
              <div style={{
                padding: '15px',
                background: 'rgba(255,255,255,0.03)',
                borderRadius: '10px',
                border: '1px solid rgba(255,255,255,0.05)'
              }}>
                <div style={{fontSize: '12px', color: '#8fa2b6', marginBottom: '5px'}}>Username</div>
                <div style={{fontSize: '16px', fontWeight: '600', color: '#fff'}}>{userData?.username || 'User'}</div>
              </div>
              <div style={{
                padding: '15px',
                background: 'rgba(255,255,255,0.03)',
                borderRadius: '10px',
                border: '1px solid rgba(255,255,255,0.05)'
              }}>
                <div style={{fontSize: '12px', color: '#8fa2b6', marginBottom: '5px'}}>Email</div>
                <div style={{fontSize: '16px', fontWeight: '600', color: '#fff'}}>{userData?.email || 'N/A'}</div>
              </div>
              <div style={{
                padding: '15px',
                background: 'rgba(255,255,255,0.03)',
                borderRadius: '10px',
                border: '1px solid rgba(255,255,255,0.05)'
              }}>
                <div style={{fontSize: '12px', color: '#8fa2b6', marginBottom: '5px'}}>Vehicle Type</div>
                <div style={{fontSize: '16px', fontWeight: '600', color: '#fff', textTransform: 'uppercase'}}>{userData?.vehicleType || 'N/A'}</div>
              </div>
            </div>
          </div>
        )}

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
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '15px'
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
          <div style={{display: 'flex', gap: '10px', flexWrap: 'wrap'}}>
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
import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { database } from '../firebase'; // Firebase path එක හරිද බලන්න
import { ref, onValue } from 'firebase/database';
import StatCard from '../components/widgets/StatCard';
import FuelWidget from '../components/widgets/FuelWidget';

const FuelStatus = () => {
  const [sensorData, setSensorData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Data Fetching
  useEffect(() => {
    // මෙතන ඔයාගේ Device ID එක හරියටම දාන්න හෝ User Data වලින් ගන්න ඕන
    // දැනට මම example එකක් විදියට 'User10' දැම්මා. ඔයාට Dashboard එකේ වගේ user context එකෙන් ගන්නත් පුළුවන්.
    const deviceId = 'User10'; 
    const deviceRef = ref(database, deviceId);
    
    const unsubscribe = onValue(deviceRef, (snapshot) => {
      if (snapshot.exists()) {
        setSensorData(snapshot.val());
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const currentLevel = sensorData?.fuel_sensor?.value || 0;
  const tankCapacity = 50;
  const fuelPrice = 380; // Price per liter

  // Calculations
  const percentage = Math.min(100, Math.max(0, (currentLevel / 100) * 100)); // Assuming sensor gives 0-100 direct
  const liters = ((percentage / 100) * tankCapacity).toFixed(1);
  const cost = (liters * fuelPrice).toLocaleString();
  const range = Math.round(liters * 12); // Est. 12km/L

  return (
    <Layout>
      <div className="dashboard-content">
        
        {/* Header */}
        <div className="main-header">
            <div className="header-left">
                <h1>Fuel Status</h1>
                <span className="breadcrumb">Dashboard / Fuel Monitor</span>
            </div>
        </div>

        {/* 1. Top Stats Row */}
        <div className="stats-row">
            <StatCard 
                title="Current Level" 
                value={`${Math.round(percentage)}%`} 
                icon="fa-gas-pump" 
                color="#3699ff" 
            />
            <StatCard 
                title="Volume" 
                value={`${liters} L`} 
                icon="fa-flask" 
                color="#8950fc" 
            />
            <StatCard 
                title="Est. Range" 
                value={`${range} km`} 
                icon="fa-road" 
                color="#1bc5bd" 
            />
            <StatCard 
                title="Current Value" 
                value={`LKR ${cost}`} 
                icon="fa-coins" 
                color="#ffa800" 
            />
        </div>

        {/* 2. Main Content Area */}
        <div className="dashboard-widgets" style={{ gridTemplateColumns: '1fr 2fr' }}>
            
            {/* Left: Visual Gauge (Reusing Widget) */}
            <div className="widget" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <FuelWidget sensorData={sensorData} />
            </div>

            {/* Right: Detailed Analysis */}
            <div className="widget">
                <div className="widget-header">
                    <h2><i className="fas fa-chart-bar" style={{marginRight:'10px', color:'#3699ff'}}></i>Consumption Analytics</h2>
                </div>
                
                <div className="widget-content">
                    <div className="detail-item">
                        <span className="label">Daily Average</span>
                        <span className="value">4.2 Liters</span>
                    </div>
                    <div className="detail-item">
                        <span className="label">Last Refuel</span>
                        <span className="value">2 Days ago</span>
                    </div>
                    <div className="detail-item">
                        <span className="label">Refuel Amount</span>
                        <span className="value">20.5 Liters</span>
                    </div>
                    <div className="detail-item">
                        <span className="label">Efficiency</span>
                        <span className="value" style={{color:'#1bc5bd'}}>12.5 km/L (Good)</span>
                    </div>
                    
                    <div style={{marginTop:'20px', padding:'15px', background:'rgba(255,168,0,0.1)', borderRadius:'8px', border:'1px solid rgba(255,168,0,0.3)'}}>
                        <h4 style={{margin:'0 0 5px 0', color:'#ffa800', fontSize:'14px'}}>Recommendation</h4>
                        <p style={{margin:0, fontSize:'13px', color:'#e8eaed'}}>
                            Your fuel efficiency is good. Maintain steady speeds to improve range by up to 10%.
                        </p>
                    </div>
                </div>
            </div>

        </div>
      </div>
    </Layout>
  );
};

export default FuelStatus;
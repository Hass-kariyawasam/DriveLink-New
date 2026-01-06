import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { database } from '../firebase'; 
import { ref, onValue } from 'firebase/database';
import StatCard from '../components/widgets/StatCard';
import BatteryWidget from '../components/widgets/BatteryWidget';

const BatteryStatus = () => {
  const [sensorData, setSensorData] = useState(null);

  useEffect(() => {
    // Device ID එක හරිගස්සගන්න
    const deviceId = 'User10'; 
    const deviceRef = ref(database, deviceId);
    
    const unsubscribe = onValue(deviceRef, (snapshot) => {
      if (snapshot.exists()) {
        setSensorData(snapshot.val());
      }
    });
    return () => unsubscribe();
  }, []);

  const voltage = sensorData?.battery?.value || 0;
  
  // Health Logic
  let healthStatus = "Good";
  let healthColor = "#1bc5bd";
  if(voltage < 12.0) { healthStatus = "Weak"; healthColor = "#ffa800"; }
  if(voltage < 11.5) { healthStatus = "Replace"; healthColor = "#f64e60"; }

  return (
    <Layout>
      <div className="dashboard-content">
        
        {/* Header */}
        <div className="main-header">
            <div className="header-left">
                <h1>Battery Health</h1>
                <span className="breadcrumb">Dashboard / Battery Monitor</span>
            </div>
        </div>

        {/* 1. Top Stats */}
        <div className="stats-row">
            <StatCard 
                title="Current Voltage" 
                value={`${voltage.toFixed(2)} V`} 
                icon="fa-bolt" 
                color={voltage < 12 ? '#f64e60' : '#1bc5bd'} 
            />
            <StatCard 
                title="Health Status" 
                value={healthStatus} 
                icon="fa-heart-pulse" 
                color={healthColor} 
            />
            <StatCard 
                title="Alternator" 
                value={voltage > 13.2 ? "Charging" : "Idle"} 
                icon="fa-charging-station" 
                color="#3699ff" 
            />
            <StatCard 
                title="Temperature" 
                value="32°C" 
                icon="fa-temperature-half" 
                color="#ffa800" 
            />
        </div>

        {/* 2. Main Layout */}
        <div className="dashboard-widgets" style={{ gridTemplateColumns: '1fr 2fr' }}>
            
            {/* Left: Battery Visual */}
            <div className="widget" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <BatteryWidget sensorData={sensorData} />
            </div>

            {/* Right: Technical Details */}
            <div className="widget">
                <div className="widget-header">
                    <h2><i className="fas fa-clipboard-check" style={{marginRight:'10px', color:'#8950fc'}}></i>Diagnostics</h2>
                </div>
                
                <div className="widget-content">
                    <div className="detail-item">
                        <span className="label">Cranking Voltage</span>
                        <span className="value">10.5 V (Normal)</span>
                    </div>
                    <div className="detail-item">
                        <span className="label">Battery Type</span>
                        <span className="value">Lead Acid (12V)</span>
                    </div>
                    <div className="detail-item">
                        <span className="label">Last Full Charge</span>
                        <span className="value">Today, 08:30 AM</span>
                    </div>
                    <div className="detail-item">
                        <span className="label">Est. Life Remaining</span>
                        <span className="value">~18 Months</span>
                    </div>

                    {/* Warning Box */}
                    {voltage < 12.0 && (
                        <div style={{marginTop:'20px', padding:'15px', background:'rgba(246,78,96,0.1)', borderRadius:'8px', border:'1px solid rgba(246,78,96,0.3)'}}>
                            <h4 style={{margin:'0 0 5px 0', color:'#f64e60', fontSize:'14px'}}>
                                <i className="fas fa-exclamation-triangle" style={{marginRight:'5px'}}></i>
                                Attention Required
                            </h4>
                            <p style={{margin:0, fontSize:'13px', color:'#e8eaed'}}>
                                Battery voltage is low. Please start the engine to recharge or inspect the battery.
                            </p>
                        </div>
                    )}
                </div>
            </div>

        </div>
      </div>
    </Layout>
  );
};

export default BatteryStatus;
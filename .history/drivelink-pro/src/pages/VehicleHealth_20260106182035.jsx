import React from 'react';
import Layout from '../components/Layout';

const VehicleHealth = () => {
    return (
        <Layout>
            <div className="dashboard-content">
                <div className="main-header">
                    <div className="header-left">
                        <h1>Vehicle Health</h1>
                        <span className="breadcrumb">Diagnostics & Status</span>
                    </div>
                </div>

                <div className="container" style={{ padding: '20px', color: 'white' }}>
                    <div className="stat-card" style={{ maxWidth: '400px', margin: '0 auto' }}>
                        <div className="stat-info">
                            <h3>System Status</h3>
                            <p style={{ color: '#28a745' }}>All Systems Go</p>
                        </div>
                        <div className="stat-icon"><i className="fas fa-heart-pulse"></i></div>
                    </div>
                    
                    <p style={{ marginTop: '20px', textAlign: 'center', color: '#8fa2b6' }}>
                        Detailed diagnostics module coming soon.
                    </p>
                </div>
            </div>
        </Layout>
    );
};

export default VehicleHealth;
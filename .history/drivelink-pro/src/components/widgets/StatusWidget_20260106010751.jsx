import React from 'react';

const StatusWidget = ({ sensorData }) => {
    return (
        <div className="widget status-widget">
            <div className="widget-header">
                <h2><i className="fas fa-car"></i> Vehicle Status</h2>
            </div>
            <div className="widget-content">
                <div className="status-items" style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px'}}>
                    
                    {/* Engine Status */}
                    <div className="status-item" style={{padding:'10px', background:'rgba(255,255,255,0.05)', borderRadius:'8px', display:'flex', alignItems:'center'}}>
                        <div className="status-icon" style={{marginRight:'10px', color:'#06e690'}}><i className="fas fa-tachometer-alt"></i></div>
                        <div>
                            <h4 style={{fontSize:'12px', color:'#888'}}>Engine</h4>
                            <p style={{color: sensorData?.engine ? '#5cb85c' : '#d9534f'}}>
                                {sensorData?.engine ? 'Running' : 'Off'}
                            </p>
                        </div>
                    </div>

                    {/* Oil Level */}
                    <div className="status-item" style={{padding:'10px', background:'rgba(255,255,255,0.05)', borderRadius:'8px', display:'flex', alignItems:'center'}}>
                        <div className="status-icon" style={{marginRight:'10px', color:'#f0ad4e'}}><i className="fas fa-oil-can"></i></div>
                        <div>
                            <h4 style={{fontSize:'12px', color:'#888'}}>Oil</h4>
                            <p style={{color:'#5cb85c'}}>Normal</p>
                        </div>
                    </div>

                    {/* Lights */}
                    <div className="status-item" style={{padding:'10px', background:'rgba(255,255,255,0.05)', borderRadius:'8px', display:'flex', alignItems:'center'}}>
                        <div className="status-icon" style={{marginRight:'10px', color:'#5bc0de'}}><i className="fas fa-lightbulb"></i></div>
                        <div>
                            <h4 style={{fontSize:'12px', color:'#888'}}>Lights</h4>
                            <p>OFF</p>
                        </div>
                    </div>

                    {/* Doors */}
                    <div className="status-item" style={{padding:'10px', background:'rgba(255,255,255,0.05)', borderRadius:'8px', display:'flex', alignItems:'center'}}>
                        <div className="status-icon" style={{marginRight:'10px', color:'#d9534f'}}><i className="fas fa-door-open"></i></div>
                        <div>
                            <h4 style={{fontSize:'12px', color:'#888'}}>Doors</h4>
                            <p style={{color:'#d9534f'}}>Closed</p>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default StatusWidget;
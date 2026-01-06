import React from 'react';

const ControlWidget = ({ sensorData, onToggle }) => {
    return (
        <div className="widget controls-widget">
            <div className="widget-header">
                <h2><i className="fas fa-sliders-h"></i> Vehicle Controls</h2>
            </div>
            <div className="widget-content">
                <div className="control-items">
                    {/* Relay 1 */}
                    <div className="control-item" style={{display:'flex', justifyContent:'space-between', padding:'10px', background:'rgba(255,255,255,0.05)', borderRadius:'8px', marginBottom:'10px'}}>
                        <div className="control-label">Relay 1</div>
                        <label className="switch" style={{position:'relative', width:'50px', height:'24px'}}>
                            <input 
                                type="checkbox" 
                                checked={sensorData?.relay1?.status || false}
                                onChange={() => onToggle('relay1', sensorData?.relay1?.status)}
                                style={{opacity:0, width:0, height:0}}
                            />
                            <span className="slider round" style={{
                                position:'absolute', cursor:'pointer', top:0, left:0, right:0, bottom:0, 
                                backgroundColor: sensorData?.relay1?.status ? '#06e690' : '#ccc', 
                                transition:'.4s', borderRadius:'34px'
                            }}>
                                <span style={{
                                    position:'absolute', height:'16px', width:'16px', left:'4px', bottom:'4px', 
                                    backgroundColor:'white', transition:'.4s', borderRadius:'50%',
                                    transform: sensorData?.relay1?.status ? 'translateX(26px)' : 'translateX(0)'
                                }}></span>
                            </span>
                        </label>
                    </div>

                    {/* Relay 2 */}
                    <div className="control-item" style={{display:'flex', justifyContent:'space-between', padding:'10px', background:'rgba(255,255,255,0.05)', borderRadius:'8px'}}>
                        <div className="control-label">Relay 2</div>
                        <label className="switch" style={{position:'relative', width:'50px', height:'24px'}}>
                            <input 
                                type="checkbox" 
                                checked={sensorData?.relay2?.status || false}
                                onChange={() => onToggle('relay2', sensorData?.relay2?.status)}
                                style={{opacity:0, width:0, height:0}}
                            />
                            <span className="slider round" style={{
                                position:'absolute', cursor:'pointer', top:0, left:0, right:0, bottom:0, 
                                backgroundColor: sensorData?.relay2?.status ? '#06e690' : '#ccc', 
                                transition:'.4s', borderRadius:'34px'
                            }}>
                                <span style={{
                                    position:'absolute', height:'16px', width:'16px', left:'4px', bottom:'4px', 
                                    backgroundColor:'white', transition:'.4s', borderRadius:'50%',
                                    transform: sensorData?.relay2?.status ? 'translateX(26px)' : 'translateX(0)'
                                }}></span>
                            </span>
                        </label>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ControlWidget;
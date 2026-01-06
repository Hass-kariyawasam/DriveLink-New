import React, { useState } from 'react';

const ControlWidget = ({ sensorData, onToggle }) => {
    const [activeRelay, setActiveRelay] = useState(null);
    
    const relays = [
        {
            id: 'relay1',
            name: 'Headlights',
            icon: 'fa-lightbulb',
            status: sensorData?.relay1?.status || false,
            color: '#ffa800'
        },
        {
            id: 'relay2',
            name: 'Air Conditioning',
            icon: 'fa-fan',
            status: sensorData?.relay2?.status || false,
            color: '#3699ff'
        }
    ];
    
    const handleToggle = (relayId, currentStatus) => {
        setActiveRelay(relayId);
        setTimeout(() => setActiveRelay(null), 300);
        onToggle(relayId, currentStatus);
    };
    
    return (
        <div className="widget controls-widget">
            {/* Header */}
            <div className="widget-header">
                <h2>
                    <i className="fas fa-sliders-h" style={{color: '#8950fc'}}></i>
                    Vehicle Controls
                </h2>
                <span style={{
                    fontSize: '11px',
                    color: '#8fa2b6',
                    background: 'rgba(255,255,255,0.05)',
                    padding: '4px 10px',
                    borderRadius: '12px'
                }}>
                    <i className="fas fa-circle" style={{
                        fontSize: '8px',
                        color: '#1bc5bd',
                        marginRight: '5px'
                    }}></i>
                    Live
                </span>
            </div>

            {/* Content */}
            <div className="widget-content" style={{padding: '20px 15px'}}>
                
                {/* Control Items */}
                <div className="control-items" style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '15px'
                }}>
                    {relays.map((relay) => (
                        <div 
                            key={relay.id}
                            className="control-item" 
                            style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                padding: '18px',
                                background: relay.status 
                                    ? `linear-gradient(135deg, ${relay.color}15, transparent)`
                                    : 'rgba(255,255,255,0.03)',
                                border: `1px solid ${relay.status ? `${relay.color}30` : 'rgba(255,255,255,0.05)'}`,
                                borderRadius: '14px',
                                transition: 'all 0.3s ease',
                                cursor: 'pointer',
                                transform: activeRelay === relay.id ? 'scale(0.98)' : 'scale(1)'
                            }}
                            onClick={() => handleToggle(relay.id, relay.status)}
                        >
                            {/* Left: Icon & Info */}
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '15px'
                            }}>
                                <div style={{
                                    width: '45px',
                                    height: '45px',
                                    borderRadius: '12px',
                                    background: relay.status 
                                        ? `linear-gradient(135deg, ${relay.color}40, ${relay.color}20)`
                                        : 'rgba(255,255,255,0.05)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '20px',
                                    color: relay.status ? relay.color : '#8fa2b6',
                                    transition: 'all 0.3s ease'
                                }}>
                                    <i className={`fas ${relay.icon}`}></i>
                                </div>
                                
                                <div>
                                    <div style={{
                                        fontSize: '15px',
                                        fontWeight: '600',
                                        color: '#fff',
                                        marginBottom: '3px'
                                    }}>
                                        {relay.name}
                                    </div>
                                    <div style={{
                                        fontSize: '12px',
                                        color: relay.status ? relay.color : '#8fa2b6',
                                        fontWeight: '500'
                                    }}>
                                        {relay.status ? 'Active' : 'Inactive'}
                                    </div>
                                </div>
                            </div>

                            {/* Right: Toggle Switch */}
                            <label 
                                className="switch" 
                                style={{
                                    position: 'relative',
                                    width: '54px',
                                    height: '28px',
                                    cursor: 'pointer'
                                }}
                                onClick={(e) => e.stopPropagation()}
                            >
                                <input 
                                    type="checkbox" 
                                    checked={relay.status}
                                    onChange={() => handleToggle(relay.id, relay.status)}
                                    style={{opacity: 0, width: 0, height: 0}}
                                />
                                <span style={{
                                    position: 'absolute',
                                    cursor: 'pointer',
                                    top: 0,
                                    left: 0,
                                    right: 0,
                                    bottom: 0,
                                    backgroundColor: relay.status ? relay.color : '#363645',
                                    transition: '0.4s',
                                    borderRadius: '34px',
                                    boxShadow: relay.status ? `0 0 15px ${relay.color}60` : 'inset 0 2px 4px rgba(0,0,0,0.2)'
                                }}>
                                    <span style={{
                                        position: 'absolute',
                                        content: '""',
                                        height: '20px',
                                        width: '20px',
                                        left: relay.status ? '30px' : '4px',
                                        bottom: '4px',
                                        backgroundColor: 'white',
                                        transition: '0.4s',
                                        borderRadius: '50%',
                                        boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
                                    }}></span>
                                </span>
                            </label>
                        </div>
                    ))}
                </div>

                {/* Info Banner */}
                <div style={{
                    marginTop: '20px',
                    padding: '12px 15px',
                    background: 'rgba(137, 80, 252, 0.1)',
                    border: '1px solid rgba(137, 80, 252, 0.2)',
                    borderRadius: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px'
                }}>
                    <i className="fas fa-info-circle" style={{
                        color: '#8950fc',
                        fontSize: '16px'
                    }}></i>
                    <span style={{
                        fontSize: '12px',
                        color: '#8fa2b6',
                        lineHeight: '1.4'
                    }}>
                        Changes are applied instantly to your vehicle
                    </span>
                </div>

                {/* Quick Actions (Optional) */}
                <div style={{
                    marginTop: '15px',
                    display: 'flex',
                    gap: '10px'
                }}>
                    <button 
                        onClick={() => {
                            relays.forEach(relay => {
                                if (!relay.status) handleToggle(relay.id, relay.status);
                            });
                        }}
                        style={{
                            flex: 1,
                            padding: '10px',
                            background: 'rgba(27, 197, 189, 0.1)',
                            border: '1px solid rgba(27, 197, 189, 0.3)',
                            borderRadius: '8px',
                            color: '#1bc5bd',
                            fontSize: '13px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            transition: 'all 0.3s ease'
                        }}
                        onMouseEnter={(e) => {
                            e.target.style.background = 'rgba(27, 197, 189, 0.2)';
                        }}
                        onMouseLeave={(e) => {
                            e.target.style.background = 'rgba(27, 197, 189, 0.1)';
                        }}
                    >
                        <i className="fas fa-power-off" style={{marginRight: '5px'}}></i>
                        All ON
                    </button>
                    
                    <button 
                        onClick={() => {
                            relays.forEach(relay => {
                                if (relay.status) handleToggle(relay.id, relay.status);
                            });
                        }}
                        style={{
                            flex: 1,
                            padding: '10px',
                            background: 'rgba(246, 78, 96, 0.1)',
                            border: '1px solid rgba(246, 78, 96, 0.3)',
                            borderRadius: '8px',
                            color: '#f64e60',
                            fontSize: '13px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            transition: 'all 0.3s ease'
                        }}
                        onMouseEnter={(e) => {
                            e.target.style.background = 'rgba(246, 78, 96, 0.2)';
                        }}
                        onMouseLeave={(e) => {
                            e.target.style.background = 'rgba(246, 78, 96, 0.1)';
                        }}
                    >
                        <i className="fas fa-power-off" style={{marginRight: '5px'}}></i>
                        All OFF
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ControlWidget;
import React, { useState, useEffect } from 'react';

const BatteryWidget = ({ sensorData }) => {
    const [animatedPercentage, setAnimatedPercentage] = useState(0);
    
    const voltage = sensorData?.battery?.value || 0;
    
    // Battery Percentage Logic (12V Battery System)
    // 12.7V+ = 100%, 12.4V = 75%, 12.2V = 50%, 12.0V = 25%, 11.8V = 0%
    let percentage;
    if (voltage >= 12.7) {
        percentage = 100;
    } else if (voltage >= 12.4) {
        percentage = 75 + ((voltage - 12.4) / 0.3) * 25;
    } else if (voltage >= 12.2) {
        percentage = 50 + ((voltage - 12.2) / 0.2) * 25;
    } else if (voltage >= 12.0) {
        percentage = 25 + ((voltage - 12.0) / 0.2) * 25;
    } else if (voltage >= 11.8) {
        percentage = ((voltage - 11.8) / 0.2) * 25;
    } else {
        percentage = 0;
    }
    
    percentage = Math.max(0, Math.min(100, percentage));
    
    // Animate percentage
    useEffect(() => {
        const timer = setTimeout(() => {
            setAnimatedPercentage(percentage);
        }, 100);
        return () => clearTimeout(timer);
    }, [percentage]);
    
    // Status & Color Logic
    let status = "Excellent";
    let statusColor = "#1bc5bd";
    let batteryGradient = "linear-gradient(180deg, #1bc5bd 0%, #0e8074 100%)";
    
    if (percentage < 20) {
        status = "Critical";
        statusColor = "#f64e60";
        batteryGradient = "linear-gradient(180deg, #f64e60 0%, #c43347 100%)";
    } else if (percentage < 40) {
        status = "Low";
        statusColor = "#ffa800";
        batteryGradient = "linear-gradient(180deg, #ffa800 0%, #cc8600 100%)";
    } else if (percentage < 70) {
        status = "Good";
        statusColor = "#3699ff";
        batteryGradient = "linear-gradient(180deg, #3699ff 0%, #2c80db 100%)";
    }
    
    // Health determination
    let health = "Good";
    let healthColor = "#1bc5bd";
    if (voltage < 11.8) {
        health = "Dead";
        healthColor = "#f64e60";
    } else if (voltage < 12.0) {
        health = "Weak";
        healthColor = "#f64e60";
    } else if (voltage < 12.4) {
        health = "Fair";
        healthColor = "#ffa800";
    }
    
    // Charging status
    const isCharging = voltage > 13.5; // Typically charging if > 13.5V
    
    return (
        <div className="widget battery-widget">
            {/* Header */}
            <div className="widget-header">
                <h2>
                    <i className="fas fa-car-battery" style={{color: statusColor}}></i>
                    Battery Monitor
                </h2>
                <span 
                    className="status-badge" 
                    style={{
                        background: `${statusColor}20`,
                        color: statusColor,
                        padding: '4px 12px',
                        borderRadius: '20px',
                        fontSize: '12px',
                        fontWeight: '600'
                    }}
                >
                    {status}
                </span>
            </div>

            {/* Content */}
            <div className="widget-content" style={{padding: '20px 10px'}}>
                
                {/* Battery Visual Container */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginBottom: '25px'
                }}>
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center'
                    }}>
                        {/* Battery Terminal (Top) */}
                        <div style={{
                            width: '30px',
                            height: '10px',
                            background: 'linear-gradient(145deg, #3a3a4e, #2a2a3e)',
                            borderRadius: '5px 5px 0 0',
                            marginBottom: '-2px',
                            boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.3)'
                        }}></div>

                        {/* Battery Body */}
                        <div style={{
                            position: 'relative',
                            width: '100px',
                            height: '180px',
                            background: 'linear-gradient(145deg, #1a1a27, #252538)',
                            border: '4px solid rgba(255,255,255,0.1)',
                            borderRadius: '16px',
                            overflow: 'hidden',
                            boxShadow: 'inset 0 0 30px rgba(0,0,0,0.6), 0 8px 20px rgba(0,0,0,0.3)'
                        }}>
                            {/* Battery Fill */}
                            <div style={{
                                position: 'absolute',
                                bottom: 0,
                                left: 0,
                                width: '100%',
                                height: `${animatedPercentage}%`,
                                background: batteryGradient,
                                transition: 'height 2s cubic-bezier(0.4, 0, 0.2, 1)',
                                borderRadius: '0 0 12px 12px',
                                boxShadow: `0 0 20px ${statusColor}80`
                            }}>
                                {/* Shine Effect */}
                                <div style={{
                                    position: 'absolute',
                                    top: 0,
                                    left: '10%',
                                    width: '30%',
                                    height: '100%',
                                    background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
                                    animation: 'shine 3s ease-in-out infinite'
                                }}></div>
                            </div>

                            {/* Battery Icon & Percentage */}
                            <div style={{
                                position: 'absolute',
                                top: '50%',
                                left: '50%',
                                transform: 'translate(-50%, -50%)',
                                zIndex: 10,
                                textAlign: 'center'
                            }}>
                                {isCharging ? (
                                    <i className="fas fa-bolt" style={{
                                        fontSize: '32px',
                                        color: '#fff',
                                        marginBottom: '5px',
                                        textShadow: '0 0 10px rgba(255,255,255,0.5)',
                                        animation: 'flash 1.5s ease-in-out infinite'
                                    }}></i>
                                ) : (
                                    <i className="fas fa-battery-three-quarters" style={{
                                        fontSize: '28px',
                                        color: '#fff',
                                        marginBottom: '5px',
                                        opacity: 0.3
                                    }}></i>
                                )}
                                <div style={{
                                    fontSize: '32px',
                                    fontWeight: '800',
                                    color: '#fff',
                                    textShadow: '0 4px 8px rgba(0,0,0,0.5)',
                                    lineHeight: '1'
                                }}>
                                    {Math.round(animatedPercentage)}
                                    <span style={{fontSize: '18px', fontWeight: '600'}}>%</span>
                                </div>
                            </div>

                            {/* Level Markers */}
                            {[25, 50, 75].map((level) => (
                                <div key={level} style={{
                                    position: 'absolute',
                                    right: '-8px',
                                    bottom: `${level}%`,
                                    width: '8px',
                                    height: '2px',
                                    background: 'rgba(255,255,255,0.2)',
                                    borderRadius: '2px'
                                }}></div>
                            ))}

                            {/* Critical Warning */}
                            {percentage < 20 && (
                                <div style={{
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    right: 0,
                                    bottom: 0,
                                    background: 'radial-gradient(circle, rgba(246,78,96,0.3) 0%, transparent 70%)',
                                    animation: 'pulse 2s ease-in-out infinite'
                                }}></div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Battery Metrics Grid */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, 1fr)',
                    gap: '12px',
                    marginBottom: '15px'
                }}>
                    {/* Voltage */}
                    <div style={{
                        background: 'rgba(255,255,255,0.03)',
                        padding: '15px',
                        borderRadius: '12px',
                        border: '1px solid rgba(255,255,255,0.05)',
                        textAlign: 'center'
                    }}>
                        <div style={{
                            fontSize: '11px',
                            color: '#8fa2b6',
                            marginBottom: '5px',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px'
                        }}>
                            Voltage
                        </div>
                        <div style={{
                            fontSize: '22px',
                            fontWeight: '700',
                            color: '#fff'
                        }}>
                            {voltage.toFixed(2)}
                            <span style={{fontSize: '14px', color: '#8fa2b6', fontWeight: '500'}}> V</span>
                        </div>
                    </div>

                    {/* Health */}
                    <div style={{
                        background: 'rgba(255,255,255,0.03)',
                        padding: '15px',
                        borderRadius: '12px',
                        border: '1px solid rgba(255,255,255,0.05)',
                        textAlign: 'center'
                    }}>
                        <div style={{
                            fontSize: '11px',
                            color: '#8fa2b6',
                            marginBottom: '5px',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px'
                        }}>
                            Health
                        </div>
                        <div style={{
                            fontSize: '22px',
                            fontWeight: '700',
                            color: healthColor
                        }}>
                            {health}
                        </div>
                    </div>
                </div>

                {/* Status Information */}
                <div style={{
                    background: 'rgba(255,255,255,0.03)',
                    padding: '15px',
                    borderRadius: '12px',
                    border: '1px solid rgba(255,255,255,0.05)'
                }}>
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '8px'
                    }}>
                        <span style={{
                            fontSize: '13px',
                            color: '#8fa2b6'
                        }}>
                            <i className={`fas ${isCharging ? 'fa-plug-circle-bolt' : 'fa-battery-half'}`} style={{marginRight: '8px'}}></i>
                            Status
                        </span>
                        <span style={{
                            fontSize: '14px',
                            fontWeight: '600',
                            color: isCharging ? '#1bc5bd' : '#fff'
                        }}>
                            {isCharging ? 'Charging' : 'Discharging'}
                        </span>
                    </div>
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        paddingTop: '8px',
                        borderTop: '1px dashed rgba(255,255,255,0.05)'
                    }}>
                        <span style={{
                            fontSize: '13px',
                            color: '#8fa2b6'
                        }}>
                            <i className="fas fa-temperature-half" style={{marginRight: '8px'}}></i>
                            Temperature
                        </span>
                        <span style={{
                            fontSize: '14px',
                            fontWeight: '600',
                            color: '#fff'
                        }}>
                            Normal
                        </span>
                    </div>
                </div>

                {/* Warning Alerts */}
                {percentage < 20 && (
                    <div style={{
                        marginTop: '15px',
                        padding: '12px 15px',
                        background: 'rgba(246, 78, 96, 0.1)',
                        border: '1px solid rgba(246, 78, 96, 0.3)',
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px'
                    }}>
                        <i className="fas fa-exclamation-triangle" style={{
                            color: '#f64e60',
                            fontSize: '18px'
                        }}></i>
                        <span style={{
                            fontSize: '13px',
                            color: '#f64e60',
                            fontWeight: '500'
                        }}>
                            Battery critically low! Check immediately.
                        </span>
                    </div>
                )}

                {voltage < 12.0 && percentage >= 20 && (
                    <div style={{
                        marginTop: '15px',
                        padding: '12px 15px',
                        background: 'rgba(255, 168, 0, 0.1)',
                        border: '1px solid rgba(255, 168, 0, 0.3)',
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px'
                    }}>
                        <i className="fas fa-wrench" style={{
                            color: '#ffa800',
                            fontSize: '18px'
                        }}></i>
                        <span style={{
                            fontSize: '13px',
                            color: '#ffa800',
                            fontWeight: '500'
                        }}>
                            Battery needs maintenance or replacement.
                        </span>
                    </div>
                )}
            </div>

            {/* Animations */}
            <style>{`
                @keyframes shine {
                    0% { transform: translateX(-100%); }
                    100% { transform: translateX(300%); }
                }
                
                @keyframes flash {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.5; }
                }
                
                @keyframes pulse {
                    0%, 100% { opacity: 0.5; }
                    50% { opacity: 1; }
                }
            `}</style>
        </div>
    );
};

export default BatteryWidget;
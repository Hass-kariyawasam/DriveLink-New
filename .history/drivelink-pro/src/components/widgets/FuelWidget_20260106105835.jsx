import React, { useState, useEffect } from 'react';

const FuelWidget = ({ sensorData }) => {
    const [animatedPercentage, setAnimatedPercentage] = useState(0);
    
    // Sensor values
    const currentLevel = sensorData?.fuel_sensor?.value || 0;
    const tankCapacity = 50; // Tank capacity in liters
    const fuelPrice = 380; // Price per liter (LKR)
    
    // Calculate percentage
    const min = 0;
    const max = 100;
    let percentage = ((currentLevel - min) / (max - min)) * 100;
    percentage = Math.max(0, Math.min(100, percentage));
    
    // Animate percentage on load
    useEffect(() => {
        const timer = setTimeout(() => {
            setAnimatedPercentage(percentage);
        }, 100);
        return () => clearTimeout(timer);
    }, [percentage]);
    
    // Calculate fuel metrics
    const liters = ((percentage / 100) * tankCapacity).toFixed(1);
    const range = Math.round(liters * 12); // 12km per liter assumption
    const estimatedCost = Math.round(liters * fuelPrice);
    
    // Status & color logic
    let status = "Good";
    let statusColor = "#1bc5bd"; // Green
    let fuelColor = "linear-gradient(180deg, #1bc5bd 0%, #0e8074 100%)";
    
    if (percentage < 15) {
        status = "Critical";
        statusColor = "#f64e60";
        fuelColor = "linear-gradient(180deg, #f64e60 0%, #c43347 100%)";
    } else if (percentage < 30) {
        status = "Low";
        statusColor = "#ffa800";
        fuelColor = "linear-gradient(180deg, #ffa800 0%, #cc8600 100%)";
    } else if (percentage < 60) {
        status = "Fair";
        statusColor = "#3699ff";
        fuelColor = "linear-gradient(180deg, #3699ff 0%, #2c80db 100%)";
    }
    
    return (
        <div className="widget fuel-widget">
            {/* Header */}
            <div className="widget-header">
                <h2>
                    <i className="fas fa-gas-pump" style={{color: statusColor}}></i> 
                    Fuel Monitor
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
                
                {/* Fuel Gauge Container */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginBottom: '25px'
                }}>
                    {/* Fuel Tank Visual */}
                    <div style={{
                        position: 'relative',
                        width: '160px',
                        height: '160px',
                        borderRadius: '50%',
                        border: '5px solid rgba(255,255,255,0.1)',
                        background: 'linear-gradient(145deg, #1a1a27, #252538)',
                        overflow: 'hidden',
                        boxShadow: 'inset 0 0 30px rgba(0,0,0,0.6), 0 8px 20px rgba(0,0,0,0.3)'
                    }}>
                        {/* Fuel Fill */}
                        <div style={{
                            position: 'absolute',
                            bottom: 0,
                            left: 0,
                            width: '100%',
                            height: `${animatedPercentage}%`,
                            background: fuelColor,
                            transition: 'height 2s cubic-bezier(0.4, 0, 0.2, 1)',
                            borderRadius: '0 0 50% 50%'
                        }}>
                            {/* Animated Wave Effect */}
                            <div style={{
                                position: 'absolute',
                                top: '-10px',
                                left: '0',
                                width: '200%',
                                height: '20px',
                                background: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 800 88.7'%3E%3Cpath d='M800 56.9c-155.5 0-204.9-50-405.5-49.9-200 0-250 49.9-394.5 49.9v31.8h800v-.2-31.6z' fill='%23ffffff' fill-opacity='0.2'/%3E%3C/svg%3E")`,
                                backgroundSize: '400px 20px',
                                animation: 'wave-animation 8s linear infinite',
                                opacity: 0.3
                            }}></div>
                        </div>

                        {/* Center Percentage Display */}
                        <div style={{
                            position: 'absolute',
                            top: '50%',
                            left: '50%',
                            transform: 'translate(-50%, -50%)',
                            zIndex: 10,
                            textAlign: 'center'
                        }}>
                            <div style={{
                                fontSize: '42px',
                                fontWeight: '800',
                                color: '#fff',
                                textShadow: '0 4px 8px rgba(0,0,0,0.5)',
                                lineHeight: '1'
                            }}>
                                {Math.round(animatedPercentage)}
                                <span style={{fontSize: '24px', fontWeight: '600'}}>%</span>
                            </div>
                            <div style={{
                                fontSize: '11px',
                                color: 'rgba(255,255,255,0.7)',
                                marginTop: '5px',
                                fontWeight: '500',
                                letterSpacing: '1px'
                            }}>
                                FUEL LEVEL
                            </div>
                        </div>

                        {/* Glow Effect */}
                        {percentage < 15 && (
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

                {/* Fuel Details Grid */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, 1fr)',
                    gap: '12px',
                    marginBottom: '15px'
                }}>
                    {/* Volume */}
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
                            Volume
                        </div>
                        <div style={{
                            fontSize: '22px',
                            fontWeight: '700',
                            color: '#fff'
                        }}>
                            {liters}
                            <span style={{fontSize: '14px', color: '#8fa2b6', fontWeight: '500'}}> L</span>
                        </div>
                    </div>

                    {/* Range */}
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
                            Est. Range
                        </div>
                        <div style={{
                            fontSize: '22px',
                            fontWeight: '700',
                            color: '#fff'
                        }}>
                            {range}
                            <span style={{fontSize: '14px', color: '#8fa2b6', fontWeight: '500'}}> km</span>
                        </div>
                    </div>
                </div>

                {/* Additional Info */}
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
                            <i className="fas fa-gauge-high" style={{marginRight: '8px'}}></i>
                            Tank Capacity
                        </span>
                        <span style={{
                            fontSize: '14px',
                            fontWeight: '600',
                            color: '#fff'
                        }}>
                            {tankCapacity} L
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
                            <i className="fas fa-coins" style={{marginRight: '8px'}}></i>
                            Estimated Value
                        </span>
                        <span style={{
                            fontSize: '14px',
                            fontWeight: '600',
                            color: '#1bc5bd'
                        }}>
                            LKR {estimatedCost.toLocaleString()}
                        </span>
                    </div>
                </div>

                {/* Warning Alert */}
                {percentage < 15 && (
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
                            Low fuel! Please refuel soon.
                        </span>
                    </div>
                )}
            </div>

            {/* Inline Animation Styles */}
            <style>{`
                @keyframes wave-animation {
                    0% { transform: translateX(0); }
                    100% { transform: translateX(-400px); }
                }
                
                @keyframes pulse {
                    0%, 100% { opacity: 0.5; }
                    50% { opacity: 1; }
                }
            `}</style>
        </div>
    );
};

export default FuelWidget;
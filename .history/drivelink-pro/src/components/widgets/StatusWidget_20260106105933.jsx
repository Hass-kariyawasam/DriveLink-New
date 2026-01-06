import React from 'react';

const StatusWidget = ({ sensorData }) => {
    
    const statusItems = [
        {
            id: 'engine',
            label: 'Engine',
            icon: 'fa-gauge-high',
            value: sensorData?.engine ? 'Running' : 'Off',
            status: sensorData?.engine ? 'active' : 'inactive',
            color: sensorData?.engine ? '#1bc5bd' : '#8fa2b6',
            bgColor: sensorData?.engine ? 'rgba(27, 197, 189, 0.15)' : 'rgba(255,255,255,0.03)'
        },
        {
            id: 'oil',
            label: 'Oil Pressure',
            icon: 'fa-oil-can',
            value: 'Normal',
            status: 'good',
            color: '#1bc5bd',
            bgColor: 'rgba(27, 197, 189, 0.15)'
        },
        {
            id: 'coolant',
            label: 'Coolant',
            icon: 'fa-droplet',
            value: 'Optimal',
            status: 'good',
            color: '#3699ff',
            bgColor: 'rgba(54, 153, 255, 0.15)'
        },
        {
            id: 'brake',
            label: 'Brake Fluid',
            icon: 'fa-circle-exclamation',
            value: 'Good',
            status: 'good',
            color: '#1bc5bd',
            bgColor: 'rgba(27, 197, 189, 0.15)'
        },
        {
            id: 'tire',
            label: 'Tire Pressure',
            icon: 'fa-tire',
            value: 'Normal',
            status: 'good',
            color: '#1bc5bd',
            bgColor: 'rgba(27, 197, 189, 0.15)'
        },
        {
            id: 'doors',
            label: 'Door Locks',
            icon: 'fa-door-closed',
            value: 'Secured',
            status: 'good',
            color: '#8950fc',
            bgColor: 'rgba(137, 80, 252, 0.15)'
        }
    ];
    
    return (
        <div className="widget status-widget">
            {/* Header */}
            <div className="widget-header">
                <h2>
                    <i className="fas fa-car" style={{color: '#1bc5bd'}}></i>
                    Vehicle Status
                </h2>
                <button style={{
                    background: 'rgba(255,255,255,0.05)',
                    border: 'none',
                    color: '#8fa2b6',
                    padding: '6px 12px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                    e.target.style.background = 'rgba(255,255,255,0.1)';
                    e.target.style.color = '#fff';
                }}
                onMouseLeave={(e) => {
                    e.target.style.background = 'rgba(255,255,255,0.05)';
                    e.target.style.color = '#8fa2b6';
                }}>
                    <i className="fas fa-sync-alt" style={{marginRight: '5px'}}></i>
                    Refresh
                </button>
            </div>

            {/* Content */}
            <div className="widget-content" style={{padding: '15px 10px'}}>
                
                {/* Status Items Grid */}
                <div className="status-items" style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, 1fr)',
                    gap: '12px',
                    marginBottom: '15px'
                }}>
                    {statusItems.map((item) => (
                        <div 
                            key={item.id}
                            className="status-item" 
                            style={{
                                background: item.bgColor,
                                padding: '15px',
                                borderRadius: '12px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px',
                                transition: 'all 0.3s ease',
                                border: `1px solid ${item.color}20`,
                                cursor: 'pointer'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'translateY(-3px)';
                                e.currentTarget.style.boxShadow = `0 8px 20px ${item.color}30`;
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = 'none';
                            }}
                        >
                            {/* Icon */}
                            <div style={{
                                width: '40px',
                                height: '40px',
                                borderRadius: '10px',
                                background: `${item.color}20`,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '18px',
                                color: item.color,
                                flexShrink: 0
                            }}>
                                <i className={`fas ${item.icon}`}></i>
                            </div>

                            {/* Info */}
                            <div style={{flex: 1, minWidth: 0}}>
                                <h4 style={{
                                    fontSize: '12px',
                                    color: '#8fa2b6',
                                    marginBottom: '4px',
                                    fontWeight: '500',
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis'
                                }}>
                                    {item.label}
                                </h4>
                                <div style={{
                                    fontSize: '14px',
                                    fontWeight: '600',
                                    color: item.color,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '5px'
                                }}>
                                    {item.value}
                                    {item.status === 'active' && (
                                        <span style={{
                                            width: '6px',
                                            height: '6px',
                                            borderRadius: '50%',
                                            background: item.color,
                                            animation: 'blink 2s ease-in-out infinite'
                                        }}></span>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Overall System Health */}
                <div style={{
                    background: 'linear-gradient(135deg, rgba(27, 197, 189, 0.1), rgba(27, 197, 189, 0.05))',
                    border: '1px solid rgba(27, 197, 189, 0.2)',
                    borderRadius: '12px',
                    padding: '15px',
                    marginBottom: '15px'
                }}>
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '10px'
                    }}>
                        <span style={{
                            fontSize: '14px',
                            fontWeight: '600',
                            color: '#fff'
                        }}>
                            <i className="fas fa-heart-pulse" style={{
                                color: '#1bc5bd',
                                marginRight: '8px'
                            }}></i>
                            Overall Health
                        </span>
                        <span style={{
                            fontSize: '18px',
                            fontWeight: '700',
                            color: '#1bc5bd'
                        }}>
                            96%
                        </span>
                    </div>
                    
                    {/* Progress Bar */}
                    <div style={{
                        width: '100%',
                        height: '8px',
                        background: 'rgba(27, 197, 189, 0.1)',
                        borderRadius: '10px',
                        overflow: 'hidden'
                    }}>
                        <div style={{
                            width: '96%',
                            height: '100%',
                            background: 'linear-gradient(90deg, #1bc5bd, #0e8074)',
                            borderRadius: '10px',
                            transition: 'width 1s ease-out',
                            boxShadow: '0 0 10px rgba(27, 197, 189, 0.5)'
                        }}></div>
                    </div>
                </div>

                {/* Last Check Info */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '12px 15px',
                    background: 'rgba(255,255,255,0.03)',
                    borderRadius: '8px',
                    fontSize: '12px',
                    color: '#8fa2b6'
                }}>
                    <span>
                        <i className="fas fa-clock" style={{marginRight: '6px'}}></i>
                        Last checked: Just now
                    </span>
                    <span style={{
                        color: '#1bc5bd',
                        fontWeight: '600'
                    }}>
                        <i className="fas fa-circle-check" style={{marginRight: '4px'}}></i>
                        All systems OK
                    </span>
                </div>
            </div>

            {/* Animations */}
            <style>{`
                @keyframes blink {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.3; }
                }
            `}</style>
        </div>
    );
};

export default StatusWidget;
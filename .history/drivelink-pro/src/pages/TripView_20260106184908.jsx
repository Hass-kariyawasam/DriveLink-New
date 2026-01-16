// ... (imports remain same)

// TripView Component ඇතුලේ return එකේ පහල කොටස මෙහෙම වෙනස් කරන්න:

                    {/* Stats Grid (New Widget Design) */}
                    <div className="tv-grid">
                        
                        {/* Distance */}
                        <div className="tv-card dist">
                            <div className="tv-icon"><i className="fas fa-road"></i></div>
                            <div className="tv-content">
                                <span className="tv-label">Distance</span>
                                <span className="tv-value">{trip?.distance} km</span>
                            </div>
                        </div>

                        {/* Total Duration */}
                        <div className="tv-card time">
                            <div className="tv-icon"><i className="fas fa-clock"></i></div>
                            <div className="tv-content">
                                <span className="tv-label">Duration</span>
                                <span className="tv-value">{Math.floor(trip?.totalDuration)} min</span>
                            </div>
                        </div>

                        {/* Top Speed */}
                        <div className="tv-card speed">
                            <div className="tv-icon"><i className="fas fa-tachometer-alt"></i></div>
                            <div className="tv-content">
                                <span className="tv-label">Top Speed</span>
                                <span className="tv-value">{trip?.topSpeed} km/h</span>
                            </div>
                        </div>

                        {/* Moving Time */}
                        <div className="tv-card avg">
                            <div className="tv-icon"><i className="fas fa-stopwatch"></i></div>
                            <div className="tv-content">
                                <span className="tv-label">Moving Time</span>
                                <span className="tv-value">{Math.floor(trip?.movingDuration)} min</span>
                            </div>
                        </div>

                        {/* Fuel Used */}
                        <div className="tv-card fuel">
                            <div className="tv-icon"><i className="fas fa-gas-pump"></i></div>
                            <div className="tv-content">
                                <span className="tv-label">Fuel Used</span>
                                <span className="tv-value">{trip?.fuelUsed} L</span>
                            </div>
                        </div>

                        {/* Cost */}
                        <div className="tv-card cost">
                            <div className="tv-icon"><i className="fas fa-money-bill-wave"></i></div>
                            <div className="tv-content">
                                <span className="tv-label">Cost</span>
                                <span className="tv-value">Rs. {trip?.cost}</span>
                            </div>
                        </div>

                        {/* Consumption (Calculated if distance > 0) */}
                        <div className="tv-card avg">
                            <div className="tv-icon"><i className="fas fa-burn"></i></div>
                            <div className="tv-content">
                                <span className="tv-label">Avg Consump.</span>
                                <span className="tv-value">
                                    {trip?.distance > 0 ? ((trip.fuelUsed / trip.distance) * 100).toFixed(1) : 0} L/100km
                                </span>
                            </div>
                        </div>

                        {/* Stops */}
                        <div className="tv-card time">
                            <div className="tv-icon"><i className="fas fa-parking"></i></div>
                            <div className="tv-content">
                                <span className="tv-label">Stops</span>
                                <span className="tv-value">{trip?.stops?.length || 0}</span>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default TripView;
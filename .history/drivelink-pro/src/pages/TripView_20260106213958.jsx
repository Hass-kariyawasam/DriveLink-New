import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, deleteDoc } from 'firebase/firestore';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Map Layers
const STREET_MAP = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
const SATELLITE_MAP = 'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}';

const TripView = ({ auth, db }) => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [trip, setTrip] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isSatelliteMode, setIsSatelliteMode] = useState(true);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const mapInstance = useRef(null);
    const tileLayerRef = useRef(null);

    // 1. Fetch Trip Data
    useEffect(() => {
        const loadTrip = async () => {
            const user = auth.currentUser;
            if (user && id) {
                try {
                    const docRef = doc(db, `tripReports/${user.uid}/trips`, id);
                    const docSnap = await getDoc(docRef);
                    
                    if (docSnap.exists()) {
                        setTrip(docSnap.data());
                    } else {
                        alert("Trip not found!");
                        navigate('/tripreport');
                    }
                } catch (error) {
                    console.error("Error:", error);
                }
                setLoading(false);
            }
        };
        loadTrip();
    }, [id, navigate, auth, db]);

    // 2. Map Initialization
    useEffect(() => {
        if (!loading && trip && !mapInstance.current) {
            setTimeout(() => {
                const map = L.map('view-map', { zoomControl: false }).setView([6.9271, 79.8612], 13);
                
                tileLayerRef.current = L.tileLayer(SATELLITE_MAP, { maxZoom: 20 }).addTo(map);
                L.control.zoom({ position: 'bottomright' }).addTo(map);
                mapInstance.current = map;

                if (trip.path && trip.path.length > 0) {
                    const latlngs = trip.path.map(p => [p.lat, p.lng]);
                    
                    // Path Line
                    L.polyline(latlngs, { color: '#3699ff', weight: 6, opacity: 0.8 }).addTo(map);
                    
                    // Custom Markers
                    const startIcon = L.divIcon({ 
                        className: 'custom-marker marker-start', 
                        html: `<div class="marker-pin"></div><i class="fas fa-play marker-icon"></i>`, 
                        iconSize: [35, 45], 
                        iconAnchor: [17, 45] 
                    });
                    
                    const endIcon = L.divIcon({ 
                        className: 'custom-marker marker-end', 
                        html: `<div class="marker-pin"></div><i class="fas fa-flag-checkered marker-icon"></i>`, 
                        iconSize: [35, 45], 
                        iconAnchor: [17, 45] 
                    });

                    // Add Markers
                    L.marker(latlngs[0], { icon: startIcon }).addTo(map)
                        .bindPopup(`<strong>Start</strong><br>${new Date(trip.date).toLocaleTimeString()}`);
                    
                    L.marker(latlngs[latlngs.length - 1], { icon: endIcon }).addTo(map)
                        .bindPopup(`<strong>End</strong><br>${new Date(trip.date).toLocaleTimeString()}`);
                    
                    map.fitBounds(latlngs, { padding: [50, 50] });
                }
            }, 100);
        }
    }, [loading, trip]);

    // 3. Toggle Map
    const toggleMapMode = () => {
        if (mapInstance.current && tileLayerRef.current) {
            mapInstance.current.removeLayer(tileLayerRef.current);
            const newUrl = isSatelliteMode ? STREET_MAP : SATELLITE_MAP;
            tileLayerRef.current = L.tileLayer(newUrl, { maxZoom: 20 }).addTo(mapInstance.current);
            setIsSatelliteMode(!isSatelliteMode);
        }
    };

    // 4. Delete Trip Function
    const handleDeleteTrip = async () => {
        setDeleting(true);
        const user = auth.currentUser;
        if (!user) return;

        try {
            const tripRef = doc(db, `tripReports/${user.uid}/trips`, id);
            await deleteDoc(tripRef);
            alert("Trip deleted successfully!");
            navigate('/tripreport');
        } catch (error) {
            console.error("Error deleting trip:", error);
            alert("Failed to delete trip. Please try again.");
            setDeleting(false);
        }
    };

    if (loading) return <div style={{color:'white', padding:'20px'}}>Loading...</div>;

    return (
        <div className="dashboard-content" style={{padding: '20px'}}>
            {/* Enhanced Header */}
            <div className="trip-view-header">
                <button onClick={() => navigate('/tripreport')} className="back-btn-modern">
                    <i className="fas fa-arrow-left"></i>
                </button>
                <div className="trip-header-content">
                    <h1 className="trip-title">{trip?.tripName || "Trip View"}</h1>
                    <div className="trip-meta-bar">
                        <div className="meta-item">
                            <i className="fas fa-calendar"></i>
                            <span>{new Date(trip?.date).toLocaleDateString('en-GB', {day: '2-digit', month: 'short', year: 'numeric'})}</span>
                        </div>
                        <div className="meta-divider"></div>
                        <div className="meta-item">
                            <i className="fas fa-clock"></i>
                            <span>{new Date(trip?.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                        </div>
                        <div className="meta-divider"></div>
                        <div className="meta-item">
                            <i className="fas fa-route"></i>
                            <span>{trip?.distance} km</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="trip-container">
                {/* Map */}
                <div className="map-wrapper">
                    <div className="map-controls-top-right">
                        <div className="status-badge-completed">
                            <div className="blink-dot"></div> COMPLETED
                        </div>
                        <button className="map-toggle-btn" onClick={toggleMapMode}>
                            <i className={`fas ${isSatelliteMode ? 'fa-map' : 'fa-satellite'}`}></i>
                        </button>
                    </div>
                    <div id="view-map" style={{width: '100%', height: '50vh', minHeight: '400px'}}></div>
                </div>

                {/* Stats Grid */}
                <div className="trip-info-grid">
                    <TripCard icon="fa-road" label="Distance" value={`${trip?.distance} km`} color="#3699ff" />
                    <TripCard icon="fa-clock" label="Total Time" value={`${Math.floor(trip?.totalDuration)} min`} color="#8950fc" />
                    <TripCard icon="fa-stopwatch" label="Drive Time" value={`${Math.floor(trip?.movingDuration)} min`} color="#28a745" />
                    <TripCard icon="fa-tachometer-alt" label="Max Speed" value={`${trip?.topSpeed} km/h`} color="#f64e60" />
                    <TripCard icon="fa-gas-pump" label="Fuel Used" value={`${trip?.fuelUsed} L`} color="#ffa800" />
                    <TripCard icon="fa-money-bill-wave" label="Fuel Cost" value={`Rs. ${trip?.cost}`} color="#1bc5bd" />
                    <TripCard icon="fa-burn" label="Consumption" value={`${trip?.distance > 0 ? ((trip.fuelUsed / trip.distance) * 100).toFixed(2) : 0} L/100km`} color="#00d2fc" />
                    <TripCard icon="fa-parking" label="Total Stops" value={trip?.stops?.length || 0} color="#6c7293" />
                </div>

                {/* Delete Button */}
                <div style={{marginTop: '20px', textAlign: 'center'}}>
                    <button 
                        className="btn-delete-trip" 
                        onClick={() => setShowDeleteModal(true)}
                        disabled={deleting}
                    >
                        <i className="fas fa-trash-alt"></i>
                        {deleting ? 'Deleting...' : 'Delete Trip Report'}
                    </button>
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            {showDeleteModal && (
                <div className="save-modal-overlay" onClick={() => setShowDeleteModal(false)}>
                    <div className="save-modal" onClick={(e) => e.stopPropagation()}>
                        <i className="fas fa-exclamation-triangle" style={{fontSize: '48px', color: '#f64e60', marginBottom: '15px'}}></i>
                        <h2>Delete Trip Report?</h2>
                        <p style={{color: '#8fa2b6', marginBottom: '20px'}}>
                            This action cannot be undone. All trip data will be permanently deleted.
                        </p>
                        <div className="modal-actions">
                            <button className="btn-cancel" onClick={() => setShowDeleteModal(false)}>Cancel</button>
                            <button 
                                className="btn-confirm" 
                                style={{background: 'linear-gradient(135deg, #f64e60, #c43347)'}}
                                onClick={handleDeleteTrip}
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                .trip-view-header {
                    background: linear-gradient(135deg, #1e1e2d 0%, #252538 100%);
                    padding: 25px;
                    border-radius: 16px;
                    border: 1px solid rgba(255, 255, 255, 0.08);
                    display: flex;
                    align-items: center;
                    gap: 20px;
                    box-shadow: 0 4px 20px rgba(0,0,0,0.3);
                    margin-bottom: 20px;
                }

                .back-btn-modern {
                    width: 48px;
                    height: 48px;
                    border-radius: 12px;
                    background: rgba(255, 255, 255, 0.05);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    color: white;
                    font-size: 18px;
                    cursor: pointer;
                    transition: all 0.3s;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .back-btn-modern:hover {
                    background: rgba(54, 153, 255, 0.2);
                    border-color: #3699ff;
                    transform: translateX(-3px);
                }

                .trip-header-content {
                    flex: 1;
                }

                .trip-title {
                    font-size: 24px;
                    font-weight: 700;
                    color: white;
                    margin: 0 0 12px 0;
                }

                .trip-meta-bar {
                    display: flex;
                    align-items: center;
                    gap: 15px;
                    flex-wrap: wrap;
                }

                .meta-item {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    color: #8fa2b6;
                    font-size: 14px;
                }

                .meta-item i {
                    color: #3699ff;
                }

                .meta-divider {
                    width: 1px;
                    height: 20px;
                    background: rgba(255, 255, 255, 0.1);
                }

                .trip-container {
                    display: flex;
                    flex-direction: column;
                    gap: 15px;
                }

                .map-wrapper {
                    position: relative;
                    border-radius: 16px;
                    overflow: hidden;
                    box-shadow: 0 5px 15px rgba(0,0,0,0.3);
                    border: 2px solid rgba(255, 255, 255, 0.1);
                }

                .map-controls-top-right {
                    position: absolute;
                    top: 15px;
                    right: 15px;
                    z-index: 400;
                    display: flex;
                    gap: 10px;
                }

                .status-badge-completed {
                    background: #1bc5bd;
                    color: white;
                    padding: 0 12px;
                    border-radius: 8px;
                    font-weight: 700;
                    font-size: 12px;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    height: 40px;
                }

                .blink-dot {
                    width: 8px;
                    height: 8px;
                    background-color: white;
                    border-radius: 50%;
                    animation: blink 1s infinite;
                }

                @keyframes blink { 50% { opacity: 0; } }

                .map-toggle-btn {
                    background: rgba(0, 0, 0, 0.7);
                    border: 1px solid rgba(255, 255, 255, 0.2);
                    color: white;
                    width: 40px;
                    height: 40px;
                    border-radius: 8px;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 18px;
                    backdrop-filter: blur(5px);
                }

                .trip-info-grid {
                    display: grid;
                    grid-template-columns: repeat(4, 1fr);
                    gap: 12px;
                }

                .trip-card {
                    background: linear-gradient(135deg, #1e1e2d 0%, #252538 100%);
                    padding: 15px 20px;
                    border-radius: 12px;
                    display: flex;
                    align-items: center;
                    gap: 15px;
                    border: 1px solid rgba(255, 255, 255, 0.05);
                    transition: all 0.3s ease;
                }

                .trip-card:hover {
                    transform: translateY(-3px);
                    box-shadow: 0 5px 20px rgba(0,0,0,0.3);
                }

                .trip-icon {
                    width: 40px;
                    height: 40px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 10px;
                    font-size: 18px;
                }

                .trip-details {
                    display: flex;
                    flex-direction: column;
                }

                .trip-label {
                    font-size: 11px;
                    color: #8fa2b6;
                    text-transform: uppercase;
                    font-weight: 600;
                }

                .trip-value {
                    font-size: 16px;
                    font-weight: 700;
                    color: #fff;
                }

                .btn-delete-trip {
                    background: linear-gradient(135deg, #ff4d4d, #c43347);
                    color: white;
                    border: none;
                    padding: 12px 25px;
                    border-radius: 8px;
                    font-size: 14px;
                    font-weight: 600;
                    cursor: pointer;
                    box-shadow: 0 4px 15px rgba(255, 77, 77, 0.3);
                    transition: all 0.3s ease;
                    display: inline-flex;
                    align-items: center;
                    gap: 8px;
                }

                .btn-delete-trip:hover {
                    background: linear-gradient(135deg, #ff1a1a, #a82032);
                    transform: translateY(-2px);
                    box-shadow: 0 6px 20px rgba(255, 77, 77, 0.5);
                }

                .btn-delete-trip:disabled {
                    opacity: 0.6;
                    cursor: not-allowed;
                }

                .save-modal-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0, 0, 0, 0.85);
                    backdrop-filter: blur(5px);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 9999;
                }

                .save-modal {
                    background: #1e1e2d;
                    padding: 25px;
                    border-radius: 16px;
                    width: 90%;
                    max-width: 350px;
                    text-align: center;
                    border: 1px solid rgba(255, 255, 255, 0.1);
                }

                .save-modal h2 {
                    color: white;
                    margin: 10px 0;
                }

                .modal-actions {
                    display: flex;
                    gap: 10px;
                    margin-top: 20px;
                }

                .btn-confirm, .btn-cancel {
                    flex: 1;
                    padding: 10px;
                    border-radius: 8px;
                    border: none;
                    cursor: pointer;
                    font-weight: 600;
                }

                .btn-confirm {
                    background: #1bc5bd;
                    color: white;
                }

                .btn-cancel {
                    background: #363645;
                    color: white;
                }

                .custom-marker {
                    background: transparent !important;
                    border: none !important;
                }

                .marker-pin {
                    width: 0;
                    height: 0;
                    border-left: 12px solid transparent;
                    border-right: 12px solid transparent;
                    border-top: 30px solid #3699ff;
                    position: absolute;
                    bottom: 0;
                    left: 50%;
                    transform: translateX(-50%);
                }

                .marker-start .marker-pin {
                    border-top-color: #1bc5bd;
                }

                .marker-end .marker-pin {
                    border-top-color: #f64e60;
                }

                .marker-icon {
                    position: absolute;
                    top: 3px;
                    left: 50%;
                    transform: translateX(-50%);
                    color: white;
                    font-size: 12px;
                    z-index: 10;
                }

                @media (max-width: 768px) {
                    .trip-info-grid {
                        grid-template-columns: repeat(2, 1fr);
                    }

                    .btn-delete-trip {
                        width: 100%;
                        justify-content: center;
                    }
                }
            `}</style>
        </div>
    );
};

const TripCard = ({ icon, label, value, color }) => (
    <div className="trip-card">
        <div className="trip-icon" style={{color: color, background: `${color}15`}}>
            <i className={`fas ${icon}`}></i>
        </div>
        <div className="trip-details">
            <span className="trip-label">{label}</span>
            <span className="trip-value">{value}</span>
        </div>
    </div>
);

export default TripView;
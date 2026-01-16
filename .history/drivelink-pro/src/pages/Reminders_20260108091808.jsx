import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { auth, db } from '../firebase';
import { collection, addDoc, getDocs, deleteDoc, doc, query, orderBy, getDoc } from 'firebase/firestore';
import { onAuthStateChanged } from "firebase/auth";
import { toast } from 'react-toastify';
import '../css/reminders.css';

const Reminders = () => {
    const [reminders, setReminders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [userUid, setUserUid] = useState(null);
    const [deviceId, setDeviceId] = useState("UnknownDevice");

    const [newItem, setNewItem] = useState({
        title: '', date: '', startTime: '', description: '', category: 'Other', color: '#3699ff'
    });

    const categoryColors = {
        'Service': '#3699ff',
        'Insurance': '#1bc5bd',
        'License': '#ffa800',
        'Repair': '#f64e60',
        'Other': '#8950fc'
    };

    const getUserData = async (uid) => {
        try {
            const userDoc = await getDoc(doc(db, "users", uid));
            if (userDoc.exists()) {
                const dId = userDoc.data().deviceId || "UnknownDevice";
                setDeviceId(dId);
                return dId;
            }
        } catch (err) { console.error(err); }
        return "UnknownDevice";
    };

    const fetchReminders = async (uid, devId) => {
        try {
            const q = query(collection(db, "reminders", uid, devId), orderBy("date", "asc"));
            const querySnapshot = await getDocs(q);
            const loaded = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setReminders(loaded);
        } catch (err) { console.error(err); }
        setLoading(false);
    };

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                setUserUid(user.uid);
                const devId = await getUserData(user.uid);
                fetchReminders(user.uid, devId);
            } else { setLoading(false); }
        });
        return () => unsubscribe();
    }, []);

    const handleAdd = async (e) => {
        e.preventDefault();
        if (isSaving) return;

        setIsSaving(true);
        try {
            const colRef = collection(db, "reminders", userUid, deviceId);
            const reminderData = {
                ...newItem,
                color: categoryColors[newItem.category] || '#3699ff',
                createdAt: new Date().toISOString()
            };
            await addDoc(colRef, reminderData);
            
            setIsModalOpen(false);
            setNewItem({ title: '', date: '', startTime: '', description: '', category: 'Other', color: '#3699ff' });
            await fetchReminders(userUid, deviceId);
            toast.success("Reminder Saved!");
        } catch (error) {
            console.error("Error saving reminder:", error);
            toast.error("Failed to save");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Delete this reminder?")) return;
        try {
            await deleteDoc(doc(db, "reminders", userUid, deviceId, id));
            setReminders(prev => prev.filter(r => r.id !== id));
            toast.success("Deleted!");
        } catch (error) { console.error(error); }
    };

    if (loading) return (
        <Layout>
            <div className="loading-state" style={{height:'80vh', display:'flex', flexDirection:'column', justifyContent:'center', alignItems:'center'}}>
                <i className="fas fa-spinner fa-spin" style={{fontSize:'40px', color:'#3699ff', marginBottom:'15px'}}></i>
                <p style={{color:'#8fa2b6'}}>Loading reminders...</p>
            </div>
        </Layout>
    );

    return (
        <Layout>
            <div className="dashboard-content">
                
                {/* Header */}
                <div className="main-header">
                    <div className="header-left">
                        <h1>Vehicle Reminders</h1>
                        <span className="breadcrumb">Maintenance & Scheduling</span>
                    </div>
                    <button className="add-reminder-btn" onClick={() => setIsModalOpen(true)}>
                        <i className="fas fa-plus"></i> Add Reminder
                    </button>
                </div>

                {/* Summary Stats */}
                <div className="reminder-stats">
                    <div className="stat-box">
                        <i className="fas fa-calendar-check"></i>
                        <div>
                            <span className="stat-label">Total</span>
                            <span className="stat-value">{reminders.length}</span>
                        </div>
                    </div>
                    <div className="stat-box">
                        <i className="fas fa-clock"></i>
                        <div>
                            <span className="stat-label">Upcoming</span>
                            <span className="stat-value">{reminders.filter(r => new Date(r.date) > new Date()).length}</span>
                        </div>
                    </div>
                    <div className="stat-box">
                        <i className="fas fa-exclamation-circle"></i>
                        <div>
                            <span className="stat-label">Overdue</span>
                            <span className="stat-value">{reminders.filter(r => new Date(r.date) < new Date()).length}</span>
                        </div>
                    </div>
                </div>

                {/* Reminders Grid */}
                {reminders.length === 0 ? (
                    <div className="empty-state-modern">
                        <i className="fas fa-bell-slash"></i>
                        <h3>No reminders yet</h3>
                        <p>Start tracking your vehicle maintenance and events</p>
                        <button className="add-first-btn" onClick={() => setIsModalOpen(true)}>
                            <i className="fas fa-plus"></i> Create First Reminder
                        </button>
                    </div>
                ) : (
                    <div className="reminders-grid-modern">
                        {reminders.map((item) => {
                            const isOverdue = new Date(item.date) < new Date();
                            return (
                                <div key={item.id} className={`reminder-card-modern ${isOverdue ? 'overdue' : ''}`}>
                                    <div className="card-accent" style={{background: item.color}}></div>
                                    
                                    <div className="card-header-modern">
                                        <span className="category-badge" style={{background: `${item.color}20`, color: item.color}}>
                                            <i className={`fas ${getCategoryIcon(item.category)}`}></i>
                                            {item.category}
                                        </span>
                                        <button onClick={() => handleDelete(item.id)} className="delete-btn-modern">
                                            <i className="fas fa-trash-alt"></i>
                                        </button>
                                    </div>

                                    <div className="card-body-modern">
                                        <h3 className="reminder-title">{item.title}</h3>
                                        {item.description && (
                                            <p className="reminder-description">{item.description}</p>
                                        )}
                                        
                                        <div className="reminder-datetime">
                                            <div className="datetime-item">
                                                <i className="fas fa-calendar"></i>
                                                <span>{new Date(item.date).toLocaleDateString('en-GB', {day: '2-digit', month: 'short', year: 'numeric'})}</span>
                                            </div>
                                            <div className="datetime-item">
                                                <i className="fas fa-clock"></i>
                                                <span>{item.startTime}</span>
                                            </div>
                                        </div>

                                        {isOverdue && (
                                            <div className="overdue-badge">
                                                <i className="fas fa-exclamation-triangle"></i> Overdue
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Modal */}
                {isModalOpen && (
                    <div className="modal-overlay-modern">
                        <div className="modal-modern">
                            <div className="modal-header-modern">
                                <h2><i className="fas fa-bell"></i> Create Reminder</h2>
                                <button onClick={() => setIsModalOpen(false)} className="close-btn-modern">
                                    <i className="fas fa-times"></i>
                                </button>
                            </div>

                            <form onSubmit={handleAdd} className="modal-form">
                                <div className="form-group-modern">
                                    <label><i className="fas fa-tag"></i> Category</label>
                                    <select value={newItem.category} onChange={(e) => setNewItem({...newItem, category: e.target.value})}>
                                        <option value="Service">Service</option>
                                        <option value="Insurance">Insurance</option>
                                        <option value="License">Revenue License</option>
                                        <option value="Repair">Repair</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>

                                <div className="form-group-modern">
                                    <label><i className="fas fa-heading"></i> Title</label>
                                    <input 
                                        type="text" 
                                        required 
                                        placeholder="Ex: Change Engine Oil" 
                                        value={newItem.title} 
                                        onChange={(e) => setNewItem({...newItem, title: e.target.value})} 
                                    />
                                </div>

                                <div className="form-row-modern">
                                    <div className="form-group-modern">
                                        <label><i className="fas fa-calendar"></i> Date</label>
                                        <input 
                                            type="date" 
                                            required 
                                            value={newItem.date}
                                            onChange={(e) => setNewItem({...newItem, date: e.target.value})} 
                                        />
                                    </div>
                                    <div className="form-group-modern">
                                        <label><i className="fas fa-clock"></i> Time</label>
                                        <input 
                                            type="time" 
                                            required 
                                            value={newItem.startTime}
                                            onChange={(e) => setNewItem({...newItem, startTime: e.target.value})} 
                                        />
                                    </div>
                                </div>

                                <div className="form-group-modern">
                                    <label><i className="fas fa-align-left"></i> Notes (Optional)</label>
                                    <textarea 
                                        placeholder="Any specific details..." 
                                        value={newItem.description}
                                        onChange={(e) => setNewItem({...newItem, description: e.target.value})}
                                        rows="3"
                                    ></textarea>
                                </div>

                                <button type="submit" className="submit-btn-modern" disabled={isSaving}>
                                    {isSaving ? (
                                        <><i className="fas fa-spinner fa-spin"></i> Saving...</>
                                    ) : (
                                        <><i className="fas fa-save"></i> Save Reminder</>
                                    )}
                                </button>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </Layout>
    );
};

// Helper function for category icons
const getCategoryIcon = (category) => {
    const icons = {
        'Service': 'fa-wrench',
        'Insurance': 'fa-shield-halved',
        'License': 'fa-id-card',
        'Repair': 'fa-screwdriver-wrench',
        'Other': 'fa-circle-info'
    };
    return icons[category] || 'fa-bell';
};

export default Reminders;
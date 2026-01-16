import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { auth, db } from '../firebase';
import { collection, addDoc, getDocs, deleteDoc, doc, query, orderBy } from 'firebase/firestore';
import { onAuthStateChanged } from "firebase/auth";
import '../css/reminders.css';

const Reminders = () => {
    const [reminders, setReminders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [userUid, setUserUid] = useState(null);

    // Form State (New Data Structure)
    const [newItem, setNewItem] = useState({
        title: '',
        date: '',
        startTime: '',
        description: '',
        color: '#28a745' // Default Green
    });

    // 🔥 FIX: fetchReminders එක මුලින්ම Define කළා (useEffect එකට කලින්)
    const fetchReminders = async (uid) => {
        try {
            const q = query(collection(db, `users/${uid}/reminders`), orderBy("date", "asc"));
            const querySnapshot = await getDocs(q);
            const loaded = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setReminders(loaded);
        } catch (error) {
            console.error("Error loading reminders:", error);
        }
        setLoading(false);
    };

    // 1. Load Reminders (දැන් මේක හරි)
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                setUserUid(user.uid);
                fetchReminders(user.uid);
            } else {
                setLoading(false);
            }
        });
        return () => unsubscribe();
    }, []);

    // 2. Add Reminder
    const handleAdd = async (e) => {
        e.preventDefault();
        if (!newItem.title || !newItem.date) return alert("Title and Date are required");

        try {
            await addDoc(collection(db, `users/${userUid}/reminders`), {
                title: newItem.title,
                date: newItem.date,
                startTime: newItem.startTime || "00:00",
                description: newItem.description || "",
                color: newItem.color,
                createdAt: new Date().toISOString()
            });
            setIsModalOpen(false);
            setNewItem({ title: '', date: '', startTime: '', description: '', color: '#28a745' }); 
            fetchReminders(userUid); 
            alert("Reminder added!");
        } catch (error) {
            console.error("Error adding:", error);
        }
    };

    // 3. Delete Reminder
    const handleDelete = async (id) => {
        if (!window.confirm("Delete this reminder?")) return;
        try {
            await deleteDoc(doc(db, `users/${userUid}/reminders`, id));
            setReminders(reminders.filter(item => item.id !== id));
        } catch (error) {
            console.error("Error deleting:", error);
        }
    };

    // Helper: Calculate Days Left
    const getDaysLeft = (targetDate) => {
        const diff = new Date(targetDate) - new Date();
        const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
        return days;
    };

    if (loading) return <Layout><div style={{color:'white', padding:'20px'}}>Loading...</div></Layout>;

    return (
        <Layout>
            <div className="dashboard-content">
                <div className="main-header">
                    <div className="header-left">
                        <h1>Reminders</h1>
                        <span className="breadcrumb">Service & Maintenance Schedule</span>
                    </div>
                    <button className="btn-add-rem" onClick={() => setIsModalOpen(true)}>
                        <i className="fas fa-plus"></i> Add Reminder
                    </button>
                </div>

                <div className="rem-container">
                    {reminders.length === 0 ? (
                        <div className="empty-rem-state">
                            <i className="fas fa-bell-slash"></i>
                            <h3>No Reminders Found</h3>
                            <p>Tap "Add Reminder" to schedule a service or task.</p>
                        </div>
                    ) : (
                        <div className="rem-grid">
                            {reminders.map((item) => {
                                const daysLeft = getDaysLeft(item.date);
                                const isOverdue = daysLeft < 0;

                                return (
                                    <div key={item.id} className="rem-card" style={{borderLeft: `4px solid ${item.color || '#28a745'}`}}>
                                        <div className="rem-icon-box" style={{color: item.color || '#28a745', background: `${item.color || '#28a745'}15`}}>
                                            <i className="fas fa-bell"></i>
                                        </div>
                                        <div className="rem-details">
                                            <div className="rem-top">
                                                <span className="rem-time-badge">
                                                    <i className="far fa-clock"></i> {item.startTime || 'All Day'}
                                                </span>
                                                <button onClick={() => handleDelete(item.id)} className="btn-del-mini">
                                                    <i className="fas fa-trash-alt"></i>
                                                </button>
                                            </div>
                                            
                                            <h3 style={{color: isOverdue ? '#f64e60' : 'white'}}>{item.title}</h3>
                                            
                                            {item.description && (
                                                <p className="rem-desc">{item.description}</p>
                                            )}

                                            <div className="rem-footer-row">
                                                <div className="rem-date">
                                                    <i className="far fa-calendar-alt"></i> {item.date}
                                                </div>
                                                <span className={`days-badge ${isOverdue ? 'overdue' : 'upcoming'}`}>
                                                    {isOverdue ? `${Math.abs(daysLeft)} Days Overdue` : 
                                                     daysLeft === 0 ? "Today!" : 
                                                     `${daysLeft} Days Left`}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>

                {/* MODAL FOR ADDING */}
                {isModalOpen && (
                    <div className="modal-overlay">
                        <div className="modal-box">
                            <div className="modal-header">
                                <h2>New Reminder</h2>
                                <button onClick={() => setIsModalOpen(false)}><i className="fas fa-times"></i></button>
                            </div>
                            <form onSubmit={handleAdd}>
                                <div className="input-group">
                                    <label>Title</label>
                                    <input 
                                        type="text" 
                                        placeholder="e.g., Service Vehicle" 
                                        value={newItem.title}
                                        onChange={(e) => setNewItem({...newItem, title: e.target.value})}
                                        required 
                                    />
                                </div>
                                
                                <div className="form-row-split">
                                    <div className="input-group">
                                        <label>Date</label>
                                        <input 
                                            type="date" 
                                            value={newItem.date}
                                            onChange={(e) => setNewItem({...newItem, date: e.target.value})}
                                            required 
                                        />
                                    </div>
                                    <div className="input-group">
                                        <label>Time</label>
                                        <input 
                                            type="time" 
                                            value={newItem.startTime}
                                            onChange={(e) => setNewItem({...newItem, startTime: e.target.value})}
                                        />
                                    </div>
                                </div>

                                <div className="input-group">
                                    <label>Description</label>
                                    <textarea 
                                        placeholder="Add details..."
                                        value={newItem.description}
                                        onChange={(e) => setNewItem({...newItem, description: e.target.value})}
                                        rows="3"
                                    ></textarea>
                                </div>

                                <div className="input-group">
                                    <label>Label Color</label>
                                    <div className="color-options">
                                        {['#28a745', '#3699ff', '#f59e0b', '#dc3545', '#8950fc'].map(clr => (
                                            <div 
                                                key={clr}
                                                className={`color-circle ${newItem.color === clr ? 'active' : ''}`}
                                                style={{background: clr}}
                                                onClick={() => setNewItem({...newItem, color: clr})}
                                            >
                                                {newItem.color === clr && <i className="fas fa-check"></i>}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <button type="submit" className="btn-save-rem" style={{background: newItem.color}}>
                                    Save Task
                                </button>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </Layout>
    );
};

export default Reminders;
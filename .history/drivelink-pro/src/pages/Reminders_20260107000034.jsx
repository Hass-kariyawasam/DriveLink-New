import React, { useState, useEffect, useCallback } from 'react';
import Layout from '../components/Layout';
import { auth, db } from '../firebase';
import { collection, addDoc, getDocs, deleteDoc, doc, query, orderBy } from 'firebase/firestore';
import { onAuthStateChanged } from "firebase/auth";
import { toast } from 'react-toastify';
import '../css/reminders.css';

const Reminders = () => {
    const [reminders, setReminders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [userUid, setUserUid] = useState(null);
    const [notifiedIds, setNotifiedIds] = useState(new Set());

    const [newItem, setNewItem] = useState({
        title: '', date: '', startTime: '', description: '', color: '#3699ff'
    });

    // 🔥 FIX 1: ශ්‍රිතය මුලින්ම Define කිරීම (Hoisting Issue විසඳීමට)
    const sendLocalNotification = useCallback((title, body) => {
        toast.info(`${title}: ${body}`, { theme: "dark" });
        if (Notification.permission === "granted") {
            new Notification(title, { body, icon: '/logo.png' });
        }
    }, []);

    // 1. Notification Logic
    useEffect(() => {
        const checkReminders = () => {
            const now = new Date();
            reminders.forEach(rem => {
                if (notifiedIds.has(rem.id)) return;

                const remDateTime = new Date(`${rem.date}T${rem.startTime}`);
                const diffInMs = remDateTime - now;
                const diffInMins = Math.floor(diffInMs / (1000 * 60));

                if (diffInMins === 5) {
                    sendLocalNotification(`Upcoming: ${rem.title}`, "Starts in 5 minutes!");
                    setNotifiedIds(prev => new Set(prev).add(rem.id));
                }
                
                if (diffInMs < 0 && !notifiedIds.has(rem.id)) {
                    if (now.toDateString() === remDateTime.toDateString()) {
                        sendLocalNotification(`Missed Alert: ${rem.title}`, `Scheduled for ${rem.startTime}`);
                        setNotifiedIds(prev => new Set(prev).add(rem.id));
                    }
                }
            });
        };

        const interval = setInterval(checkReminders, 30000);
        return () => clearInterval(interval);
    }, [reminders, notifiedIds, sendLocalNotification]);

    // 2. Data Fetching
    const fetchReminders = async (uid) => {
        try {
            const q = query(collection(db, `users/${uid}/reminders`), orderBy("date", "asc"));
            const querySnapshot = await getDocs(q);
            const loaded = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setReminders(loaded);
        } catch (err) { 
            console.error("Error fetching:", err); 
        }
        setLoading(false);
    };

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                setUserUid(user.uid);
                fetchReminders(user.uid);
            } else setLoading(false);
        });
        return () => unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleAdd = async (e) => {
        e.preventDefault();
        try {
            await addDoc(collection(db, `users/${userUid}/reminders`), {
                ...newItem,
                createdAt: new Date().toISOString()
            });
            setIsModalOpen(false);
            setNewItem({ title: '', date: '', startTime: '', description: '', color: '#3699ff' });
            fetchReminders(userUid);
            toast.success("Reminder Saved!");
        } catch (error) { 
            // 🔥 FIX 2: පාවිච්චි නොකළ 'e' වෙනුවට 'error' භාවිත කිරීම
            console.error("Save failed:", error);
            toast.error("Failed to save"); 
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Delete?")) return;
        try {
            await deleteDoc(doc(db, `users/${userUid}/reminders`, id));
            setReminders(reminders.filter(r => r.id !== id));
        } catch (error) {
            console.error("Delete failed:", error);
        }
    };

    const getDaysLeft = (targetDate) => {
        const diff = new Date(targetDate) - new Date();
        return Math.ceil(diff / (1000 * 60 * 60 * 24));
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
                            <p>Tap "Add Reminder" to schedule a task.</p>
                        </div>
                    ) : (
                        <div className="rem-grid">
                            {reminders.map((item) => {
                                const daysLeft = getDaysLeft(item.date);
                                const isOverdue = daysLeft < 0;

                                return (
                                    <div key={item.id} className="rem-card" style={{borderLeft: `4px solid ${item.color}`}}>
                                        <div className="rem-details">
                                            <div className="rem-top">
                                                <span className="rem-time-badge">
                                                    <i className="far fa-clock"></i> {item.startTime}
                                                </span>
                                                <button onClick={() => handleDelete(item.id)} className="btn-del-mini">
                                                    <i className="fas fa-trash-alt"></i>
                                                </button>
                                            </div>
                                            <h3>{item.title}</h3>
                                            <p className="rem-desc">{item.description}</p>
                                            <div className="rem-footer-row">
                                                <div className="rem-date">
                                                    <i className="far fa-calendar-alt"></i> {item.date}
                                                </div>
                                                <span className={`days-badge ${isOverdue ? 'overdue' : 'upcoming'}`}>
                                                    {isOverdue ? "Overdue" : `${daysLeft} Days Left`}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>

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
                                    <input type="text" required onChange={(e) => setNewItem({...newItem, title: e.target.value})} />
                                </div>
                                <div className="form-row-split">
                                    <div className="input-group"><label>Date</label><input type="date" required onChange={(e) => setNewItem({...newItem, date: e.target.value})} /></div>
                                    <div className="input-group"><label>Time</label><input type="time" required onChange={(e) => setNewItem({...newItem, startTime: e.target.value})} /></div>
                                </div>
                                <div className="input-group">
                                    <label>Description</label>
                                    <textarea onChange={(e) => setNewItem({...newItem, description: e.target.value})} rows="3"></textarea>
                                </div>
                                <div className="input-group">
                                    <label>Color</label>
                                    <div className="color-options">
                                        {['#3699ff', '#22c55e', '#f64e60', '#ffa800'].map(c => (
                                            <div key={c} className={`color-circle ${newItem.color === c ? 'active' : ''}`} style={{background: c}} onClick={() => setNewItem({...newItem, color: c})} />
                                        ))}
                                    </div>
                                </div>
                                <button type="submit" className="btn-save-rem" style={{background: newItem.color}}>Save Task</button>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </Layout>
    );
};

export default Reminders;
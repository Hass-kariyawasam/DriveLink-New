import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { auth, db } from '../firebase';
import { collection, addDoc, getDocs, deleteDoc, doc, query, orderBy } from 'firebase/firestore';
import { onAuthStateChanged } from "firebase/auth";
import '../css/reminders.css'; // Next step: Create this CSS

const Reminders = () => {
    const [reminders, setReminders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [userUid, setUserUid] = useState(null);

    // Form State
    const [newItem, setNewItem] = useState({
        title: '',
        date: '',
        type: 'Service' // Default
    });

    // 1. Load Reminders
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

    // 2. Add Reminder
    const handleAdd = async (e) => {
        e.preventDefault();
        if (!newItem.title || !newItem.date) return alert("Please fill all fields");

        try {
            await addDoc(collection(db, `users/${userUid}/reminders`), {
                title: newItem.title,
                date: newItem.date,
                type: newItem.type,
                createdAt: new Date()
            });
            setIsModalOpen(false);
            setNewItem({ title: '', date: '', type: 'Service' }); // Reset
            fetchReminders(userUid); // Refresh list
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

    // Helper: Get Icon based on Type
    const getIcon = (type) => {
        switch (type) {
            case 'Insurance': return 'fa-shield-alt';
            case 'License': return 'fa-id-card';
            case 'Service': return 'fa-wrench';
            case 'Payment': return 'fa-file-invoice-dollar';
            default: return 'fa-bell';
        }
    };

    if (loading) return <Layout><div style={{color:'white', padding:'20px'}}>Loading Reminders...</div></Layout>;

    return (
        <Layout>
            <div className="dashboard-content">
                <div className="main-header">
                    <div className="header-left">
                        <h1>Reminders</h1>
                        <span className="breadcrumb">Don't miss important dates</span>
                    </div>
                    <button className="btn-add-rem" onClick={() => setIsModalOpen(true)}>
                        <i className="fas fa-plus"></i> Add New
                    </button>
                </div>

                <div className="rem-container">
                    {reminders.length === 0 ? (
                        <div className="empty-rem-state">
                            <i className="fas fa-calendar-check"></i>
                            <h3>No Reminders Yet</h3>
                            <p>Add service dates, insurance renewals, or license expiry dates.</p>
                        </div>
                    ) : (
                        <div className="rem-grid">
                            {reminders.map((item) => {
                                const daysLeft = getDaysLeft(item.date);
                                const isOverdue = daysLeft < 0;
                                const isUrgent = daysLeft >= 0 && daysLeft <= 7;

                                return (
                                    <div key={item.id} className={`rem-card ${isOverdue ? 'overdue' : ''} ${isUrgent ? 'urgent' : ''}`}>
                                        <div className="rem-icon-box">
                                            <i className={`fas ${getIcon(item.type)}`}></i>
                                        </div>
                                        <div className="rem-details">
                                            <div className="rem-top">
                                                <span className="rem-type">{item.type}</span>
                                                <button onClick={() => handleDelete(item.id)} className="btn-del-mini"><i className="fas fa-times"></i></button>
                                            </div>
                                            <h3>{item.title}</h3>
                                            <div className="rem-date-row">
                                                <span><i className="far fa-calendar"></i> {item.date}</span>
                                                <span className={`days-badge ${isOverdue ? 'red' : isUrgent ? 'orange' : 'green'}`}>
                                                    {isOverdue ? `${Math.abs(daysLeft)} days overdue` : 
                                                     daysLeft === 0 ? "Today!" : 
                                                     `${daysLeft} days left`}
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
                                        placeholder="e.g., Insurance Renewal" 
                                        value={newItem.title}
                                        onChange={(e) => setNewItem({...newItem, title: e.target.value})}
                                        required 
                                    />
                                </div>
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
                                    <label>Category</label>
                                    <select 
                                        value={newItem.type}
                                        onChange={(e) => setNewItem({...newItem, type: e.target.value})}
                                    >
                                        <option value="Service">Service / Repair</option>
                                        <option value="Insurance">Insurance</option>
                                        <option value="License">Revenue License</option>
                                        <option value="Payment">Lease / Payment</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>
                                <button type="submit" className="btn-save-rem">Save Reminder</button>
                            </form>
                        </div>
                    </div>
                )}

            </div>
        </Layout>
    );
};

export default Reminders;
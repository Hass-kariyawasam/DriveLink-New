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
    const [userUid, setUserUid] = useState(null);
    const [deviceId, setDeviceId] = useState("UnknownDevice");

    const [newItem, setNewItem] = useState({
        title: '', 
        date: '', 
        startTime: '', 
        description: '', 
        category: 'Other', // Default Category
        color: '#3699ff'
    });

    // 1. Fetch User Data (To get DeviceID)
    const getUserData = async (uid) => {
        try {
            const userDoc = await getDoc(doc(db, "users", uid));
            if (userDoc.exists()) {
                setDeviceId(userDoc.data().deviceId || "UnknownDevice");
                return userDoc.data().deviceId;
            }
        } catch (err) {
            console.error("Error fetching user data:", err);
        }
        return "UnknownDevice";
    };

    // 2. Fetch Reminders from New Path
    const fetchReminders = async (uid, devId) => {
        try {
            // Path: reminders/{userUid}/{deviceId}/remindersList
            const q = query(
                collection(db, `reminders/${uid}/${devId}/remindersList`), 
                orderBy("date", "asc")
            );
            const querySnapshot = await getDocs(q);
            const loaded = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setReminders(loaded);
        } catch (err) { 
            console.error("Error fetching:", err); 
        }
        setLoading(false);
    };

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                setUserUid(user.uid);
                const devId = await getUserData(user.uid);
                fetchReminders(user.uid, devId);
            } else {
                setLoading(false);
            }
        });
        return () => unsubscribe();
    }, []);

    // 3. Add Reminder to New Path
    const handleAdd = async (e) => {
        e.preventDefault();
        try {
            const path = `reminders/${userUid}/${deviceId}/remindersList`;
            await addDoc(collection(db, path), {
                ...newItem,
                createdAt: new Date().toISOString()
            });
            setIsModalOpen(false);
            setNewItem({ title: '', date: '', startTime: '', description: '', category: 'Other', color: '#3699ff' });
            fetchReminders(userUid, deviceId);
            toast.success("Reminder Saved!");
        } catch (error) { 
            console.error("Save failed:", error);
            toast.error("Failed to save"); 
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Delete this reminder?")) return;
        try {
            const path = `reminders/${userUid}/${deviceId}/remindersList`;
            await deleteDoc(doc(db, path, id));
            setReminders(reminders.filter(r => r.id !== id));
        } catch (error) {
            console.error("Delete failed:", error);
        }
    };

    if (loading) return <Layout><div className="loading-box">Loading...</div></Layout>;

    return (
        <Layout>
            <div className="dashboard-content">
                <div className="main-header">
                    <div className="header-left">
                        <h1>Reminders</h1>
                        <span className="breadcrumb">Vehicle: {deviceId}</span>
                    </div>
                    <button className="btn-add-rem" onClick={() => setIsModalOpen(true)}>
                        <i className="fas fa-plus"></i> Add New
                    </button>
                </div>

                <div className="rem-grid">
                    {reminders.map((item) => (
                        <div key={item.id} className="rem-card" style={{borderLeft: `5px solid ${item.color}`}}>
                            <div className="rem-details">
                                <div className="rem-top">
                                    <span className="category-tag">{item.category}</span>
                                    <button onClick={() => handleDelete(item.id)} className="btn-del-mini">
                                        <i className="fas fa-trash"></i>
                                    </button>
                                </div>
                                <h3>{item.title}</h3>
                                <p className="rem-desc">{item.description}</p>
                                <div className="rem-footer-row">
                                    <span><i className="far fa-calendar"></i> {item.date}</span>
                                    <span><i className="far fa-clock"></i> {item.startTime}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {isModalOpen && (
                    <div className="modal-overlay">
                        <div className="modal-box">
                            <h2>New Reminder</h2>
                            <form onSubmit={handleAdd}>
                                <div className="input-group">
                                    <label>Category</label>
                                    <select 
                                        value={newItem.category} 
                                        onChange={(e) => setNewItem({...newItem, category: e.target.value})}
                                    >
                                        <option value="Other">Other</option>
                                        <option value="Service">Service</option>
                                        <option value="Insurance">Insurance</option>
                                        <option value="License">Revenue License</option>
                                        <option value="Repair">Repair</option>
                                    </select>
                                </div>

                                <div className="input-group">
                                    <label>Title</label>
                                    <input type="text" required value={newItem.title} onChange={(e) => setNewItem({...newItem, title: e.target.value})} />
                                </div>

                                <div className="form-row-split">
                                    <div className="input-group"><label>Date</label><input type="date" required onChange={(e) => setNewItem({...newItem, date: e.target.value})} /></div>
                                    <div className="input-group"><label>Time</label><input type="time" required onChange={(e) => setNewItem({...newItem, startTime: e.target.value})} /></div>
                                </div>

                                <div className="input-group">
                                    <label>Description</label>
                                    <textarea onChange={(e) => setNewItem({...newItem, description: e.target.value})} rows="3"></textarea>
                                </div>

                                <button type="submit" className="btn-save-rem">Save Reminder</button>
                                <button type="button" className="btn-cancel" onClick={() => setIsModalOpen(false)}>Cancel</button>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </Layout>
    );
};

export default Reminders;
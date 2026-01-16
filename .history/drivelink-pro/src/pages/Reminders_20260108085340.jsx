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
            await addDoc(colRef, { ...newItem, createdAt: new Date().toISOString() });
            
            setIsModalOpen(false);
            setNewItem({ title: '', date: '', startTime: '', description: '', category: 'Other', color: '#3699ff' });
            await fetchReminders(userUid, deviceId);
            toast.success("Reminder Saved!");
        } catch (error) {
            console.error("Error saving reminder:", error); // 🔥 FIX: error විචල්‍යය මෙතැන පාවිච්චි කළා
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

    if (loading) return <Layout><div className="rem-loading">Loading...</div></Layout>;

    return (
        <Layout>
            <div className="reminders-page">
                <div className="rem-header">
                    <div>
                        <h1>Vehicle Reminders</h1>
                        <p className="device-id-tag">ID: {deviceId}</p>
                    </div>
                    <button className="add-btn-main" onClick={() => setIsModalOpen(true)}>
                        <i className="fas fa-plus"></i> Add New
                    </button>
                </div>

                {reminders.length === 0 ? (
                    <div className="empty-state">
                        <i className="fas fa-calendar-alt"></i>
                        <p>No reminders scheduled.</p>
                    </div>
                ) : (
                    <div className="rem-list-grid">
                        {reminders.map((item) => (
                            <div key={item.id} className="reminder-card" style={{borderColor: item.color}}>
                                <div className="card-accent" style={{background: item.color}}></div>
                                <div className="card-content">
                                    <div className="card-top">
                                        <span className="cat-label">{item.category}</span>
                                        <button onClick={() => handleDelete(item.id)} className="del-btn">
                                            <i className="fas fa-trash-alt"></i>
                                        </button>
                                    </div>
                                    <h3>{item.title}</h3>
                                    <p className="description-text">{item.description}</p>
                                    <div className="card-footer">
                                        <span className="time-info"><i className="far fa-calendar"></i> {item.date}</span>
                                        <span className="time-info"><i className="far fa-clock"></i> {item.startTime}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {isModalOpen && (
                    <div className="rem-modal-overlay">
                        <div className="rem-modal">
                            <div className="modal-top">
                                <h2>Create Reminder</h2>
                                <button onClick={() => setIsModalOpen(false)} className="close-x">&times;</button>
                            </div>
                            <form onSubmit={handleAdd} className="rem-form">
                                <div className="form-group">
                                    <label>Category</label>
                                    <select value={newItem.category} onChange={(e) => setNewItem({...newItem, category: e.target.value})}>
                                        <option value="Other">Other</option>
                                        <option value="Service">Service</option>
                                        <option value="Insurance">Insurance</option>
                                        <option value="License">Revenue License</option>
                                        <option value="Repair">Repair</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Reminder Title</label>
                                    <input type="text" required placeholder="Ex: Change Engine Oil" value={newItem.title} onChange={(e) => setNewItem({...newItem, title: e.target.value})} />
                                </div>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Date</label>
                                        <input type="date" required onChange={(e) => setNewItem({...newItem, date: e.target.value})} />
                                    </div>
                                    <div className="form-group">
                                        <label>Time</label>
                                        <input type="time" required onChange={(e) => setNewItem({...newItem, startTime: e.target.value})} />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label>Notes</label>
                                    <textarea placeholder="Any specific details..." onChange={(e) => setNewItem({...newItem, description: e.target.value})}></textarea>
                                </div>
                                <button type="submit" className="submit-btn" disabled={isSaving}>
                                    {isSaving ? "Saving..." : "Save Reminder"}
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
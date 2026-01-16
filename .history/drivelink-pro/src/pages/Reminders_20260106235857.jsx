import React, { useState, useEffect } from 'react';
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
    const [notifiedIds, setNotifiedIds] = useState(new Set()); // එකම Notification එක දෙපාරක් නොයවන්න

    const [newItem, setNewItem] = useState({
        title: '', date: '', startTime: '', description: '', color: '#3699ff'
    });

    // --- 1. පද්ධතිය පරීක්ෂා කිරීම (Notification Logic) ---
    useEffect(() => {
        const checkReminders = () => {
            const now = new Date();
            
            reminders.forEach(rem => {
                if (notifiedIds.has(rem.id)) return;

                const remDateTime = new Date(`${rem.date}T${rem.startTime}`);
                const diffInMs = remDateTime - now;
                const diffInMins = Math.floor(diffInMs / (1000 * 60));

                // A. විනාඩි 5කට කලින් දැනුම් දීම
                if (diffInMins === 5) {
                    sendLocalNotification(`Upcoming: ${rem.title}`, "Starts in 5 minutes!");
                    setNotifiedIds(prev => new Set(prev).add(rem.id));
                }
                
                // B. මගහැරුණු (Missed) Reminders - ඇප් එක ඕපන් කළ වෙලාවේ පෙන්වීමට
                if (diffInMs < 0 && !notifiedIds.has(rem.id)) {
                    // අද දවසේ මගහැරුණු ඒවා පමණක් පෙන්වීමට
                    if (now.toDateString() === remDateTime.toDateString()) {
                        sendLocalNotification(`Missed Alert: ${rem.title}`, `Scheduled for ${rem.startTime}`);
                        setNotifiedIds(prev => new Set(prev).add(rem.id));
                    }
                }
            });
        };

        const interval = setInterval(checkReminders, 30000); // තත්පර 30කට වරක් පරීක්ෂා කරයි
        return () => clearInterval(interval);
    }, [reminders, notifiedIds]);

    const sendLocalNotification = (title, body) => {
        // ඇප් එකේ ඇතුළත ටෝස්ට් එකක් පෙන්වීම
        toast.info(`${title}: ${body}`, { theme: "dark" });

        // Browser Notification එකක් යැවීම (Permission තිබේ නම්)
        if (Notification.permission === "granted") {
            new Notification(title, { body, icon: '/logo.png' });
        }
    };

    // --- 2. Data Fetching ---
    const fetchReminders = async (uid) => {
        try {
            const q = query(collection(db, `users/${uid}/reminders`), orderBy("date", "asc"));
            const querySnapshot = await getDocs(q);
            const loaded = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setReminders(loaded);
        } catch (error) { console.error(error); }
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
        } catch (e) { toast.error("Failed to save"); }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Delete?")) return;
        await deleteDoc(doc(db, `users/${userUid}/reminders`, id));
        setReminders(reminders.filter(r => r.id !== id));
    };

    if (loading) return <Layout><div className="loading">Loading Reminders...</div></Layout>;

    return (
        <Layout>
            <div className="dashboard-content">
                <div className="main-header">
                    <h1>Reminders</h1>
                    <button className="btn-add-rem" onClick={() => setIsModalOpen(true)}>+ Add New</button>
                </div>

                <div className="rem-grid">
                    {reminders.map(item => (
                        <div key={item.id} className="rem-card" style={{borderLeft: `5px solid ${item.color}`}}>
                            <div className="rem-details">
                                <div className="rem-top">
                                    <span className="rem-time"><i className="far fa-clock"></i> {item.startTime}</span>
                                    <button onClick={() => handleDelete(item.id)} className="btn-del"><i className="fas fa-trash"></i></button>
                                </div>
                                <h3>{item.title}</h3>
                                <p>{item.description}</p>
                                <span className="rem-date-tag">{item.date}</span>
                            </div>
                        </div>
                    ))}
                </div>

                {isModalOpen && (
                    <div className="modal-overlay">
                        <div className="modal-box">
                            <h2>New Task</h2>
                            <form onSubmit={handleAdd}>
                                <input type="text" placeholder="Title" required onChange={e => setNewItem({...newItem, title: e.target.value})} />
                                <div className="form-row">
                                    <input type="date" required onChange={e => setNewItem({...newItem, date: e.target.value})} />
                                    <input type="time" required onChange={e => setNewItem({...newItem, startTime: e.target.value})} />
                                </div>
                                <textarea placeholder="Description" onChange={e => setNewItem({...newItem, description: e.target.value})} />
                                <div className="color-picker">
                                    {['#3699ff', '#22c55e', '#f64e60', '#ffa800'].map(c => (
                                        <div key={c} className={`color-opt ${newItem.color === c ? 'active' : ''}`} style={{background: c}} onClick={() => setNewItem({...newItem, color: c})} />
                                    ))}
                                </div>
                                <button type="submit" className="save-btn">Save Reminder</button>
                                <button type="button" onClick={() => setIsModalOpen(false)} className="cancel-btn">Cancel</button>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </Layout>
    );
};

export default Reminders;
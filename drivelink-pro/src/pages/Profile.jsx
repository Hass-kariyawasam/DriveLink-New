import React, { useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { ref, set, push, onValue } from "firebase/database";
import { useVehicle } from '../context/VehicleContext';
import './Profile.css'; // CSS ෆයිල් එක පසුව හදමු

const Profile = () => {
  const { vehicles, setVehicles } = useVehicle();
  const [newVehicle, setNewVehicle] = useState({ model: '', number: '', type: 'Car' });
  const [user, setUser] = useState(null);

  useEffect(() => {
    const currentUser = auth.currentUser;
    if (currentUser) {
      setUser(currentUser);
      // User ගේ දැනට තියෙන වාහන ලිස්ට් එක ගන්න
      const vehicleRef = ref(db, `users/${currentUser.uid}/vehicles`);
      onValue(vehicleRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          const loadedVehicles = Object.keys(data).map(key => ({ id: key, ...data[key] }));
          setVehicles(loadedVehicles);
        }
      });
    }
  }, []);

  const handleAddVehicle = async (e) => {
    e.preventDefault();
    if (!user) return;

    // Firebase එකට අලුත් වාහනයක් ඇඩ් කිරීම
    const vehicleRef = ref(db, `users/${user.uid}/vehicles`);
    const newVehicleRef = push(vehicleRef);
    await set(newVehicleRef, newVehicle);
    
    setNewVehicle({ model: '', number: '', type: 'Car' }); // Form reset
    alert('Vehicle Added Successfully!');
  };

  return (
    <div className="profile-container">
      <h1>My Profile</h1>
      {user && (
        <div className="user-info">
          <img src="https://via.placeholder.com/100" alt="Profile" className="avatar"/>
          <h3>{user.email}</h3>
        </div>
      )}

      <div className="vehicle-section">
        <h2>Manage Vehicles</h2>
        
        {/* වාහන ඇඩ් කරන Form එක */}
        <form onSubmit={handleAddVehicle} className="add-vehicle-form">
          <input 
            type="text" 
            placeholder="Vehicle Model (e.g. Toyota Vitz)" 
            value={newVehicle.model}
            onChange={(e) => setNewVehicle({...newVehicle, model: e.target.value})}
            required
          />
          <input 
            type="text" 
            placeholder="Vehicle Number (e.g. CAB-1234)" 
            value={newVehicle.number}
            onChange={(e) => setNewVehicle({...newVehicle, number: e.target.value})}
            required
          />
          <select 
            value={newVehicle.type}
            onChange={(e) => setNewVehicle({...newVehicle, type: e.target.value})}
          >
            <option value="Car">Car</option>
            <option value="Bike">Bike</option>
            <option value="TukTuk">Three Wheeler</option>
          </select>
          <button type="submit">Add Vehicle</button>
        </form>

        {/* දැනට තියෙන වාහන List එක */}
        <div className="vehicle-list">
          {vehicles.map((v) => (
            <div key={v.id} className="vehicle-card">
              <h4>{v.model}</h4>
              <p>{v.number}</p>
              <span className="badge">{v.type}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Profile;
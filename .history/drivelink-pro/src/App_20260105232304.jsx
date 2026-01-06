import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'

// මෙතනින් තමයි ඔයාගේ App එක 'root' කියන div එකට දාන්නේ
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
// src/App.jsx ෆයිල් එකේ අන්තිමටම මේ පේළිය තියෙන්න ඕන:
export default App;
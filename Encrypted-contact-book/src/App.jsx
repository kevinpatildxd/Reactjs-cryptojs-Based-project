// 📁 src/App.jsx
import React, { useState, useEffect } from 'react';
import CryptoJS from 'crypto-js';
import './App.css';

const SECRET_KEY = 'contact_key';
const SESSION_TIMEOUT = 2 * 60 * 1000; // 2 minutes

export default function App() {
  const [contacts, setContacts] = useState([]);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [search, setSearch] = useState('');
  const [lastActivity, setLastActivity] = useState(Date.now());

  useEffect(() => {
    const encryptedData = localStorage.getItem('contacts');
    if (encryptedData) {
      try {
        const bytes = CryptoJS.AES.decrypt(encryptedData, SECRET_KEY);
        const decryptedData = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
        setContacts(decryptedData);
      } catch {
        setContacts([]);
      }
    }

    const interval = setInterval(() => {
      if (Date.now() - lastActivity > SESSION_TIMEOUT) {
        logout();
        alert('Logged out due to inactivity.');
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [lastActivity]);

  const encryptAndSave = (data) => {
    const cipher = CryptoJS.AES.encrypt(JSON.stringify(data), SECRET_KEY).toString();
    localStorage.setItem('contacts', cipher);
  };

  const sanitizeInput = (str) => str.replace(/</g, '&lt;').replace(/>/g, '&gt;');

  const addContact = () => {
    if (!name || !phone || !email) return alert('All fields are required');
    const newContact = {
      name: sanitizeInput(name),
      phone: sanitizeInput(phone),
      email: sanitizeInput(email),
    };
    const updated = [...contacts, newContact];
    setContacts(updated);
    encryptAndSave(updated);
    setName('');
    setPhone('');
    setEmail('');
    setLastActivity(Date.now());
  };

  const deleteContact = (index) => {
    const updated = contacts.filter((_, i) => i !== index);
    setContacts(updated);
    encryptAndSave(updated);
    setLastActivity(Date.now());
  };

  const logout = () => {
    setContacts([]);
    localStorage.removeItem('contacts');
  };

  const filteredContacts = contacts.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="container">
      <h2>📞 Encrypted Contact Book</h2>
      <div className="logout-row">
        <input
          type="text"
          placeholder="Search by name..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setLastActivity(Date.now());
          }}
        />
        <button onClick={logout}>Logout</button>
      </div>

      <div className="form">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Name"
        />
        <input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="Phone"
        />
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
        />
        <button onClick={addContact}>Add Contact</button>
      </div>

      <ul className="contact-list">
        {filteredContacts.map((c, i) => (
          <li key={i}>
            <strong>{c.name}</strong><br />
            📱 {c.phone}<br />
            ✉️ {c.email}
            <button onClick={() => deleteContact(i)}>Delete</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
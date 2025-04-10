// 📁 src/App.jsx
import React, { useState, useEffect } from 'react';
import CryptoJS from 'crypto-js';
import './App.css';

const SECRET_KEY = 'secret123';
const SESSION_TIMEOUT = 2 * 60 * 1000; // 2 minutes

export default function App() {
  const [user, setUser] = useState(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [note, setNote] = useState('');
  const [notes, setNotes] = useState([]);
  const [lastActivity, setLastActivity] = useState(Date.now());
  const [screen, setScreen] = useState('login');

  useEffect(() => {
    const session = localStorage.getItem('session');
    if (session) {
      const sessionUser = JSON.parse(session);
      setUser(sessionUser);
      loadNotes(sessionUser.username);
      setScreen('notes');
    }
    const interval = setInterval(() => {
      if (Date.now() - lastActivity > SESSION_TIMEOUT) {
        logout();
        alert('Session expired due to inactivity');
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [lastActivity]);

  const encrypt = (data) => CryptoJS.AES.encrypt(JSON.stringify(data), SECRET_KEY).toString();
  const decrypt = (cipher) => {
    try {
      const bytes = CryptoJS.AES.decrypt(cipher, SECRET_KEY);
      return JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
    } catch {
      return [];
    }
  };

  const hashPassword = (pass) => CryptoJS.SHA256(pass).toString();

  const handleRegister = () => {
    if (username && password) {
      const users = JSON.parse(localStorage.getItem('users') || '{}');
      if (users[username]) return alert('User already exists');
      users[username] = hashPassword(password);
      localStorage.setItem('users', JSON.stringify(users));
      alert('Registered! Now login.');
      setScreen('login');
    }
  };

  const handleLogin = () => {
    const users = JSON.parse(localStorage.getItem('users') || '{}');
    if (users[username] === hashPassword(password)) {
      const sessionUser = { username };
      setUser(sessionUser);
      localStorage.setItem('session', JSON.stringify(sessionUser));
      loadNotes(username);
      setScreen('notes');
    } else {
      alert('Invalid credentials');
    }
  };

  const logout = () => {
    setUser(null);
    setScreen('login');
    localStorage.removeItem('session');
  };

  const loadNotes = (user) => {
    const data = localStorage.getItem(`notes_${user}`);
    if (data) {
      setNotes(decrypt(data));
    } else {
      setNotes([]);
    }
  };

  const saveNotes = (notes) => {
    setNotes(notes);
    if (user) {
      localStorage.setItem(`notes_${user.username}`, encrypt(notes));
    }
  };

  const addNote = () => {
    if (note.trim()) {
      const updated = [...notes, note];
      saveNotes(updated);
      setNote('');
      setLastActivity(Date.now());
    }
  };

  const deleteNote = (index) => {
    const updated = notes.filter((_, i) => i !== index);
    saveNotes(updated);
    setLastActivity(Date.now());
  };

  if (screen === 'login') {
    return (
      <div className="auth">
        <h2>Login</h2>
        <input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Username" />
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" />
        <button onClick={handleLogin}>Login</button>
        <p onClick={() => setScreen('register')} className="link">New user? Register</p>
      </div>
    );
  }

  if (screen === 'register') {
    return (
      <div className="auth">
        <h2>Register</h2>
        <input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Username" />
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" />
        <button onClick={handleRegister}>Register</button>
        <p onClick={() => setScreen('login')} className="link">Already have an account? Login</p>
      </div>
    );
  }

  return (
    <div className="app">
      <h2>Welcome, {user.username}</h2>
      <button className="logout" onClick={logout}>Logout</button>
      <div className="note-input">
        <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Write a note..." />
        <button onClick={addNote}>Add</button>
      </div>
      <ul className="notes">
        {notes.map((n, i) => (
          <li key={i}>
            {n} <button onClick={() => deleteNote(i)}>Delete</button>
          </li>
        ))}
      </ul>
    </div>
  );
}

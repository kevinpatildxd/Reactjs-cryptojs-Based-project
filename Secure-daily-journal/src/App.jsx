import React, { useState, useEffect } from 'react';
import CryptoJS from 'crypto-js';
import './App.css';

const App = () => {
  const [passphrase, setPassphrase] = useState('');
  const [unlocked, setUnlocked] = useState(false);
  const [entries, setEntries] = useState([]);
  const [text, setText] = useState('');
  const [date, setDate] = useState('');
  const [mood, setMood] = useState('😊');
  const [lastActivity, setLastActivity] = useState(Date.now());

  // 🔐 Try to unlock the journal
  useEffect(() => {
    const encrypted = localStorage.getItem('journal');

    if (passphrase) {
      if (!encrypted) {
        // First time use: no data yet
        setUnlocked(true);
      } else {
        try {
          const bytes = CryptoJS.AES.decrypt(encrypted, passphrase);
          const decryptedData = bytes.toString(CryptoJS.enc.Utf8);

          if (decryptedData) {
            setEntries(JSON.parse(decryptedData));
            setUnlocked(true);
          } else {
            alert('Incorrect passphrase or corrupted data.');
          }
        } catch (err) {
          alert('Failed to decrypt: Wrong passphrase or corrupted data.');
        }
      }
    }
  }, [passphrase]);

  // 🔐 Auto-lock after 2 minutes of inactivity
  useEffect(() => {
    const interval = setInterval(() => {
      if (Date.now() - lastActivity > 2 * 60 * 1000) {
        setUnlocked(false);
        setEntries([]);
        alert('Session expired. Data cleared for security.');
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [lastActivity]);

  // 🔐 Save encrypted journal to localStorage
  useEffect(() => {
    if (unlocked) {
      const encrypted = CryptoJS.AES.encrypt(
        JSON.stringify(entries),
        passphrase
      ).toString();
      localStorage.setItem('journal', encrypted);
    }
  }, [entries, passphrase, unlocked]);

  const addEntry = () => {
    if (date && text.trim()) {
      const newEntry = { date, text, mood };
      setEntries([...entries, newEntry]);
      setText('');
      setDate('');
      setMood('😊');
      setLastActivity(Date.now());
    }
  };

  if (!unlocked) {
    return (
      <div className="unlock-screen">
        <h2>🔐 Enter Passphrase to Unlock Journal</h2>
        <input
          type="password"
          value={passphrase}
          onChange={(e) => setPassphrase(e.target.value)}
          placeholder="Enter your passphrase"
        />
      </div>
    );
  }

  return (
    <div className="app">
      <h1>📓 Secure Daily Journal</h1>

      <div className="entry-form">
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
        <textarea
          placeholder="Write your journal entry..."
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <select value={mood} onChange={(e) => setMood(e.target.value)}>
          <option>😊</option>
          <option>😢</option>
          <option>😠</option>
          <option>😴</option>
          <option>😍</option>
        </select>
        <button onClick={addEntry}>Add Entry</button>
      </div>

      <div className="entries">
        <h2>📅 Past Entries</h2>
        {entries.map((entry, index) => (
          <div key={index} className="entry">
            <p><strong>{entry.date}</strong> - {entry.mood}</p>
            <p>{entry.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default App;

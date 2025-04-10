// File: src/App.jsx
import React, { useEffect, useState } from 'react';
import CryptoJS from 'crypto-js';
import { SHA256 } from 'crypto-js';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import './App.css';

const SECRET_KEY = 'your_secret_key';

const encryptData = (data) => {
  const stringified = JSON.stringify(data);
  const hash = SHA256(stringified).toString();
  const payload = JSON.stringify({ data, hash });
  return CryptoJS.AES.encrypt(payload, SECRET_KEY).toString();
};

const decryptData = (ciphertext) => {
  try {
    const bytes = CryptoJS.AES.decrypt(ciphertext, SECRET_KEY);
    const decrypted = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
    const recalculatedHash = SHA256(JSON.stringify(decrypted.data)).toString();
    if (recalculatedHash === decrypted.hash) {
      return decrypted.data;
    } else {
      alert("Data integrity check failed!");
      return [];
    }
  } catch {
    return [];
  }
};

function App() {
  const [expenses, setExpenses] = useState([]);
  const [amount, setAmount] = useState('');
  const [desc, setDesc] = useState('');
  const [lastActivity, setLastActivity] = useState(Date.now());
// Auto logout after 2 minutes of inactivity
useEffect(() => {
  const interval = setInterval(() => {
    if (Date.now() - lastActivity > 2 * 60 * 1000) {
      alert("Session expired due to inactivity.");
      setExpenses([]);
      localStorage.removeItem('secureExpenses');
      clearInterval(interval);
    }
  }, 10000);
  return () => clearInterval(interval);
}, [lastActivity]);

useEffect(() => {
  const encrypted = localStorage.getItem('secureExpenses');
  if (encrypted) {
    const decrypted = decryptData(encrypted);
    setExpenses(decrypted);
  }
}, []);

useEffect(() => {
  localStorage.setItem('secureExpenses', encryptData(expenses));
}, [expenses]);

const addExpense = () => {
  if (!amount || !desc) return;
  const newEntry = {
    id: Date.now(),
    amount: parseFloat(amount),
    desc,
    date: new Date().toISOString().split('T')[0]
  };
  setExpenses(prev => [...prev, newEntry]);
  setAmount('');
  setDesc('');
  setLastActivity(Date.now());
};

const deleteExpense = (id) => {
  setExpenses(expenses.filter(e => e.id !== id));
  setLastActivity(Date.now());
};

const monthlyTotal = expenses.reduce((acc, curr) => acc + curr.amount, 0);

const groupedData = expenses.reduce((acc, curr) => {
  acc[curr.date] = (acc[curr.date] || 0) + curr.amount;
  return acc;
}, {});

const chartData = Object.entries(groupedData).map(([date, amount]) => ({ date, amount }));

return (
  <div className="container">
    <h1>Secure Expense Tracker</h1>
    <div className="input-group">
      <input
        type="number"
        placeholder="Amount"
        value={amount}
        onChange={e => setAmount(e.target.value)}
      />
      <input
        type="text"
        placeholder="Description"
        value={desc}
        onChange={e => setDesc(e.target.value)}
      />
      <button onClick={addExpense}>Add</button>
    </div>
    <h3>Total: ₹{monthlyTotal.toFixed(2)}</h3>
    <ul className="expense-list">
      {expenses.map(e => (
        <li key={e.id}>
          ₹{e.amount} - {e.desc} ({e.date})
          <button onClick={() => deleteExpense(e.id)}>❌</button>
        </li>
      ))}
    </ul>
    <h2>Daily Expense Chart</h2>
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={chartData}>
        <XAxis dataKey="date" />
        <YAxis />
        <Tooltip />
        <Bar dataKey="amount" fill="#8884d8" />
      </BarChart>
    </ResponsiveContainer>
  </div>
);
}

export default App;


// Connects two users to the "general" room so the chat can be demonstrated.
// Run the server first, then: node scripts/chat-demo.js
require('dotenv').config({ quiet: true });
const { io } = require('socket.io-client');
const BASE = `http://localhost:${process.env.PORT || 5000}`;

async function getToken(username, email, password) {
  await fetch(`${BASE}/api/auth/signup`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, email, password }),
  });
  const res = await fetch(`${BASE}/api/auth/login`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  return (await res.json()).token;
}

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  const [t1, t2] = await Promise.all([
    getToken('Aditi', 'aditi@example.com', 'secret123'),
    getToken('Rohan', 'rohan@example.com', 'secret123'),
  ]);
  const a = io(BASE, { auth: { token: t1 } });
  const b = io(BASE, { auth: { token: t2 } });
  await wait(500);
  a.emit('joinRoom', 'general');
  b.emit('joinRoom', 'general');
  await wait(300);
  a.emit('chatMessage', { room: 'general', text: 'Hey team, backend is ready' });
  await wait(200);
  b.emit('chatMessage', { room: 'general', text: 'Testing chat now...' });
  await wait(200);
  a.emit('chatMessage', { room: 'general', text: 'Messages arriving in real time' });
  await wait(500);
  a.close(); b.close();
  process.exit(0);
})();

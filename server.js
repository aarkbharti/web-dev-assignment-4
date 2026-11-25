require('dotenv').config({ quiet: true });
const http = require('http');
const express = require('express');

if (!process.env.JWT_SECRET) {
  console.error('JWT_SECRET is missing. Create a .env file (see .env.example).');
  process.exit(1);
}

const initSocket = require('./src/socket');

const app = express();
app.use(express.json());

app.use('/api/auth', require('./src/routes/auth'));
app.use('/api/notes', require('./src/routes/notes'));
app.use('/api/admin', require('./src/routes/admin'));

app.get('/', (req, res) => res.json({ message: 'Secure Connect API is running' }));
app.use((req, res) => res.status(404).json({ message: 'Route not found' }));
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.type === 'entity.parse.failed' ? 400 : 500).json({ message: err.type === 'entity.parse.failed' ? 'Invalid JSON body' : 'Server error' });
});

const server = http.createServer(app);
initSocket(server);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`[server] listening on http://localhost:${PORT}`));

// Central EventEmitter used for event-driven features.
const EventEmitter = require('events');
const bus = new EventEmitter();

const stamp = () => new Date().toISOString();

bus.on('user:registered', (u) => console.log(`[event] user:registered -> ${u.username} <${u.email}>`));
bus.on('user:login', (u) => console.log(`[event] user:login -> ${u.username} at ${stamp()}`));
bus.on('user:loginFailed', (email) => console.log(`[event] user:loginFailed -> ${email}`));
bus.on('note:created', (n) => console.log(`[event] note:created -> "${n.title}" by ${n.owner}`));
bus.on('note:updated', (n) => console.log(`[event] note:updated -> "${n.title}"`));
bus.on('note:deleted', (id) => console.log(`[event] note:deleted -> ${id}`));
bus.on('chat:message', (m) => console.log(`[general] ${m.username}: ${m.text}`.replace('[general]', `[${m.room}]`)));

module.exports = bus;

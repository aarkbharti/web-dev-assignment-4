// Tiny JSON-file database. Lab allows "any preferred database", and this
// keeps the project runnable without installing MongoDB.
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DATA_DIR = path.join(__dirname, '..', 'data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const newId = () => crypto.randomBytes(12).toString('hex'); // 24-char hex id

class Collection {
  constructor(name) {
    this.file = path.join(DATA_DIR, `${name}.json`);
    if (!fs.existsSync(this.file)) fs.writeFileSync(this.file, '[]');
  }
  _read() {
    return JSON.parse(fs.readFileSync(this.file, 'utf8'));
  }
  _write(rows) {
    fs.writeFileSync(this.file, JSON.stringify(rows, null, 2));
  }
  find(predicate = () => true) {
    return this._read().filter(predicate);
  }
  findOne(predicate) {
    return this._read().find(predicate) || null;
  }
  insert(doc) {
    const rows = this._read();
    const now = new Date().toISOString();
    const row = { _id: newId(), ...doc, createdAt: now, updatedAt: now };
    rows.push(row);
    this._write(rows);
    return row;
  }
  update(id, changes) {
    const rows = this._read();
    const i = rows.findIndex((r) => r._id === id);
    if (i === -1) return null;
    rows[i] = { ...rows[i], ...changes, updatedAt: new Date().toISOString() };
    this._write(rows);
    return rows[i];
  }
  remove(id) {
    const rows = this._read();
    const i = rows.findIndex((r) => r._id === id);
    if (i === -1) return false;
    rows.splice(i, 1);
    this._write(rows);
    return true;
  }
}

module.exports = {
  users: new Collection('users'),
  notes: new Collection('notes'),
  messages: new Collection('messages'),
};

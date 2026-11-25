const express = require('express');
const db = require('../db');
const bus = require('../events');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate); // every notes route is protected

router.post('/', (req, res) => {
  const { title, content } = req.body || {};
  if (!title || !content) return res.status(400).json({ message: 'title and content are required' });
  const note = db.notes.insert({ title, content, owner: req.user.id });
  bus.emit('note:created', note);
  res.status(201).json(note);
});

router.get('/', (req, res) => {
  res.json(db.notes.find((n) => n.owner === req.user.id));
});

// Loads the note only if it belongs to the logged-in user (admins can access any).
function loadOwned(req, res, next) {
  const note = db.notes.findOne((n) => n._id === req.params.id);
  if (!note) return res.status(404).json({ message: 'Note not found' });
  if (note.owner !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'You do not own this note' });
  }
  req.note = note;
  next();
}

router.get('/:id', loadOwned, (req, res) => res.json(req.note));

router.put('/:id', loadOwned, (req, res) => {
  const { title, content } = req.body || {};
  const changes = {};
  if (title) changes.title = title;
  if (content) changes.content = content;
  const updated = db.notes.update(req.note._id, changes);
  bus.emit('note:updated', updated);
  res.json(updated);
});

router.delete('/:id', loadOwned, (req, res) => {
  db.notes.remove(req.note._id);
  bus.emit('note:deleted', req.note._id);
  res.json({ message: 'Note deleted' });
});

module.exports = router;

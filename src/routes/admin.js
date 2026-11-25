const express = require('express');
const db = require('../db');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate, authorize('admin'));

router.get('/users', (req, res) => {
  res.json(db.users.find().map(({ password, ...safe }) => safe));
});

router.get('/messages', (req, res) => {
  res.json(db.messages.find());
});

module.exports = router;

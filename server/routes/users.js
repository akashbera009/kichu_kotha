// backend/routes/users.js
const express = require('express');
const { searchUsers, getUser, addContact, getContacts, getMe } = require('../controllers/userController');
const auth = require('../middleware/auth');
const { saveFcmToken } = require('../controllers/userController');

const router = express.Router();

router.get('/me', auth, getMe);
router.get('/search', auth, searchUsers);
router.get('/contacts', auth, getContacts);
router.get('/:userId', auth, getUser);
router.post('/contacts', auth, addContact);

router.post('/fcm-token', auth, saveFcmToken);


module.exports = router;


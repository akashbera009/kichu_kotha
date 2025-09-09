// backend/config/firebase.js
const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json'); // correct relative path

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

module.exports = admin;


const admin = require('../config/firebase'); // your Firebase admin instance

const sendNotification = async (fcmTokens, message) => {
  if (!fcmTokens || fcmTokens.length === 0) return;

  const payload = {
    notification: {
      title: `New message from ${message.sender.username}`,
      body: message.messageType === 'text' ? message.message.text : 'Sent a file',
      click_action: 'FLUTTER_NOTIFICATION_CLICK', // optional for mobile
    },
    data: {
      messageId: message._id.toString(),
      senderId: message.sender._id.toString(),
      type: message.messageType,
    },
  };

  try {
    await admin.messaging().sendToDevice(fcmTokens, payload);
  } catch (err) {
    console.error('FCM Error:', err);
  }
};
async function sendToDevice(fcmToken, title, body, data = {}) {
  const message = {
    token: fcmToken,
    notification: { title, body },
    data,
  };

  try {
    const res = await admin.messaging().send(message);
    console.log("Sent message:", res);
  } catch (err) {
    console.error("Send error:", err);
  }
}

module.exports = sendNotification;

// //context/FCMContext
// import { createContext, useContext, useEffect } from 'react';
// import { getMessaging, onMessage } from 'firebase/messaging';
// import { messaging } from '../firebase'; // your firebase config file

// const FCMContext = createContext();

// export const useFCM = () => useContext(FCMContext);

// export const FCMProvider = ({ children }) => {
//   useEffect(() => {
//     // const messaging = getMessaging(firebaseApp);

//     // Listen for foreground messages
//     const unsubscribe = onMessage(messaging, (payload) => {
//       console.log('Foreground message received:', payload);
//       // TODO: Show toast/notification in UI
//     });

//     return () => unsubscribe();
//   }, []);

//   return <FCMContext.Provider value={{}}>{children}</FCMContext.Provider>;
// };
// context/FCMContext.jsx
import { createContext, useContext, useEffect } from 'react';
import { onMessage, isSupported } from 'firebase/messaging';
import { messaging } from '../firebase';

const FCMContext = createContext();

export const useFCM = () => useContext(FCMContext);

export const FCMProvider = ({ children }) => {
  useEffect(() => {
    const initializeFCMListener = async () => {
      try {
        // Check if messaging is supported
        const messagingSupported = await isSupported();
        if (!messagingSupported) {
          console.warn('Firebase Messaging not supported in this browser');
          return;
        }

        // Check if messaging instance exists
        if (!messaging) {
          console.warn('Firebase Messaging not initialized');
          return;
        }

        // Listen for foreground messages
        const unsubscribe = onMessage(messaging, (payload) => {
          console.log('Foreground message received:', payload);
          
          // Show browser notification if permission is granted
          if (Notification.permission === 'granted') {
            new Notification(payload.notification?.title || 'New Message', {
              body: payload.notification?.body || 'You have a new message',
              icon: payload.notification?.icon || '/favicon.ico',
              tag: 'kichu-kotha-message'
            });
          }
          
          // TODO: Show toast/notification in UI
          // You can dispatch a custom event or use a toast library here
        });

        return unsubscribe;
      } catch (error) {
        console.error('Error setting up FCM listener:', error);
        return null;
      }
    };

    let unsubscribe = null;
    
    initializeFCMListener().then((unsub) => {
      unsubscribe = unsub;
    });

    // Cleanup function
    return () => {
      if (unsubscribe && typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, []);

  return <FCMContext.Provider value={{}}>{children}</FCMContext.Provider>;
};
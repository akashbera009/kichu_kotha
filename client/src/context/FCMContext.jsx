//context/FCMContext
import { createContext, useContext, useEffect } from 'react';
import { getMessaging, onMessage } from 'firebase/messaging';
import { messaging } from '../firebase'; // your firebase config file

const FCMContext = createContext();

export const useFCM = () => useContext(FCMContext);

export const FCMProvider = ({ children }) => {
  useEffect(() => {
    // const messaging = getMessaging(firebaseApp);

    // Listen for foreground messages
    const unsubscribe = onMessage(messaging, (payload) => {
      console.log('Foreground message received:', payload);
      // TODO: Show toast/notification in UI
    });

    return () => unsubscribe();
  }, []);

  return <FCMContext.Provider value={{}}>{children}</FCMContext.Provider>;
};

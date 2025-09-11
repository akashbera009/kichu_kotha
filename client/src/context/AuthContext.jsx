// // client/src/context/AuthContext.jsx
// import React, { createContext, useState, useContext, useEffect } from "react";
// import { authAPI } from "../services/api";
// import { messaging } from '.././firebase';
// import { getToken} from "firebase/messaging";

// const AuthContext = createContext();

// export const useAuth = () => {
//   return useContext(AuthContext);
// };

// export const AuthProvider = ({ children }) => {
//   const [currentUser, setCurrentUser] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [token, setToken] = useState(localStorage.getItem("token"));

//   useEffect(() => {
//     const verifyExistingToken = async () => {
//       if (token) {
//         try {
//           const user = await authAPI.verifyToken(token);
//           setCurrentUser(user);
//           // console.log('Token verified successfully:', user);
//         } catch (error) {
//           console.error('Token verification failed:', error);
//           localStorage.removeItem("token");
//           setToken(null);
//           setCurrentUser(null);
//         }
//       }
//       setLoading(false);
//     };

//     verifyExistingToken();
//   }, [token]);

//   const login = async (username, password) => {
//     try {
//       console.log('Attempting login for:', username);
//       const response = await authAPI.login(username, password);
//       const { token: newToken, user } = response.data;

//       console.log('Login successful:', { user, token: newToken });

//       // Update localStorage first
//       localStorage.setItem("token", newToken);
      
//       // Then update state
//       setToken(newToken);
//       setCurrentUser(user);

//       return { success: true };
//     } catch (error) {
//       console.error('Login failed:', error);
//       return {
//         success: false,
//         message: error.response?.data?.message || "Login failed",
//       };
//     }
//   };

//   const register = async (username, password) => {
//     try {
//       console.log('Attempting registration for:', username);
//       const response = await authAPI.register(username, password);
//       const { token: newToken, user } = response.data;

//       console.log('Registration successful:', { user, token: newToken });

//       localStorage.setItem("token", newToken);
//       setToken(newToken);
//       setCurrentUser(user);

//       return { success: true };
//     } catch (error) {
//       console.error('Registration failed:', error);
//       return {
//         success: false,
//         message: error.response?.data?.message || "Registration failed",
//       };
//     }
//   };

//   const logout = async () => {
//     try {
//       if (token) {
//         await authAPI.logout(token);
//       }
//     } catch (error) {
//       console.error("Logout error:", error);
//     } finally {
//       localStorage.removeItem("token");
//       setToken(null);
//       setCurrentUser(null);
//       console.log('User logged out successfully');
//     }
//   };

// // requestFirebaseToken:
// const requestFirebaseToken = async () => {
//   try {
//     // request permission first
//     const permission = await Notification.requestPermission();
//     if (permission !== "granted") {
//       console.warn("Notification permission not granted");
//       return;
//     }

//     const fcmToken = await getToken(messaging, {
//       vapidKey: import.meta.env.VITE_APP_VAPID_KEY || "YOUR_VAPID_KEY_HERE",
//     });

//     if (!fcmToken) {
//       console.warn("No FCM token returned");
//       return;
//     }

//     console.log("FCM registration token:", fcmToken);

//     // send to backend (adjust URL if needed)
//     await fetch("/api/users/fcm-token", {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json",
//         Authorization: `Bearer ${localStorage.getItem("token")}`,
//       },
//       body: JSON.stringify({ token: fcmToken }),
//     });
//   } catch (err) {
//     console.error("FCM token error:", err);
//   }
// };
  
//   const value = {
//     currentUser,
//     token,
//     loading,
//     login,
//     register,
//     logout,
//     requestFirebaseToken
//   };

  
  
//   return (
//     <AuthContext.Provider value={value}>
//       {!loading && children}
//     </AuthContext.Provider>
//   );
// };

// client/src/context/AuthContext.jsx
import React, { createContext, useState, useContext, useEffect } from "react";
import { authAPI } from "../services/api";
import { messaging } from '../firebase';
import { getToken, isSupported } from "firebase/messaging";

const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem("token"));

  useEffect(() => {
    const verifyExistingToken = async () => {
      if (token) {
        try {
          const user = await authAPI.verifyToken(token);
          setCurrentUser(user);
          // console.log('Token verified successfully:', user);
        } catch (error) {
          console.error('Token verification failed:', error);
          localStorage.removeItem("token");
          setToken(null);
          setCurrentUser(null);
        }
      }
      setLoading(false);
    };

    verifyExistingToken();
  }, [token]);

  const login = async (username, password) => {
    try {
      console.log('Attempting login for:', username);
      const response = await authAPI.login(username, password);
      const { token: newToken, user } = response.data;

      console.log('Login successful:', { user, token: newToken });

      // Update localStorage first
      localStorage.setItem("token", newToken);
      
      // Then update state
      setToken(newToken);
      setCurrentUser(user);

      return { success: true };
    } catch (error) {
      console.error('Login failed:', error);
      return {
        success: false,
        message: error.response?.data?.message || "Login failed",
      };
    }
  };

  const register = async (username, password) => {
    try {
      console.log('Attempting registration for:', username);
      const response = await authAPI.register(username, password);
      const { token: newToken, user } = response.data;

      console.log('Registration successful:', { user, token: newToken });

      localStorage.setItem("token", newToken);
      setToken(newToken);
      setCurrentUser(user);

      return { success: true };
    } catch (error) {
      console.error('Registration failed:', error);
      return {
        success: false,
        message: error.response?.data?.message || "Registration failed",
      };
    }
  };

  const logout = async () => {
    try {
      if (token) {
        await authAPI.logout(token);
      }
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      localStorage.removeItem("token");
      setToken(null);
      setCurrentUser(null);
      console.log('User logged out successfully');
    }
  };

  // requestFirebaseToken with proper error handling:
  const requestFirebaseToken = async () => {
    try {
      // Check if messaging is supported first
      const messagingSupported = await isSupported();
      if (!messagingSupported) {
        console.warn("Firebase Messaging is not supported in this browser");
        return;
      }

      // Check if messaging instance exists
      if (!messaging) {
        console.warn("Firebase Messaging not initialized");
        return;
      }

      // Check if we're in a secure context (HTTPS or localhost)
      if (location.protocol !== 'https:' && location.hostname !== 'localhost') {
        console.warn("Firebase Messaging requires HTTPS or localhost");
        return;
      }

      // Request permission first
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        console.warn("Notification permission not granted");
        return;
      }

      const fcmToken = await getToken(messaging, {
        vapidKey: import.meta.env.VITE_APP_VAPID_KEY || "YOUR_VAPID_KEY_HERE",
      });

      if (!fcmToken) {
        console.warn("No FCM token returned");
        return;
      }

      console.log("FCM registration token:", fcmToken);

      // Send to backend (adjust URL if needed)
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      await fetch(`${apiUrl}/api/users/fcm-token`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ token: fcmToken }),
      });
      
      console.log("FCM token sent to backend successfully");
    } catch (err) {
      console.error("FCM token error:", err);
      // Don't throw the error, just log it so the app continues working
    }
  };
  
  const value = {
    currentUser,
    token,
    loading,
    login,
    register,
    logout,
    requestFirebaseToken
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
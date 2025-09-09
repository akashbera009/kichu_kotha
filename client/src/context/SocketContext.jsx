// skcketContext.jsx

import React, { createContext, useContext, useEffect, useState } from "react";
import io from "socket.io-client";
import { useAuth } from "./AuthContext";

const SocketContext = createContext();

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const { token } = useAuth();

  useEffect(() => {
    if (!token) return;
// console.log(import.meta.env.VITE_BACKEND_URL2);

    const newSocket = io(import.meta.env.VITE_BACKEND_URL2 || "https://kichu-kotha.onrender.com", {
      auth: { token },
    });

    // newSocket.on("connect", () => {
    //   console.log("✅ Socket connected");
    // });

    newSocket.on("connect_error", (err) => {
      console.error("❌ Socket connection error:", err.message);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [token]);

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
};

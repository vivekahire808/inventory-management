import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext(null);

// Web Audio API Chime synthesizer
function playAlertChime(isWarning = true) {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = isWarning ? 'sawtooth' : 'sine';
    osc.frequency.setValueAtTime(isWarning ? 440 : 880, ctx.currentTime); // A4 or A5
    osc.frequency.exponentialRampToValueAtTime(isWarning ? 880 : 1320, ctx.currentTime + 0.15);

    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.3);
  } catch (e) {
    // Ignore audio autoplay restrictions
  }
}

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [activeToast, setActiveToast] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(true);

  useEffect(() => {
    const socketUrl = import.meta.env.VITE_API_URL || 'https://inventory-management-2-ux7n.onrender.com';
    const socketInstance = io(socketUrl, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
      reconnectionDelay: 1000
    });

    socketInstance.on('connect', () => {
      console.log('⚡ Socket connected to server with ID:', socketInstance.id);
      setIsConnected(true);
    });

    socketInstance.on('disconnect', () => {
      console.log('🔌 Socket disconnected');
      setIsConnected(false);
    });

    socketInstance.on('low-stock-alert', (data) => {
      console.log('🚨 Received low-stock-alert via Socket:', data);
      const newNotif = {
        id: Date.now() + Math.random(),
        ...data,
        read: false
      };

      setNotifications((prev) => [newNotif, ...prev]);
      setUnreadCount((prev) => prev + 1);

      if (soundEnabled) {
        playAlertChime(true);
      }

      setActiveToast({
        id: newNotif.id,
        type: 'warning',
        title: data.title,
        message: data.message,
        timestamp: data.timestamp,
        reorder: data.reorder
      });
    });

    socketInstance.on('reorder-status-update', (data) => {
      console.log('🔄 Received reorder-status-update via Socket:', data);
      const newNotif = {
        id: Date.now() + Math.random(),
        ...data,
        read: false
      };

      setNotifications((prev) => [newNotif, ...prev]);
      setUnreadCount((prev) => prev + 1);

      if (soundEnabled) {
        playAlertChime(data.reorder?.reorder_status === 'FAILED');
      }

      setActiveToast({
        id: newNotif.id,
        type: data.reorder?.reorder_status === 'COMPLETED' ? 'success' : data.reorder?.reorder_status === 'FAILED' ? 'error' : 'info',
        title: data.title,
        message: data.message,
        timestamp: data.timestamp,
        reorder: data.reorder
      });
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, [soundEnabled]);

  const dismissToast = () => setActiveToast(null);

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  const clearNotifications = () => {
    setNotifications([]);
    setUnreadCount(0);
  };

  const toggleSound = () => setSoundEnabled((prev) => !prev);

  return (
    <SocketContext.Provider
      value={{
        socket,
        isConnected,
        notifications,
        activeToast,
        unreadCount,
        soundEnabled,
        toggleSound,
        dismissToast,
        markAllRead,
        clearNotifications
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

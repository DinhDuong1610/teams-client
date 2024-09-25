import { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

const useSocketIO = (url, subscribeMessage) => {
  const [messages, setMessages] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef(null);

  useEffect(() => {
    // Tạo socket kết nối
    socketRef.current = io(url);

    const handleConnect = () => {
      setIsConnected(true);
      console.log('Socket.IO connected');

      if (subscribeMessage) {
        socketRef.current.emit('subscribe', subscribeMessage);
      }
    };

    const handleDisconnect = () => {
      setIsConnected(false);
      console.log('Socket.IO disconnected');
    };

    const handleMessage = (message) => {
      console.log('Message received:', message);
      setMessages((prevMessages) => [...prevMessages, message]);
    };

    // Đăng ký các sự kiện socket
    socketRef.current.on('connect', handleConnect);
    socketRef.current.on('disconnect', handleDisconnect);
    socketRef.current.on('message', handleMessage);

    // Cleanup
    return () => {
      socketRef.current.off('connect', handleConnect);
      socketRef.current.off('disconnect', handleDisconnect);
      socketRef.current.off('message', handleMessage);

      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [url, subscribeMessage]); // Thêm subscribeMessage vào dependency array

  const sendMessage = (message) => {
    if (socketRef.current) {
      console.log('Sending message', message);
      socketRef.current.emit('message', message);
    }
  };

  return { messages, sendMessage, isConnected };
};

export default useSocketIO;

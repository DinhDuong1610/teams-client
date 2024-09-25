import { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

const useSocketIO = (url, subscribeMessage) => {
  const [messages, setMessages] = useState([]);
  const socketRef = useRef(null);

  useEffect(() => {
    socketRef.current = io(url);

    const handleConnect = () => {
      console.log('Socket.IO connected');
      if (subscribeMessage) {
        socketRef.current.emit('user:register', subscribeMessage);
      }
    };

    const handleMessage = (message) => {
      console.log('Message received:', message);
      setMessages((prevMessages) => [...prevMessages, message]);
    };

    const handleVideoCallRequest = (data) => {
      console.log('Video call request received:', data);
      // Callback để xử lý cuộc gọi
    };

    socketRef.current.on('connect', handleConnect);
    socketRef.current.on('sendMessage', handleMessage);
    socketRef.current.on('videoCallRequest', handleVideoCallRequest);
    socketRef.current.on('videoCallResponse', handleMessage); // Để xử lý phản hồi cuộc gọi video

    return () => {
      socketRef.current.disconnect();
    };
  }, [url, subscribeMessage]);

  const sendMessage = (message) => {
    if (socketRef.current) {
      // socketRef.current.emit('message', message);
      socketRef.current.emit('sendMessage', message);
    }
  };

  const videoCallRequest = (data) => {
    if (socketRef.current) {
      socketRef.current.emit('videoCallRequest', data);
    }
  };

  const videoCallResponse = (data) => {
    if (socketRef.current) {
      socketRef.current.emit('videoCallResponse', data);
    }
  };

  return { messages, sendMessage, videoCallRequest, videoCallResponse, socket: socketRef.current };
};

export default useSocketIO;

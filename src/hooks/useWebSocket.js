// import { useState, useEffect, useRef } from 'react';

// const useWebSocket = (url, subscribeMessage) => {
//   const [messages, setMessages] = useState([]);
//   const [isConnected, setIsConnected] = useState(false);
//   const wsRef = useRef(null);

import { useState, useEffect, useRef } from 'react';

const useWebSocket = (path, subscribeMessage) => {
  const [messages, setMessages] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef(null);

  // Construct the full WebSocket URL using localhost and the provided path
  const url = `ws://172.20.10.4:8081`;

  useEffect(() => {
    wsRef.current = new WebSocket(url);

    wsRef.current.onopen = () => {
      setIsConnected(true);
      console.log('WebSocket connected');

      if (subscribeMessage) {
        wsRef.current.send(JSON.stringify(subscribeMessage));
      }
    };

    wsRef.current.onclose = () => {
      setIsConnected(false);
      console.log('WebSocket disconnected');
    };

    wsRef.current.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        console.log('Message received:', message); 
          setMessages(prevMessages => [...prevMessages, message]);
      } catch (error) {
        console.error('Error parsing message:', error);
      }
    };

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [url]);

  const sendMessage = (message) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      console.log('Sending message', message); 
      wsRef.current.send(JSON.stringify(message));
    }
  };

  return { messages, sendMessage, isConnected };
};

export default useWebSocket;

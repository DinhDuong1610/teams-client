import React, { useState, useEffect, useRef } from "react";
import classNames from "classnames/bind";
import style from "./chatBox.module.scss";
import { auth } from "../../../database/firebase";
import upload from "../../../database/upload";
import useWebSocket from "../../../hooks/useWebSocket";
import { addDoc, collection, serverTimestamp, query, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "../../../database/firebase";
import Peer from "peerjs";

const cx = classNames.bind(style);

function ChatBox({ user }) {
  const [newMessage, setNewMessage] = useState("");
  const [image, setImage] = useState(null);
  const [messages, setMessages] = useState([]);

  const [calling, setCalling] = useState(false);
  const [peerId, setPeerId] = useState('');
  const [remotePeerIdValue, setRemotePeerIdValue] = useState('');
  const remoteVideoRef = useRef(null);
  const currentUserVideoRef = useRef(null);
  const peerInstance = useRef(null);

  const currentUserId = auth.currentUser?.uid;

  const subscribeMessage = {
    type: 'subscribe',
    user_from_chat: currentUserId,
  };

  const { messages: wsMessages, sendMessage, isConnected } = useWebSocket("ws://localhost:8081", subscribeMessage);

  useEffect(() => {
    if (user && currentUserId) {
      const messagesQuery = query(
        collection(db, "chat_user"),
        orderBy("created_at")
      );

      const unsubscribe = onSnapshot(messagesQuery, (querySnapshot) => {
        if (querySnapshot.empty) {
          console.log("No messages found.");
          setMessages([]);
        } else {
          const allMessages = querySnapshot.docs.map(doc => doc.data());
          const filteredMessages = allMessages.filter(msg => 
            (msg.user_from === currentUserId && msg.user_to === user.id) ||
            (msg.user_from === user.id && msg.user_to === currentUserId)
          );
          console.log("Loaded messages:", filteredMessages);
          setMessages(filteredMessages);
        }
      }, (error) => {
        console.error("Error fetching messages: ", error);
      });

      return () => unsubscribe();
    }
  }, [user, currentUserId]);

  useEffect(() => {
    if (wsMessages.length > 0) {
      const lastMessage = wsMessages[wsMessages.length - 1];
      setMessages(prevMessages => [...prevMessages, lastMessage]);
    }
  }, [wsMessages]);

  const handleSendMessage = async () => {
    if (newMessage.trim() || image) {
      try {
        let imageUrl = null;
        if (image) {
          imageUrl = await upload(image);
        }

        const message = {
          user_from: currentUserId,
          user_to: user.id,
          text: newMessage,
          image: imageUrl,
          created_at: serverTimestamp(),
          updated_at: serverTimestamp(),
        };

        await addDoc(collection(db, "chat_user"), message);
        sendMessage({
          type: 'sendMessage',
          ...message,
        });

        setNewMessage("");
        setImage(null);
      } catch (error) {
        console.error("Error sending message: ", error);
      }
    }
  };

  const handleImageChange = (e) => {
    if (e.target.files.length > 0) {
      setImage(e.target.files[0]);
    }
  };


  useEffect(() => {
    const peer = new Peer(currentUserId, {
      host: 'localhost',  // Địa chỉ IP hoặc domain của server PeerJS
      port: 9000,              // Port của server PeerJS
      path: '/',               // Đường dẫn tùy chọn
      secure: false            // Chỉ bật nếu server của bạn sử dụng HTTPS
    });
  
    peer.on('open', (id) => {
      setPeerId(id)
    });
  
    peer.on('call', (call) => {
      var getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
  
      getUserMedia({ video: true, audio: true }, (mediaStream) => {
        if (currentUserVideoRef.current) {
          currentUserVideoRef.current.srcObject = mediaStream;
          currentUserVideoRef.current.play();
        }
        call.answer(mediaStream);
        call.on('stream', function(remoteStream) {
          if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = remoteStream;
            remoteVideoRef.current.play();
          }
        });
      });
    });
  
    peerInstance.current = peer;
  }, []);
  
  const call = (remotePeerId) => {
    var getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
  
    getUserMedia({ video: true, audio: true }, (mediaStream) => {
      if (currentUserVideoRef.current) {
        currentUserVideoRef.current.srcObject = mediaStream;
        currentUserVideoRef.current.play();
      }
  
      const call = peerInstance.current.call(remotePeerId, mediaStream);
  
      call.on('stream', (remoteStream) => {
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = remoteStream;
          remoteVideoRef.current.play();
        }        
      });
  
      setCalling(true);
    });
  }
  


  return (
    <div className={cx('chatBox')}>
      <div className={cx('title')}>
        <div className={cx('user')}>
          <img src={user?.avatar || "./avatar.png"} alt={user?.username} />
          <div className={cx('username')}>{user?.username}</div>
        </div>
        <div className={cx('function')}>
          <button onClick={() => call(remotePeerIdValue)}>Call</button>
          <button>...</button>
        </div>
      </div>
      <div className={cx('body')}>
        {messages.map((msg, index) => (
          <div key={index} className={cx('message', { sent: msg.user_from === currentUserId })}>
            <div className={cx('messageContent')}>{msg.text}</div>
            {msg.image && <img src={msg.image} alt="message attachment" className={cx('messageImage')} />}
          </div>
        ))}
      </div>
      <div className={cx('bottom')}>
        <input
          type="text"
          placeholder="Type a message"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
        />
        <input
          type="file"
          onChange={handleImageChange}
        />
        <button onClick={handleSendMessage} disabled={!isConnected}>Send</button>
      </div>

      {
        calling && <div className={cx('calling')}>
          <div>
            <video ref={currentUserVideoRef} />
          </div>
          <div>
            <video ref={remoteVideoRef} />
          </div>
        </div>
      }
    </div>
  );
}

export default ChatBox;

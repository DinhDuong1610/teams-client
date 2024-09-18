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


  return (
    <div className={cx('chatBox')}>
      <div className={cx('title')}>
        <div className={cx('user')}>
          <img src={user?.avatar || "./avatar.png"} alt={user?.username} />
          <div className={cx('username')}>{user?.username}</div>
        </div>
        <div className={cx('function')}>
          <button>Call</button>
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
    </div>
  );
}

export default ChatBox;

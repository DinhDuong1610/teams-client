import React, { useState, useEffect, useRef } from 'react';
import classNames from 'classnames/bind';
import style from './chatBox.module.scss';
import { auth } from '../../../database/firebase';
import upload from '../../../database/upload';
import useSocketIO from '../../../hooks/useSocketIO'; 
import { addDoc, collection, serverTimestamp, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../../../database/firebase';
import createPeer from '../../../service/peer'; // Sử dụng hàm khởi tạo peer

const cx = classNames.bind(style);

function ChatBox({ user }) {
  const [newMessage, setNewMessage] = useState('');
  const [image, setImage] = useState(null);
  const [messages, setMessages] = useState([]);
  const [remoteSocketId, setRemoteSocketId] = useState(null);
  const [myStream, setMyStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [peer, setPeer] = useState(null); // Khởi tạo peer là null ban đầu
  const [incomingCall, setIncomingCall] = useState(null); // Thêm state cho cuộc gọi đến

  const currentUserId = auth.currentUser?.uid;
  const videoRef = useRef(null); // Tham chiếu đến video của người dùng
  const remoteVideoRef = useRef(null); // Tham chiếu đến video của người dùng khác

  const subscribeMessage = {
    type: 'subscribe',
    user_from_chat: currentUserId,
  };

  const { messages: socketMessages, sendMessage, isConnected } = useSocketIO('http://localhost:9000', subscribeMessage);

  // Lấy tin nhắn từ Firestore khi user và currentUserId thay đổi
  useEffect(() => {
    if (user && currentUserId) {
      const messagesQuery = query(collection(db, 'chat_user'), orderBy('created_at'));
      const unsubscribe = onSnapshot(messagesQuery, (querySnapshot) => {
        if (!querySnapshot.empty) {
          const allMessages = querySnapshot.docs.map(doc => doc.data());
          const filteredMessages = allMessages.filter(msg => 
            (msg.user_from === currentUserId && msg.user_to === user.id) ||
            (msg.user_from === user.id && msg.user_to === currentUserId)
          );
          setMessages(filteredMessages);
        } else {
          setMessages([]);
        }
      }, (error) => {
        console.error('Error fetching messages: ', error);
      });

      return () => unsubscribe();
    }
  }, [user, currentUserId]);

  // Nhận tin nhắn từ socketIO và cập nhật danh sách tin nhắn
  useEffect(() => {
    if (socketMessages.length > 0) {
      const lastMessage = socketMessages[socketMessages.length - 1];

      // Kiểm tra xem có phải là yêu cầu cuộc gọi không
      if (lastMessage.type === 'videoCallRequest') {
        setIncomingCall({
          from: lastMessage.from,
          signal: lastMessage.signal,
        });
      } else {
        setMessages(prevMessages => [...prevMessages, lastMessage]);
      }
    }
  }, [socketMessages]);

  // Hàm gửi tin nhắn
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

        await addDoc(collection(db, 'chat_user'), message);
        sendMessage(message);

        setNewMessage('');
        setImage(null);
      } catch (error) {
        console.error('Error sending message: ', error);
      }
    }
  };

  const handleImageChange = (e) => {
    if (e.target.files.length > 0) {
      setImage(e.target.files[0]);
    }
  };

  // Hàm gọi video
  const handleVideoCall = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
      setMyStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream; // Hiển thị video của chính mình
      }

      const newPeer = createPeer(true); // Tạo peer với tư cách người khởi tạo cuộc gọi
      setPeer(newPeer);

      newPeer.on('signal', (data) => {
        // Gửi yêu cầu cuộc gọi qua socket
        sendMessage({
          type: 'videoCallRequest',
          from: currentUserId,
          to: user.id,
          signal: data,
        });
      });

      newPeer.on('stream', (stream) => {
        // Khi nhận luồng video từ người khác
        setRemoteStream(stream);
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = stream; // Hiển thị video của người nhận
        }
      });

      stream.getTracks().forEach(track => {
        newPeer.addTrack(track, stream);
      });
    } catch (error) {
      console.error('Error in handleVideoCall: ', error);
    }
  };

  // Hàm chấp nhận cuộc gọi
  const acceptCall = async () => {
    if (incomingCall) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
        setMyStream(stream);
        if (videoRef.current) {
          videoRef.current.srcObject = stream; // Hiển thị video của chính mình
        }

        const newPeer = createPeer(false); // Tạo peer với tư cách người nhận cuộc gọi
        setPeer(newPeer);

        newPeer.on('signal', (data) => {
          // Gửi tín hiệu lại cho người gọi
          sendMessage({
            type: 'videoCallResponse',
            from: currentUserId,
            to: incomingCall.from,
            signal: data,
          });
        });

        newPeer.on('stream', (stream) => {
          // Khi nhận luồng video từ người khác
          setRemoteStream(stream);
          if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = stream; // Hiển thị video của người nhận
          }
        });

        stream.getTracks().forEach(track => {
          newPeer.addTrack(track, stream);
        });

        // Gửi tín hiệu cho người gọi
        newPeer.signal(incomingCall.signal);
        setIncomingCall(null); // Xóa thông báo cuộc gọi
      } catch (error) {
        console.error('Error accepting call: ', error);
      }
    }
  };

  // Hàm từ chối cuộc gọi
  const declineCall = () => {
    setIncomingCall(null); // Xóa thông báo cuộc gọi
  };

  return (
    <div className={cx('chatBox')}>
      <div className={cx('title')}>
        <div className={cx('user')}>
          <img src={user?.avatar || './avatar.png'} alt={user?.username} />
          <div className={cx('username')}>{user?.username}</div>
        </div>
        <div className={cx('function')}>
          <button onClick={handleVideoCall}>Call</button>
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
      {myStream && (
        <div className={cx('calling')}>
          <h2>My Video</h2>
          <video autoPlay playsInline ref={videoRef} />
        </div>
      )}
      {remoteStream && (
        <div className={cx('calling')}>
          <h2>Remote Video</h2>
          <video autoPlay playsInline ref={remoteVideoRef} />
        </div>
      )}
      {incomingCall && (
        <div className={cx('incomingCall')}>
          <h2>Incoming Call from {incomingCall.from}</h2>
          <button onClick={acceptCall}>Accept</button>
          <button onClick={declineCall}>Decline</button>
        </div>
      )}
    </div>
  );
}

export default ChatBox;

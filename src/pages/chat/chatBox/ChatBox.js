import React, { useState, useEffect, useRef } from "react";
import {
  addDoc,
  collection,
  serverTimestamp,
  query,
  orderBy,
  onSnapshot,
} from "firebase/firestore";
import { db } from "../../../database/firebase";
import upload from "../../../database/upload";
import useSocketIO from "../../../hooks/useSocketIO";
import { auth } from "../../../database/firebase";
import style from "./chatBox.module.scss";

function ChatBox({ user }) {
  const [newMessage, setNewMessage] = useState("");
  const [image, setImage] = useState(null);
  const [messages, setMessages] = useState([]);
  const [myStream, setMyStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [incomingCall, setIncomingCall] = useState(null);
  const [room, setRoom] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const currentUserId = auth.currentUser?.uid;
  const videoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerConnection = useRef(null);
  const { socket } = useSocketIO("http://localhost:9000", currentUserId);

  useEffect(() => {
    if (myStream && videoRef.current) {
      videoRef.current.srcObject = myStream;
    }
  }, [myStream]);

  useEffect(() => {
    if (socket) {
      const handleVideoCallRequest = (data) => {
        console.log("Incoming call:", data);
        setIncomingCall(data);
        setRoom(data.room);
      };

      const handleVideoCallResponse = async (data) => {
        if (data.signal) {
          await peerConnection.current.setRemoteDescription(
            new RTCSessionDescription(data.signal)
          );
        }
      };

      const handleIceCandidate = async (data) => {
        await peerConnection.current.addIceCandidate(
          new RTCIceCandidate(data.candidate)
        );
      };

      socket.on("videoCallRequest", handleVideoCallRequest);
      socket.on("videoCallResponse", handleVideoCallResponse);
      socket.on("iceCandidate", handleIceCandidate);

      return () => {
        socket.off("videoCallRequest", handleVideoCallRequest);
        socket.off("videoCallResponse", handleVideoCallResponse);
        socket.off("iceCandidate", handleIceCandidate);
      };
    }
  }, [socket]);

  useEffect(() => {
    if (user && currentUserId) {
      const messagesQuery = query(
        collection(db, "chat_user"),
        orderBy("created_at")
      );

      const unsubscribe = onSnapshot(messagesQuery, (querySnapshot) => {
        const filteredMessages = querySnapshot.docs
          .map((doc) => doc.data())
          .filter(
            (msg) =>
              (msg.user_from === currentUserId && msg.user_to === user.id) ||
              (msg.user_from === user.id && msg.user_to === currentUserId)
          );

        setMessages(filteredMessages);
      });

      return () => unsubscribe();
    }
  }, [user, currentUserId]);

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
        setNewMessage("");
        setImage(null);
      } catch (error) {
        console.error("Error sending message: ", error);
      }
    }
  };

  const handleVideoCall = async (userId) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: false,
      });

      setMyStream(stream);
      const roomId = `${currentUserId}-${userId}`;
      setRoom(roomId);

      peerConnection.current = new RTCPeerConnection({
        iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
      });

      // Thêm track âm thanh và video
      stream.getTracks().forEach((track) => {
        peerConnection.current.addTrack(track, stream);
      });

      peerConnection.current.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit("iceCandidate", {
            room: roomId,
            candidate: event.candidate,
          });
        }
      };

      const offer = await peerConnection.current.createOffer();
      await peerConnection.current.setLocalDescription(offer);
      socket.emit("videoCallRequest", {
        from: currentUserId,
        to: userId,
        signal: offer,
        room: roomId,
      });
    } catch (error) {
      console.error("Error starting video call: ", error);
    }
  };

  const acceptCall = async () => {
    if (!incomingCall) return;

    peerConnection.current = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    });

    myStream.getTracks().forEach((track) => {
      peerConnection.current.addTrack(track, myStream);
    });

    peerConnection.current.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit("iceCandidate", {
          room: incomingCall.room,
          candidate: event.candidate,
        });
      }
    };

    peerConnection.current.ontrack = (event) => {
      setRemoteStream(event.streams[0]);
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = event.streams[0];
      }
    };

    await peerConnection.current.setRemoteDescription(
      new RTCSessionDescription(incomingCall.signal)
    );
    const answer = await peerConnection.current.createAnswer();
    await peerConnection.current.setLocalDescription(answer);
    socket.emit("videoCallResponse", {
      from: currentUserId,
      to: incomingCall.from,
      signal: answer,
      room: incomingCall.room,
    });
    setIncomingCall(null);
  };

  const declineCall = () => {
    setIncomingCall(null);
  };

  const toggleMute = () => {
    if (myStream) {
      myStream.getAudioTracks().forEach((track) => {
        track.enabled = !track.enabled;
      });
      setIsMuted(!isMuted);
    }
  };

  const toggleCamera = async () => {
    if (myStream) {
      if (isCameraOn) {
        const videoTrack = myStream.getVideoTracks()[0];
        if (videoTrack) {
          videoTrack.enabled = false;
        }
        setIsCameraOn(false);
      } else {
        try {
          const videoStream = await navigator.mediaDevices.getUserMedia({
            video: true,
          });
          const videoTrack = videoStream.getVideoTracks()[0];
          setIsCameraOn(true);
          peerConnection.current.addTrack(videoTrack, videoStream);
          myStream.addTrack(videoTrack); // Cập nhật stream
        } catch (error) {
          console.error("Error turning on camera: ", error);
        }
      }
    }
  };

  const endCall = () => {
    if (peerConnection.current) {
      peerConnection.current.close();
      peerConnection.current = null;
    }
    setMyStream(null);
    setRemoteStream(null);
    setIncomingCall(null);
    setRoom(null);
  };

  return (
    <div className={style.chatBox}>
      <div className={style.title}>
        <div className={style.user}>
          <img
            src={user?.avatar || "./avatar.png"}
            alt={user?.username}
            style={{ width: "50px", height: "50px" }}
          />
          <div className={style.username}>{user?.username}</div>
        </div>
      </div>
      <div className={style.body}>
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`${style.message} ${
              msg.user_from === currentUserId ? style.sent : ""
            }`}
          >
            <div className={style.messageContent}>{msg.text}</div>
            {msg.image && (
              <img
                src={msg.image}
                alt="message attachment"
                style={{ width: "300px", height: "200px", objectFit: "cover", display: "block" }}
              />
            )}
          </div>
        ))}
      </div>
      <div className={style.footer}>
        <input
          type="text"
          value={newMessage || ""}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Enter a message..."
        />
        <input
          type="file"
          onChange={(e) => {
            if (e.target.files.length > 0) setImage(e.target.files[0]);
          }}
          style={{ width: "200px" }}
        />
        <button onClick={handleSendMessage}>Send</button>
      </div>
      <div className={style.videoContainer}>
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          style={{ width: "300px", height: "200px" }}
        />
        {isCameraOn && remoteStream ? (
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            style={{ width: "300px", height: "200px" }}
          />
        ) : (
          <div className={style.callingMessage}>Đang gọi...</div>
        )}
      </div>
      <div className={style.function}>
        <button onClick={() => handleVideoCall(user.id)}>Call</button>
        {incomingCall && (
          <div>
            <button onClick={acceptCall}>Accept</button>
            <button onClick={declineCall}>Decline</button>
          </div>
        )}
        <button onClick={toggleMute}>{isMuted ? "Unmute" : "Mute"}</button>
        <button onClick={toggleCamera}>
          {isCameraOn ? "Turn off Camera" : "Turn on Camera"}
        </button>
        <button onClick={endCall}>End Call</button>
      </div>
    </div>
  );
}

export default ChatBox;

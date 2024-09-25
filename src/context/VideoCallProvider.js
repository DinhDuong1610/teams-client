import React, { createContext, useContext, useEffect, useState } from 'react';
import createPeer from '../service/peer';
import { auth } from '../database/firebase';
import useSocketIO from '../hooks/useSocketIO';

const VideoCallContext = createContext(null);

export const useVideoCall = () => {
  return useContext(VideoCallContext);
};

export const VideoCallProvider = ({ children }) => {
  const [myStream, setMyStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [incomingCall, setIncomingCall] = useState(null);
  const [peer, setPeer] = useState(null);
  const currentUserId = auth.currentUser?.uid;

  const { socket } = useSocketIO('http://localhost:9000', {
    type: 'subscribe',
    user_from_chat: currentUserId,
  });

  useEffect(() => {
    const initializeMedia = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
        setMyStream(stream);
      } catch (error) {
        console.error("Error accessing media devices:", error);
      }
    };

    initializeMedia();
  }, []);

  useEffect(() => {
    if (socket) {
      const handleIncomingCall = (data) => {
        console.log('Incoming call received:', data);
        setIncomingCall(data);
      };

      socket.on('videoCallRequest', handleIncomingCall);

      socket.on('videoCallResponse', async (data) => {
        if (data.signal) {
          await peer.signal(data.signal);
        }
      });

      socket.on('iceCandidate', async (data) => {
        await peer.addIceCandidate(new RTCIceCandidate(data.candidate));
      });

      return () => {
        socket.off('videoCallRequest', handleIncomingCall);
        socket.off('videoCallResponse');
        socket.off('iceCandidate');
      };
    }
  }, [socket, peer]);

  const handleVideoCall = async (userId) => {
    if (!myStream) {
      console.error("No media stream available.");
      return;
    }

    const peerConnection = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
    });

    myStream.getTracks().forEach(track => {
      peerConnection.addTrack(track, myStream);
    });

    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit("iceCandidate", { to: userId, candidate: event.candidate });
      }
    };

    peerConnection.ontrack = (event) => {
      setRemoteStream(event.streams[0]);
    };

    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);
    socket.emit("videoCallRequest", { from: currentUserId, to: userId, signal: offer });

    setPeer(peerConnection);
  };

  const acceptCall = async (signal) => {
    try {
      const newPeer = createPeer(false, (signal) => {
        socket.emit('videoCallResponse', {
          from: currentUserId,
          to: incomingCall.from,
          signal,
        });
      }, (stream) => {
        setRemoteStream(stream);
      }, socket, incomingCall.from);

      myStream.getTracks().forEach(track => {
        newPeer.addTrack(track, myStream);
      });

      await newPeer.signal(signal);
      setIncomingCall(null);
      setPeer(newPeer);
    } catch (error) {
      console.error('Error accepting call:', error);
    }
  };

  const declineCall = () => {
    setIncomingCall(null);
  };

  return (
    <VideoCallContext.Provider value={{
      myStream,
      remoteStream,
      incomingCall,
      handleVideoCall,
      acceptCall,
      declineCall,
    }}>
      {children}
    </VideoCallContext.Provider>
  );
};

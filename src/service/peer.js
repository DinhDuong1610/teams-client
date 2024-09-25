class PeerService {
  constructor(isInitiator, onSignal, onStream, socket, remoteUserId) {
    this.peer = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:global.stun.twilio.com:3478' },
      ],
    });

    this.socket = socket;
    this.remoteUserId = remoteUserId;
    this.bindEvents(onSignal, onStream);
  }

  bindEvents(onSignal, onStream) {
    this.peer.onicecandidate = (event) => {
      if (event.candidate) {
        console.log('New ICE candidate: ', event.candidate);
        // Gửi ICE candidate ra ngoài
        this.socket.emit('iceCandidate', {
          to: this.remoteUserId,
          candidate: event.candidate,
        });
      }
    };

    this.peer.ontrack = (event) => {
      onStream(event.streams[0]); // Gọi hàm xử lý stream
    };
  }

  async addTrack(stream) {
    if (stream instanceof MediaStream) {
      stream.getTracks().forEach(track => {
        this.peer.addTrack(track, stream);
      });
    } else {
      throw new Error('Expected a MediaStream');
    }
  }

  async signal(data) {
    await this.peer.setRemoteDescription(new RTCSessionDescription(data));
  }

  getSignal() {
    return new Promise((resolve) => {
      this.peer.onicecandidate = (event) => {
        if (event.candidate === null) {
          resolve(this.peer.localDescription); // Khi không còn candidate
        }
      };
    });
  }
}

const createPeer = (isInitiator, onSignal, onStream, socket, remoteUserId) => 
  new PeerService(isInitiator, onSignal, onStream, socket, remoteUserId);

export default createPeer;

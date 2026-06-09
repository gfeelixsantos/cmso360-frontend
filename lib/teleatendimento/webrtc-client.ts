export type TeleatendimentoSignalSender = (payload: any) => void;

type Callbacks = {
  onRemoteStream: (stream: MediaStream) => void;
  onConnectionStateChange?: (state: RTCPeerConnectionState) => void;
  onIceConnectionStateChange?: (state: RTCIceConnectionState) => void;
};

export class TeleatendimentoWebRtcClient {
  private peer: RTCPeerConnection | null = null;
  private localStream: MediaStream | null = null;

  constructor(
    private readonly callbacks: Callbacks,
    private readonly sendOffer: TeleatendimentoSignalSender,
    private readonly sendAnswer: TeleatendimentoSignalSender,
    private readonly sendIceCandidate: TeleatendimentoSignalSender,
  ) {}

  async ensureLocalStream(constraints?: MediaStreamConstraints) {
    if (this.localStream) return this.localStream;

    this.localStream = await navigator.mediaDevices.getUserMedia(
      constraints || {
        audio: true,
        video: true,
      },
    );

    return this.localStream;
  }

  getLocalStream() {
    return this.localStream;
  }

  async createOffer() {
    const peer = await this.ensurePeer();
    const offer = await peer.createOffer({
      offerToReceiveAudio: true,
      offerToReceiveVideo: true,
    });
    await peer.setLocalDescription(offer);
    this.sendOffer(offer);
  }

  async handleOffer(payload: RTCSessionDescriptionInit) {
    const peer = await this.ensurePeer();
    await peer.setRemoteDescription(new RTCSessionDescription(payload));
    const answer = await peer.createAnswer();
    await peer.setLocalDescription(answer);
    this.sendAnswer(answer);
  }

  async handleAnswer(payload: RTCSessionDescriptionInit) {
    const peer = await this.ensurePeer();
    await peer.setRemoteDescription(new RTCSessionDescription(payload));
  }

  async handleIceCandidate(payload: RTCIceCandidateInit) {
    const peer = await this.ensurePeer();

    if (!payload?.candidate) return;

    try {
      await peer.addIceCandidate(new RTCIceCandidate(payload));
    } catch {
      // O browser pode reenfileirar em renegociacoes; ignorar falha isolada.
    }
  }

  setAudioEnabled(enabled: boolean) {
    this.localStream?.getAudioTracks().forEach((track) => {
      track.enabled = enabled;
    });
  }

  setVideoEnabled(enabled: boolean) {
    this.localStream?.getVideoTracks().forEach((track) => {
      track.enabled = enabled;
    });
  }

  destroy() {
    this.peer?.close();
    this.peer = null;
    this.localStream?.getTracks().forEach((track) => track.stop());
    this.localStream = null;
  }

  private async ensurePeer() {
    if (this.peer) return this.peer;

    await this.ensureLocalStream();

    const peer = new RTCPeerConnection({
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" },
      ],
    });

    this.localStream?.getTracks().forEach((track) => {
      if (this.localStream) {
        peer.addTrack(track, this.localStream);
      }
    });

    peer.ontrack = (event) => {
      const [stream] = event.streams;
      if (stream) {
        this.callbacks.onRemoteStream(stream);
      }
    };

    peer.onicecandidate = (event) => {
      if (event.candidate) {
        this.sendIceCandidate(event.candidate.toJSON());
      }
    };

    peer.onconnectionstatechange = () => {
      if (peer.connectionState) {
        this.callbacks.onConnectionStateChange?.(peer.connectionState);
      }
    };

    peer.oniceconnectionstatechange = () => {
      if (peer.iceConnectionState) {
        this.callbacks.onIceConnectionStateChange?.(peer.iceConnectionState);
      }
    };

    this.peer = peer;
    return peer;
  }
}

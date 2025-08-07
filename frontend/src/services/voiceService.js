import { connectToRoom, toggleMute as livekitToggleMute, disconnect as livekitDisconnect } from './livekitClient';

class VoiceService {
  constructor() {
    this.useLegacy = false;
    this.localStream = null;
    this.localTrack = null;
  }

  async connect(url, token, callbacks) {
    if (this.useLegacy) {
      return this.legacyConnect();
    }
    this.localTrack = await connectToRoom(url, token, callbacks);
    return this.localTrack;
  }

  async toggleMute() {
    if (this.useLegacy) {
      return this.legacyToggleMute();
    }
    return livekitToggleMute();
  }

  async disconnect() {
    if (this.useLegacy) {
      return this.legacyDisconnect();
    }
    await livekitDisconnect();
    this.localTrack = null;
  }

  async fallbackToLegacy() {
    await this.disconnect();
    this.useLegacy = true;
  }

  async legacyConnect() {
    if (!this.localStream) {
      this.localStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    }
    return this.localStream.getAudioTracks()[0];
  }

  async legacyToggleMute() {
    if (!this.localStream) return true;
    const track = this.localStream.getAudioTracks()[0];
    track.enabled = !track.enabled;
    return !track.enabled;
  }

  async legacyDisconnect() {
    if (this.localStream) {
      this.localStream.getTracks().forEach((t) => t.stop());
      this.localStream = null;
    }
  }
}

export default new VoiceService();

import { Room, RoomEvent, createLocalAudioTrack } from 'livekit-client';

let room = null;
let localTrack = null;

export async function connectToRoom(url, token, { onTrackSubscribed, onTrackUnsubscribed } = {}) {
  room = new Room();

  room.on(RoomEvent.TrackSubscribed, (track, publication, participant) => {
    if (track.kind === 'audio') {
      const stream = new MediaStream([track.mediaStreamTrack]);
      onTrackSubscribed && onTrackSubscribed(participant.identity, stream);
    }
  });

  room.on(RoomEvent.TrackUnsubscribed, (track, publication, participant) => {
    if (track.kind === 'audio') {
      onTrackUnsubscribed && onTrackUnsubscribed(participant.identity);
    }
  });

  room.on(RoomEvent.ParticipantDisconnected, (participant) => {
    onTrackUnsubscribed && onTrackUnsubscribed(participant.identity);
  });

  await room.connect(url, token);
  localTrack = await createLocalAudioTrack();
  await room.localParticipant.publishTrack(localTrack);
  return localTrack;
}

export async function toggleMute() {
  if (!localTrack) return true;
  if (localTrack.isMuted) {
    await localTrack.unmute();
    return false;
  }
  await localTrack.mute();
  return true;
}

export async function disconnect() {
  if (localTrack) {
    localTrack.stop();
    localTrack = null;
  }
  if (room) {
    await room.disconnect();
    room = null;
  }
}

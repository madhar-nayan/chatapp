import { useEffect, useRef, useState } from 'react';
import './VideoCall.css';

const ICE = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
};

export default function VideoCall({ socket, peerId, peerLabel, isCaller, remoteOffer, onEnd }) {
  const localRef = useRef(null);
  const remoteRef = useRef(null);
  const pcRef = useRef(null);
  const streamRef = useRef(null);
  const onEndRef = useRef(onEnd);
  onEndRef.current = onEnd;
  const [error, setError] = useState('');

  useEffect(() => {
    if (!socket || !peerId) return undefined;
    let cancelled = false;
    const offs = [];

    function offAll() {
      offs.forEach(([ev, fn]) => socket.off(ev, fn));
    }

    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (localRef.current) localRef.current.srcObject = stream;

        const pc = new RTCPeerConnection(ICE);
        pcRef.current = pc;
        stream.getTracks().forEach((track) => pc.addTrack(track, stream));

        pc.ontrack = (ev) => {
          if (remoteRef.current && ev.streams[0]) {
            remoteRef.current.srcObject = ev.streams[0];
          }
        };

        pc.onicecandidate = (ev) => {
          if (ev.candidate) socket.emit('call:ice', { to: peerId, candidate: ev.candidate });
        };

        const onIce = ({ from, candidate }) => {
          if (from !== peerId || !candidate || !pcRef.current) return;
          pcRef.current.addIceCandidate(new RTCIceCandidate(candidate)).catch(() => {});
        };
        socket.on('call:ice', onIce);
        offs.push(['call:ice', onIce]);

        const onEndRemote = ({ from }) => {
          if (from === peerId) onEndRef.current?.();
        };
        socket.on('call:end', onEndRemote);
        offs.push(['call:end', onEndRemote]);

        if (isCaller) {
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          socket.emit('call:offer', { to: peerId, offer: pc.localDescription });

          const onAnswer = ({ from, answer }) => {
            if (from !== peerId || !pcRef.current) return;
            pcRef.current.setRemoteDescription(new RTCSessionDescription(answer)).catch(() => {});
          };
          socket.on('call:answer', onAnswer);
          offs.push(['call:answer', onAnswer]);
        } else if (remoteOffer) {
          await pc.setRemoteDescription(new RTCSessionDescription(remoteOffer));
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          socket.emit('call:answer', { to: peerId, answer: pc.localDescription });
        }
      } catch (e) {
        if (!cancelled) setError(e.message || 'Camera or microphone unavailable');
      }
    })();

    return () => {
      cancelled = true;
      offAll();
      if (pcRef.current) {
        pcRef.current.close();
        pcRef.current = null;
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
      socket.emit('call:end', { to: peerId });
    };
  }, [socket, peerId, isCaller, remoteOffer]);

  return (
    <div className="video-overlay" role="dialog" aria-label="Video call">
      <div className="video-panel card">
        <header className="video-head">
          <h3>Call — {peerLabel}</h3>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => onEndRef.current?.()}>
            End call
          </button>
        </header>
        {error ? <p className="error-msg">{error}</p> : null}
        <div className="video-grid">
          <div className="video-tile">
            <span className="video-label">You</span>
            <video ref={localRef} autoPlay playsInline muted className="video-el" />
          </div>
          <div className="video-tile">
            <span className="video-label">{peerLabel}</span>
            <video ref={remoteRef} autoPlay playsInline className="video-el" />
          </div>
        </div>
      </div>
    </div>
  );
}

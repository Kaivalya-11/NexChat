import React, { useState, useRef, useEffect } from 'react';
import { RiCamera3Fill, RiCloseLine, RiCameraSwitchLine } from 'react-icons/ri';
import * as api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export default function CameraModal({ onClose, onAttach }) {
  const { token } = useAuth();
  const videoRef = useRef(null);
  const [cameraStream, setCameraStream] = useState(null);
  const [capturedImage, setCapturedImage] = useState(null);
  const [cameraErr, setCameraErr] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [facingMode, setFacingMode] = useState('user');

  useEffect(() => {
    // Stop any existing stream before requesting a new one
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
    }
    
    navigator.mediaDevices?.getUserMedia({ video: { facingMode } })
      .then(stream => {
        setCameraStream(stream);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      })
      .catch(err => {
        setCameraErr('Camera access unavailable or denied');
      });

    return () => {
      if (cameraStream) {
         cameraStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [facingMode]); // eslint-disable-line react-hooks/exhaustive-deps

  const snapPhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth || 640;
      canvas.height = videoRef.current.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      setCapturedImage(canvas.toDataURL('image/jpeg'));
    }
  };

  const uploadPhoto = async () => {
    if (!capturedImage) return;
    setIsUploading(true);
    try {
      const res = await fetch(capturedImage);
      const blob = await res.blob();
      const file = new File([blob], `camera_${Date.now()}.jpg`, { type: 'image/jpeg' });
      const uploaded = await api.uploadFile(token, file);
      onAttach(uploaded);
    } catch (err) {
      alert('Failed to upload camera snapshot: ' + err.message);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
    }}>
      <div style={{
        backgroundColor: 'var(--bg-card)', borderRadius: '16px', width: '90%', maxWidth: '520px',
        padding: '20px', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 20px 50px rgba(0,0,0,0.7)',
        display: 'flex', flexDirection: 'column', alignItems: 'center'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', marginBottom: '16px', alignItems: 'center' }}>
          <h3 style={{ margin: 0, color: 'var(--text-main)', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <RiCamera3Fill size={20} style={{ color: '#ff2d55' }} /> Take Photo
          </h3>
          <div style={{ display: 'flex', gap: '8px' }}>
            {!capturedImage && (
              <button className="btn-icon" onClick={() => setFacingMode(prev => prev === 'user' ? 'environment' : 'user')} title="Switch Camera">
                <RiCameraSwitchLine size={22} />
              </button>
            )}
            <button className="btn-icon" onClick={onClose}>
              <RiCloseLine size={22} />
            </button>
          </div>
        </div>

        {cameraErr ? (
          <div style={{ color: '#ff4d4f', padding: '20px', textAlign: 'center' }}>{cameraErr}</div>
        ) : capturedImage ? (
          <img src={capturedImage} alt="Captured" style={{ width: '100%', height: '320px', objectFit: 'cover', borderRadius: '12px', marginBottom: '16px' }} />
        ) : (
          <video ref={videoRef} autoPlay playsInline style={{ width: '100%', height: '320px', objectFit: 'cover', borderRadius: '12px', backgroundColor: '#000', marginBottom: '16px' }} />
        )}

        <div style={{ display: 'flex', gap: '12px', width: '100%', justifyContent: 'center' }}>
          {capturedImage ? (
            <>
              <button className="btn btn-secondary" onClick={() => setCapturedImage(null)} style={{ flex: 1 }} disabled={isUploading}>
                Retake
              </button>
              <button className="btn btn-primary" onClick={uploadPhoto} style={{ flex: 1 }} disabled={isUploading}>
                {isUploading ? 'Uploading...' : 'Attach Photo'}
              </button>
            </>
          ) : (
            <button className="btn btn-primary" onClick={snapPhoto} disabled={!!cameraErr} style={{ width: '100%', padding: '12px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              <RiCamera3Fill size={20} /> Capture Photo
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

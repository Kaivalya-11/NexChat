import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactCrop, { centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import * as api from '../../services/api';
import {
  RiCloseLine, RiSave3Fill, RiImageLine, RiCameraLine, RiCropLine, RiCheckLine
} from 'react-icons/ri';

function centerAspectCrop(mediaWidth, mediaHeight, aspect) {
  return centerCrop(
    makeAspectCrop({ unit: '%', width: 80 }, aspect, mediaWidth, mediaHeight),
    mediaWidth,
    mediaHeight
  );
}

async function getCroppedBlob(imageSrc, crop, fileName) {
  const image = new Image();
  image.src = imageSrc;
  await new Promise(res => { image.onload = res; });

  const canvas = document.createElement('canvas');
  const scaleX = image.naturalWidth / image.width;
  const scaleY = image.naturalHeight / image.height;
  const pixelCrop = {
    x: crop.x * scaleX,
    y: crop.y * scaleY,
    width: crop.width * scaleX,
    height: crop.height * scaleY,
  };

  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(image, pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height, 0, 0, pixelCrop.width, pixelCrop.height);
  return new Promise(resolve => canvas.toBlob(blob => resolve(blob), 'image/jpeg', 0.92));
}

export default function ProfileModal({ onClose }) {
  const { user, updateProfile, token } = useAuth();
  const { socket } = useSocket();
  const [status, setStatus] = useState(user.status || 'online');
  const [statusText, setStatusText] = useState(user.statusText || '');
  const [avatar, setAvatar] = useState(user.avatar || '');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Source picker menu
  const [showSourceMenu, setShowSourceMenu] = useState(false);

  // Crop modal
  const [cropSrc, setCropSrc] = useState(null);
  const [crop, setCrop] = useState();
  const [completedCrop, setCompletedCrop] = useState();
  const [cropFileName, setCropFileName] = useState('avatar.jpg');
  const imgRef = useRef(null);

  // Camera
  const [showCamera, setShowCamera] = useState(false);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const fileInputRef = useRef(null);

  // Camera lifecycle
  useEffect(() => {
    if (showCamera) {
      navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } })
        .then(stream => {
          streamRef.current = stream;
          if (videoRef.current) videoRef.current.srcObject = stream;
        })
        .catch(() => {
          alert('Could not access camera. Please allow camera permissions.');
          setShowCamera(false);
        });
    } else {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
        streamRef.current = null;
      }
    }
    return () => {
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
    };
  }, [showCamera]);

  const openFileGallery = () => {
    setShowSourceMenu(false);
    fileInputRef.current?.click();
  };

  const openCamera = () => {
    setShowSourceMenu(false);
    setShowCamera(true);
  };

  const capturePhoto = () => {
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    canvas.getContext('2d').drawImage(videoRef.current, 0, 0);
    canvas.toBlob(blob => {
      const url = URL.createObjectURL(blob);
      setCropSrc(url);
      setCropFileName('camera-capture.jpg');
      setShowCamera(false);
    }, 'image/jpeg', 0.92);
  };

  const onFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setCropFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => setCropSrc(reader.result);
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const onImageLoad = useCallback((e) => {
    const { naturalWidth: width, naturalHeight: height } = e.currentTarget;
    setCrop(centerAspectCrop(width, height, 1));
  }, []);

  const handleCropConfirm = async () => {
    if (!completedCrop || !imgRef.current) return;
    setUploading(true);
    setCropSrc(null);
    try {
      const blob = await getCroppedBlob(imgRef.current.src, completedCrop, cropFileName);
      const file = new File([blob], cropFileName, { type: 'image/jpeg' });
      const result = await api.uploadFile(token, file);
      setAvatar(result.url);
    } catch (err) {
      alert('Failed to upload: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateProfile({ status, statusText, avatar });
      if (socket) socket.emit('update-status', { status, statusText });
      onClose();
    } catch {
      alert('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div
      className="modal-overlay"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      onClick={onClose}
    >
      <motion.div
        className="modal-content"
        style={{ padding: '24px', maxWidth: '420px', width: '100%' }}
        initial={{ scale: 0.9, opacity: 0, y: 15 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 10 }}
        transition={{ type: 'spring', damping: 25, stiffness: 280 }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 style={{ margin: 0, fontSize: '1.25rem' }}>Edit Profile</h2>
          <button className="btn-icon" onClick={onClose}><RiCloseLine size={22} /></button>
        </div>

        <form onSubmit={handleSave}>
          {/* Avatar Section */}
          <div className="form-group" style={{ alignItems: 'center', marginBottom: '24px' }}>
            <div style={{ position: 'relative', width: '88px', height: '88px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {/* Spinning upload ring */}
              {uploading && (
                <svg width="88" height="88" viewBox="0 0 88 88"
                  style={{ position: 'absolute', top: 0, left: 0, animation: 'spin 1s linear infinite', zIndex: 2 }}>
                  <circle cx="44" cy="44" r="41" fill="none" stroke="#22c55e"
                    strokeWidth="4" strokeLinecap="round" strokeDasharray="200 60" />
                </svg>
              )}
              <motion.img
                whileHover={{ scale: uploading ? 1 : 1.06 }}
                whileTap={{ scale: uploading ? 1 : 0.95 }}
                src={avatar || `https://ui-avatars.com/api/?name=${user.username}`}
                alt="Avatar"
                style={{
                  width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover',
                  border: uploading ? '3px solid #22c55e' : '3px solid var(--accent-primary)',
                  cursor: uploading ? 'wait' : 'pointer',
                  boxShadow: uploading ? '0 0 16px rgba(34,197,94,0.5)' : '0 4px 14px rgba(0,0,0,0.3)',
                  opacity: uploading ? 0.75 : 1, transition: 'all 0.3s ease'
                }}
                onClick={() => !uploading && setShowSourceMenu(v => !v)}
              />
            </div>

            {/* Source picker popup */}
            <AnimatePresence>
              {showSourceMenu && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: -6 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: -6 }}
                  transition={{ duration: 0.15 }}
                  style={{
                    position: 'absolute', top: '96px', left: '50%', transform: 'translateX(-50%)',
                    backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)',
                    borderRadius: '12px', padding: '8px', zIndex: 50,
                    display: 'flex', flexDirection: 'column', gap: '4px',
                    boxShadow: 'var(--shadow-md)', minWidth: '180px'
                  }}
                >
                  <button type="button"
                    onClick={openFileGallery}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '10px',
                      padding: '10px 14px', borderRadius: '8px', border: 'none',
                      background: 'transparent', color: 'var(--text-main)', cursor: 'pointer',
                      fontSize: '0.9rem', fontWeight: 500, transition: 'background 0.15s',
                      fontFamily: 'inherit'
                    }}
                    onMouseOver={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                    onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <RiImageLine size={18} color="var(--accent-primary)" />
                    Gallery / Media
                  </button>
                  <button type="button"
                    onClick={openCamera}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '10px',
                      padding: '10px 14px', borderRadius: '8px', border: 'none',
                      background: 'transparent', color: 'var(--text-main)', cursor: 'pointer',
                      fontSize: '0.9rem', fontWeight: 500, transition: 'background 0.15s',
                      fontFamily: 'inherit'
                    }}
                    onMouseOver={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                    onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <RiCameraLine size={18} color="#22c55e" />
                    Camera
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            <input ref={fileInputRef} type="file" style={{ display: 'none' }} accept="image/*" onChange={onFileChange} />

            <div style={{ fontSize: '0.8rem', color: uploading ? '#22c55e' : 'var(--text-muted)', marginTop: '8px', transition: 'color 0.3s ease' }}>
              {uploading ? 'Uploading...' : 'Click image to change photo'}
            </div>
          </div>

          {/* Status Text */}
          <div className="form-group">
            <label className="form-label">Status Text</label>
            <input type="text" className="form-input" value={statusText}
              onChange={e => setStatusText(e.target.value)} placeholder="What's on your mind?" />
          </div>

          {/* Presence */}
          <div className="form-group">
            <label className="form-label">Presence</label>
            <select className="form-input" value={status} onChange={e => setStatus(e.target.value)}
              style={{ backgroundColor: 'var(--bg-darkest)' }}>
              <option value="online">🟢 Online</option>
              <option value="away">🟠 Away</option>
              <option value="dnd">🔴 Do Not Disturb</option>
              <option value="offline">⚪ Offline (Invisible)</option>
            </select>
          </div>

          <div style={{ marginTop: '32px', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              type="submit" className="btn btn-primary" disabled={saving}
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <RiSave3Fill size={18} /> {saving ? 'Saving...' : 'Save Changes'}
            </motion.button>
          </div>
        </form>
      </motion.div>

      {/* Camera Modal */}
      <AnimatePresence>
        {showCamera && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{
              position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.9)',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              zIndex: 99999, gap: '20px'
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ position: 'relative' }}>
              <video ref={videoRef} autoPlay playsInline muted
                style={{ width: '360px', height: '360px', objectFit: 'cover', borderRadius: '50%', border: '3px solid #22c55e' }} />
            </div>
            <div style={{ display: 'flex', gap: '16px' }}>
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                onClick={capturePhoto}
                style={{
                  padding: '14px 28px', borderRadius: '50px', border: 'none',
                  backgroundColor: '#22c55e', color: '#000', fontWeight: 700,
                  fontSize: '1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px'
                }}>
                <RiCameraLine size={20} /> Capture
              </motion.button>
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                onClick={() => setShowCamera(false)}
                style={{
                  padding: '14px 28px', borderRadius: '50px', border: '1px solid var(--border-color)',
                  backgroundColor: 'var(--bg-card)', color: 'var(--text-main)', fontWeight: 600,
                  fontSize: '1rem', cursor: 'pointer'
                }}>
                Cancel
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Crop Modal */}
      <AnimatePresence>
        {cropSrc && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{
              position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.92)',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              zIndex: 99999, gap: '20px', padding: '20px'
            }}
            onClick={e => e.stopPropagation()}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              style={{
                backgroundColor: 'var(--bg-card)', borderRadius: '16px', padding: '24px',
                border: '1px solid var(--border-color)', maxWidth: '480px', width: '100%',
                display: 'flex', flexDirection: 'column', gap: '20px', alignItems: 'center'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', alignSelf: 'flex-start' }}>
                <RiCropLine size={20} color="var(--accent-primary)" />
                <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-main)' }}>Crop Photo</h3>
              </div>

              <div style={{ maxHeight: '380px', overflow: 'auto', borderRadius: '8px' }}>
                <ReactCrop
                  crop={crop}
                  onChange={c => setCrop(c)}
                  onComplete={c => setCompletedCrop(c)}
                  aspect={1}
                  circularCrop
                  keepSelection
                >
                  <img
                    ref={imgRef}
                    src={cropSrc}
                    alt="Crop preview"
                    onLoad={onImageLoad}
                    style={{ maxWidth: '100%', maxHeight: '360px', display: 'block' }}
                  />
                </ReactCrop>
              </div>

              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                Drag to reposition · Resize handles to adjust
              </p>

              <div style={{ display: 'flex', gap: '12px', width: '100%' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ flex: 1 }}
                  onClick={() => setCropSrc(null)}
                >
                  Cancel
                </button>
                <motion.button
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  type="button"
                  onClick={handleCropConfirm}
                  style={{
                    flex: 1, padding: '10px', borderRadius: '8px', border: 'none',
                    backgroundColor: '#22c55e', color: '#000', fontWeight: 700,
                    fontSize: '0.95rem', cursor: 'pointer', display: 'flex',
                    alignItems: 'center', justifyContent: 'center', gap: '8px'
                  }}
                >
                  <RiCheckLine size={18} /> Apply Crop
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

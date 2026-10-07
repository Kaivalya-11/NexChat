import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useChat } from '../../context/ChatContext';
import { 
  RiCloseLine, 
  RiDownload2Line, 
  RiExternalLinkLine, 
  RiZoomInLine, 
  RiZoomOutLine, 
  RiRestartLine,
  RiFileTextFill,
  RiImage2Fill,
  RiVideoFill,
  RiHeadphoneFill
} from 'react-icons/ri';

export default function MediaPreviewModal() {
  const { previewMedia, setPreviewMedia } = useChat();
  const [zoom, setZoom] = useState(1);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setZoom(1);

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setPreviewMedia(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [previewMedia, setPreviewMedia]);

  if (!previewMedia) return null;

  const { url, fileName = 'File Attachment', fileType, fileSize, contentType } = previewMedia;

  const isImage = fileType === 'image' || contentType === 'sticker' || (fileName && /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(fileName)) || (url && /\.(jpg|jpeg|png|gif|webp|svg)($|\?)/i.test(url));
  const isVideo = fileType === 'video' || (fileName && /\.(mp4|webm|mov|mkv)$/i.test(fileName));
  const isAudio = fileType === 'audio' || (fileName && /\.(mp3|wav|ogg|m4a|webm)$/i.test(fileName));
  const isDocument = (fileName && /\.(pdf|doc|docx|xls|xlsx|ppt|pptx|csv|rtf|txt)$/i.test(fileName)) || (url && /\.pdf($|\?)/i.test(url));

  const handleDownload = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (isDownloading) return;
    setIsDownloading(true);
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = fileName || 'download';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error('Download failed', err);
      window.open(url, '_blank');
    } finally {
      setIsDownloading(false);
    }
  };

  const formatSize = (bytes) => {
    if (!bytes) return '';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        onClick={() => setPreviewMedia(null)}
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(5, 8, 14, 0.92)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          zIndex: 10000,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px'
        }}
      >
        <motion.div
          initial={{ y: -30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -30, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          style={{
            width: '100%',
            maxWidth: '960px',
            backgroundColor: 'rgba(22, 27, 34, 0.85)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '16px',
            padding: '12px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 10px 30px rgba(0,0,0,0.6)',
            zIndex: 10001
          }}
        >
          {/* File Info */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0, flex: 1, marginRight: '16px' }}>
            <div style={{ padding: '8px', borderRadius: '10px', backgroundColor: 'rgba(99, 102, 241, 0.15)', color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {isImage ? <RiImage2Fill size={20} /> : isVideo ? <RiVideoFill size={20} /> : isAudio ? <RiHeadphoneFill size={20} /> : <RiFileTextFill size={20} />}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontWeight: 600, color: '#fff', fontSize: '0.95rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {fileName}
              </div>
              {fileSize && (
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  {formatSize(fileSize)}
                </div>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {isImage && (
              <>
                <button
                  className="btn-icon"
                  title="Zoom Out"
                  onClick={() => setZoom(prev => Math.max(0.5, prev - 0.25))}
                  style={{ backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: '8px', padding: '6px' }}
                >
                  <RiZoomOutLine size={18} />
                </button>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', minWidth: '40px', textAlign: 'center', userSelect: 'none' }}>
                  {Math.round(zoom * 100)}%
                </span>
                <button
                  className="btn-icon"
                  title="Zoom In"
                  onClick={() => setZoom(prev => Math.min(3, prev + 0.25))}
                  style={{ backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: '8px', padding: '6px' }}
                >
                  <RiZoomInLine size={18} />
                </button>
                <button
                  className="btn-icon"
                  title="Reset Zoom"
                  onClick={() => setZoom(1)}
                  style={{ backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: '8px', padding: '6px', marginRight: '8px' }}
                >
                  <RiRestartLine size={18} />
                </button>
              </>
            )}

            <button
              className="btn btn-secondary"
              title="Download File"
              onClick={handleDownload}
              disabled={isDownloading}
              style={{ padding: '6px 14px', fontSize: '0.85rem', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '6px', cursor: isDownloading ? 'wait' : 'pointer' }}
            >
              <RiDownload2Line size={16} /> {isDownloading ? 'Downloading...' : 'Download'}
            </button>

            <a
              href={url}
              target="_blank"
              rel="noreferrer"
              className="btn-icon"
              title="Open in New Tab"
              onClick={(e) => e.stopPropagation()}
              style={{ backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: '10px', padding: '8px' }}
            >
              <RiExternalLinkLine size={18} />
            </a>

            <button
              className="btn-icon"
              title="Close (Esc)"
              onClick={() => setPreviewMedia(null)}
              style={{ backgroundColor: 'rgba(239, 68, 68, 0.2)', color: '#ff4d4f', borderRadius: '10px', padding: '8px', marginLeft: '4px' }}
            >
              <RiCloseLine size={20} />
            </button>
          </div>
        </motion.div>

        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            flex: 1,
            width: '100%',
            maxWidth: '1100px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px 0',
            overflow: 'auto',
            position: 'relative'
          }}
        >
          {isImage ? (
            <motion.div
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.85, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 280 }}
              style={{
                transform: `scale(${zoom})`,
                transition: 'transform 0.15s ease-out',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                maxHeight: '100%',
                maxWidth: '100%'
              }}
            >
              <img
                src={url}
                alt={fileName}
                style={{
                  maxWidth: '90vw',
                  maxHeight: '75vh',
                  objectFit: 'contain',
                  borderRadius: '16px',
                  boxShadow: '0 20px 60px rgba(0,0,0,0.8)',
                  border: '1px solid rgba(255,255,255,0.1)'
                }}
              />
            </motion.div>
          ) : isVideo ? (
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              style={{ width: '100%', maxWidth: '900px', display: 'flex', justifyContent: 'center' }}
            >
              <video
                controls
                autoPlay
                src={url}
                style={{
                  width: '100%',
                  maxHeight: '75vh',
                  borderRadius: '16px',
                  backgroundColor: '#000',
                  boxShadow: '0 20px 60px rgba(0,0,0,0.8)',
                  border: '1px solid rgba(255,255,255,0.1)'
                }}
              />
            </motion.div>
          ) : isAudio ? (
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              style={{
                backgroundColor: '#161b22',
                padding: '32px 40px',
                borderRadius: '20px',
                border: '1px solid rgba(255,255,255,0.1)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '20px',
                boxShadow: '0 20px 50px rgba(0,0,0,0.7)'
              }}
            >
              <div style={{ width: '70px', height: '70px', borderRadius: '50%', backgroundColor: 'rgba(99, 102, 241, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-primary)' }}>
                <RiHeadphoneFill size={36} />
              </div>
              <div style={{ fontWeight: 600, color: '#fff', fontSize: '1.1rem' }}>{fileName}</div>
              <audio controls autoPlay src={url} style={{ width: '320px' }} />
            </motion.div>
          ) : isDocument ? (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              style={{ width: '100%', height: '75vh', borderRadius: '16px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 20px 60px rgba(0,0,0,0.8)', backgroundColor: '#fff' }}
            >
              <iframe src={`https://docs.google.com/viewer?url=${encodeURIComponent(url)}&embedded=true`} title={fileName} style={{ width: '100%', height: '100%', border: 'none' }} />
            </motion.div>
          ) : (
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              style={{
                backgroundColor: '#161b22',
                padding: '40px 50px',
                borderRadius: '24px',
                border: '1px solid rgba(255,255,255,0.12)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
                gap: '16px',
                maxWidth: '480px',
                boxShadow: '0 20px 50px rgba(0,0,0,0.7)'
              }}
            >
              <div style={{ width: '80px', height: '80px', borderRadius: '20px', backgroundColor: 'rgba(99, 102, 241, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-primary)' }}>
                <RiFileTextFill size={44} />
              </div>
              <div>
                <div style={{ fontWeight: 700, color: '#fff', fontSize: '1.2rem', marginBottom: '6px' }}>{fileName}</div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{formatSize(fileSize) || 'Document file'}</div>
              </div>
              <div style={{ display: 'flex', gap: '12px', marginTop: '12px', width: '100%' }}>
                <button
                  className="btn btn-primary"
                  onClick={handleDownload}
                  disabled={isDownloading}
                  style={{ flex: 1, padding: '12px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: isDownloading ? 'wait' : 'pointer' }}
                >
                  <RiDownload2Line size={18} /> {isDownloading ? 'Downloading...' : 'Download Document'}
                </button>
              </div>
            </motion.div>
          )}
        </div>

        <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', paddingBottom: '4px', userSelect: 'none' }}>
          Click anywhere outside or press Esc to close preview
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

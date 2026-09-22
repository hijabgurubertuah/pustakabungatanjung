import React, { useEffect, useRef, useState } from 'react';
import { Camera, X, RefreshCw, Check, AlertCircle, Image as ImageIcon, Sparkles } from 'lucide-react';
import { captureVideoFrame, compressImageFile } from '../../lib/imageUtils';

interface CameraPhotoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (imageDataUrl: string) => void;
  title?: string;
}

export const CameraPhotoModal: React.FC<CameraPhotoModalProps> = ({
  isOpen,
  onClose,
  onCapture,
  title = 'Foto Sampul Buku',
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [flash, setFlash] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      setCapturedPhoto(null);
      setCameraError(null);
      return;
    }

    startCamera(facingMode);

    return () => {
      stopCamera();
    };
  }, [isOpen, facingMode]);

  const startCamera = async (mode: 'environment' | 'user') => {
    stopCamera();
    setCameraError(null);
    setCameraActive(false);

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Perangkat tidak mendukung akses kamera langsung');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: mode },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
      }
      setCameraActive(true);
    } catch (err: any) {
      console.warn('Camera access issue:', err);
      setCameraActive(false);
      setCameraError(
        err?.name === 'NotAllowedError'
          ? 'Izin kamera belum diberikan. Anda dapat menggunakan tombol "Kamera HP Langsung" di bawah.'
          : 'Kamera langsung tidak dapat diakses pada browser ini. Silakan gunakan tombol kamera sistem di bawah.'
      );
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  };

  const switchCamera = () => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  const handleTakeSnapshot = () => {
    if (!videoRef.current) return;
    setFlash(true);
    setTimeout(() => setFlash(false), 200);

    const dataUrl = captureVideoFrame(videoRef.current);
    if (dataUrl) {
      setCapturedPhoto(dataUrl);
    } else {
      setCameraError('Gagal mengambil gambar dari kamera. Coba lagi.');
    }
  };

  const handleConfirmPhoto = () => {
    if (capturedPhoto) {
      onCapture(capturedPhoto);
      onClose();
    }
  };

  const handleRetake = () => {
    setCapturedPhoto(null);
    if (!cameraActive) {
      startCamera(facingMode);
    }
  };

  // Fallback direct mobile camera via native file input
  const handleNativeCameraFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressed = await compressImageFile(file);
        setCapturedPhoto(compressed);
      } catch (err: any) {
        setCameraError(err.message || 'Gagal memproses foto.');
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-3 sm:p-4">
      <div className="relative bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-900/90 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Camera className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-slate-100 text-sm">{title}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Viewfinder / Preview Area */}
        <div className="relative flex-1 bg-black flex items-center justify-center min-h-[340px] sm:min-h-[400px] overflow-hidden">
          {/* Flash Effect */}
          {flash && <div className="absolute inset-0 bg-white z-40 animate-out fade-out duration-200" />}

          {capturedPhoto ? (
            /* Snapshot Review View */
            <div className="relative w-full h-full flex flex-col items-center justify-center p-4">
              <img
                src={capturedPhoto}
                alt="Captured Cover"
                className="max-h-[340px] sm:max-h-[380px] w-auto object-contain rounded-xl border border-slate-700 shadow-xl"
              />
              <div className="absolute top-6 px-3 py-1 bg-black/70 backdrop-blur-xs text-emerald-400 text-xs font-semibold rounded-full border border-emerald-500/30 flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5" />
                <span>Foto Berhasil Diambil</span>
              </div>
            </div>
          ) : (
            /* Live Camera View */
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />

              {/* Guide Overlay for Book Cover Framing */}
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center p-6">
                <div className="w-48 h-64 sm:w-56 sm:h-76 border-2 border-dashed border-indigo-400/70 rounded-2xl relative shadow-2xl">
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-indigo-600/90 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full shadow-xs">
                    Posisikan Sampul Buku
                  </div>
                  {/* Corner accents */}
                  <div className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-white rounded-tl" />
                  <div className="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 border-white rounded-tr" />
                  <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 border-white rounded-bl" />
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-white rounded-br" />
                </div>
              </div>

              {/* Switch Camera Button (floating top-right) */}
              <button
                type="button"
                onClick={switchCamera}
                className="absolute top-3 right-3 p-2 bg-black/60 hover:bg-black/80 text-white rounded-xl backdrop-blur-xs border border-white/20 transition-all cursor-pointer"
                title="Putar Kamera Depan/Belakang"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </>
          )}

          {/* Camera Error / Fallback Card */}
          {cameraError && !capturedPhoto && (
            <div className="absolute inset-0 bg-slate-950/90 p-6 flex flex-col items-center justify-center text-center space-y-3 z-30">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
                <AlertCircle className="w-6 h-6" />
              </div>
              <p className="text-xs text-slate-300 max-w-xs leading-relaxed">{cameraError}</p>
              <div className="flex flex-col gap-2 w-full max-w-xs pt-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <Camera className="w-4 h-4" />
                  <span>Buka Kamera HP Langsung</span>
                </button>
                <button
                  type="button"
                  onClick={() => startCamera(facingMode)}
                  className="w-full py-2 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Coba Akses Ulang</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Hidden Native Camera Input for Direct Mobile Capture */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleNativeCameraFile}
          className="hidden"
        />

        {/* Bottom Control Bar */}
        <div className="p-4 bg-slate-900 border-t border-slate-800 shrink-0">
          {capturedPhoto ? (
            /* Confirmation Actions */
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleRetake}
                className="flex-1 py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Foto Ulang</span>
              </button>
              <button
                type="button"
                onClick={handleConfirmPhoto}
                className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors shadow-lg shadow-emerald-900/30 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>Gunakan Foto Ini</span>
              </button>
            </div>
          ) : (
            /* Live Camera Controls */
            <div className="flex flex-col gap-2.5">
              <div className="flex items-center justify-between gap-3">
                {/* Secondary Option: Launch Native Phone Camera */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-semibold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Gunakan aplikasi kamera bawaan HP Anda"
                >
                  <ImageIcon className="w-3.5 h-3.5" />
                  <span>Kamera Bawaan HP</span>
                </button>

                {/* Primary Shutter Button */}
                <button
                  type="button"
                  onClick={handleTakeSnapshot}
                  disabled={!cameraActive}
                  className="w-14 h-14 rounded-full bg-white hover:bg-slate-200 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed border-4 border-indigo-500 shadow-xl flex items-center justify-center transition-all cursor-pointer mx-auto"
                  title="Jepret Foto Sampul"
                >
                  <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white">
                    <Camera className="w-5 h-5" />
                  </div>
                </button>

                {/* Spacer or Flip button */}
                <button
                  type="button"
                  onClick={switchCamera}
                  className="py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-semibold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Ganti Kamera Depan/Belakang"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Putar</span>
                </button>
              </div>

              <p className="text-center text-[11px] text-slate-400">
                Posisikan buku pada bingkai lalu tekan tombol jepret
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

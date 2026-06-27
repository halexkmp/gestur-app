import React, { useCallback, useEffect, useRef, useState } from 'react';
import { MapPin, Clock, History, AlertCircle, Camera } from 'lucide-react';
import { useJourney } from '../../hooks/useJourney';

export const EmployeeJourney: React.FC = () => {
  const { history, loading, error, fetchHistory, registerJourney } = useJourney();
  const [selfie, setSelfie] = useState<File | null>(null);
  const [selfieError, setSelfieError] = useState<string | null>(null);
  const [cameraLoading, setCameraLoading] = useState<boolean>(false);
  const [isCameraOpen, setIsCameraOpen] = useState<boolean>(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const stopCamera = useCallback((): void => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setIsCameraOpen(false);
  }, []);

  useEffect(() => () => stopCamera(), [stopCamera]);

  useEffect(() => {
    if (!isCameraOpen) return;

    const video = videoRef.current;
    const stream = streamRef.current;

    if (!video || !stream) return;

    video.srcObject = stream;

    const handleLoaded = async () => {
      try {
        await video.play();
      } catch (err) {
        console.error(err);
      }
    };

    video.onloadedmetadata = handleLoaded;

    return () => {
      video.onloadedmetadata = null;
    };
  }, [isCameraOpen]);

  const handleOpenCamera = async (): Promise<void> => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setSelfieError('Seu dispositivo não suporta câmera.');
      return;
    }

    stopCamera();
    setSelfieError(null);
    setSelfie(null);
    setCameraLoading(true);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      streamRef.current = stream;

      // Apenas abre o componente
      setIsCameraOpen(true);
    } catch (err) {
      setSelfieError(
          'Não foi possível acessar a câmera. Verifique as permissões.'
      );
      stopCamera();
    } finally {
      setCameraLoading(false);
    }
  };
  const handleCaptureSelfie = async (): Promise<void> => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || !canvas || video.videoWidth === 0 || video.videoHeight === 0) {
      setSelfieError('Unable to capture selfie. Please reopen the camera and try again.');
      return;
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const context = canvas.getContext('2d');

    if (!context) {
      setSelfieError('Unable to process selfie capture. Please try again.');
      return;
    }

    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob((value) => resolve(value), 'image/jpeg', 0.9);
    });

    if (!blob) {
      setSelfieError('Selfie capture failed. Please try again.');
      return;
    }

    setSelfie(new File([blob], `selfie-${Date.now()}.jpg`, { type: 'image/jpeg' }));
    setSelfieError(null);
    stopCamera();
  };

  const handleRegister = async (): Promise<void> => {
    if (!selfie) {
      setSelfieError('A selfie is required before registering your journey.');
      return;
    }

    setSelfieError(null);

    try {
      await registerJourney(selfie);
      setSelfie(null);
    } catch {
      // Error is handled by the hook and displayed in the UI
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
          <Clock className="text-blue-600" />
          Registro de Jornada
        </h2>
        
        {error && (
          <div className="mb-4 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 flex items-center gap-2">
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
        )}

        {selfieError && (
          <div className="mb-4 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 flex items-center gap-2">
            <AlertCircle size={20} />
            <span>{selfieError}</span>
          </div>
        )}

        <div className="mb-4 rounded-lg border border-dashed border-gray-300 p-4">
          <p className="mb-2 flex items-center gap-2 font-semibold text-gray-700">
            <Camera size={18} className="text-blue-600" />
            Selfie obrigatória
          </p>

          <button
            type="button"
            onClick={handleOpenCamera}
            disabled={loading || cameraLoading}
            className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300"
          >
            <Camera size={16} />
            {cameraLoading ? 'Abrindo câmera...' : selfie ? 'Tirar nova selfie' : 'Abrir câmera'}
          </button>

          {isCameraOpen && (
            <div className="mt-3 space-y-3">
              <video ref={videoRef} autoPlay muted playsInline className="w-full rounded-md border border-gray-300" />
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handleCaptureSelfie}
                  className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
                >
                  Capturar selfie
                </button>
                <button
                  type="button"
                  onClick={stopCamera}
                  className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}

          <canvas ref={canvasRef} className="hidden" />

          <p className="mt-2 text-sm text-gray-500">
            A selfie deve ser tirada pela câmera do dispositivo.
          </p>
          {selfie && <p className="mt-1 text-sm text-green-700">Selfie capturada com sucesso.</p>}
        </div>

        <button
          onClick={handleRegister}
          disabled={loading}
          className={`w-full py-4 rounded-lg font-bold text-lg flex items-center justify-center gap-2 transition-colors ${
            loading 
              ? 'bg-gray-300 cursor-not-allowed' 
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
        >
          {loading ? (
            <div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent" />
          ) : (
            <>
              <MapPin size={24} />
              Registrar Ponto Agora
            </>
          )}
        </button>
        <p className="mt-2 text-sm text-gray-500 text-center">
          Sua localização e horário serão capturados automaticamente.
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-4 bg-gray-50 border-b flex items-center gap-2">
          <History className="text-gray-600" />
          <h3 className="font-semibold text-gray-700">Histórico Recente</h3>
        </div>
        
        <div className="divide-y divide-gray-100 max-h-[400px] overflow-y-auto">
          {history.length === 0 && !loading ? (
            <div className="p-8 text-center text-gray-500">
              Nenhum registro encontrado.
            </div>
          ) : (
            history.map((record) => (
              <div key={record.id} className="p-4 flex justify-between items-center hover:bg-gray-50 transition-colors">
                <div className="flex flex-col">
                  <span className="font-medium text-gray-800">
                    {new Date(record.timestamp).toLocaleDateString('pt-BR')}
                  </span>
                  <span className="text-sm text-gray-500">
                    {new Date(record.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div className="flex flex-col items-end text-right">
                  <div className="flex items-center gap-1 text-xs text-blue-600">
                    <MapPin size={12} />
                    <span>Ver no Mapa</span>
                  </div>
                  <span className="text-[10px] text-gray-400">
                    {record.latitude.toFixed(6)}, {record.longitude.toFixed(6)}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

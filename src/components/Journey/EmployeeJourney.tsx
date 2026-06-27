import React, { useEffect, useState } from 'react';
import { MapPin, Clock, History, AlertCircle, Camera } from 'lucide-react';
import { useJourney } from '../../hooks/useJourney';

export const EmployeeJourney: React.FC = () => {
  const { history, loading, error, fetchHistory, registerJourney } = useJourney();
  const [selfie, setSelfie] = useState<File | null>(null);
  const [selfieError, setSelfieError] = useState<string | null>(null);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const handleSelfieChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
    const selectedFile = event.target.files?.[0] ?? null;

    if (!selectedFile) {
      setSelfie(null);
      return;
    }

    if (!selectedFile.type.startsWith('image/')) {
      setSelfie(null);
      setSelfieError('Please select a valid image file for your selfie.');
      return;
    }

    setSelfieError(null);
    setSelfie(selectedFile);
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
    } catch (err) {
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
          <label htmlFor="selfie" className="mb-2 flex items-center gap-2 font-semibold text-gray-700">
            <Camera size={18} className="text-blue-600" />
            Selfie obrigatória
          </label>
          <input
            id="selfie"
            type="file"
            accept="image/*"
            capture="user"
            disabled={loading}
            onChange={handleSelfieChange}
            className="w-full cursor-pointer rounded-md border border-gray-300 p-2 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-blue-50 file:px-3 file:py-2 file:font-medium file:text-blue-700"
          />
          <p className="mt-2 text-sm text-gray-500">
            Tire uma foto pela câmera (quando disponível) ou selecione uma imagem da galeria.
          </p>
          {selfie && <p className="mt-1 text-sm text-green-700">Arquivo selecionado: {selfie.name}</p>}
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

import { FormEvent, useRef, useState } from 'react';
import { AlertCircle, Loader2, Plus, Trash2 } from 'lucide-react';
import { useTirolesaSetup } from '../../hooks/useTirolesaSetup';
import { TirolesaDevice } from '../../types';
import DeviceKeyNotice from './DeviceKeyNotice';

interface SetupTabProps {
  setup: ReturnType<typeof useTirolesaSetup>;
}

const deviceStatus = (device: TirolesaDevice): { label: string; className: string } => {
  if (!device.active) return { label: 'Inativo', className: 'bg-gray-100 text-gray-600' };
  if (device.offline) return { label: 'Offline', className: 'bg-amber-100 text-amber-800' };
  return { label: 'Online', className: 'bg-green-100 text-green-800' };
};

const lastSeen = (device: TirolesaDevice): string =>
  device.last_seen_at
    ? `Visto em ${new Date(device.last_seen_at).toLocaleString('pt-BR')}`
    : 'Nunca visto';

export default function SetupTab({ setup }: SetupTabProps) {
  const [deviceName, setDeviceName] = useState('');
  const [newKey, setNewKey] = useState<string | null>(null);
  const [productId, setProductId] = useState('');
  const [unitsPerDescent, setUnitsPerDescent] = useState(1);
  const [actionError, setActionError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  // A ref, because a double click fires twice before state updates. A second
  // device must not replace a key that nobody has saved yet.
  const creatingRef = useRef(false);

  const run = async (action: () => Promise<void>) => {
    setActionError(null);
    try {
      await action();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Erro ao processar a solicitação');
    }
  };

  const handleCreateDevice = (event: FormEvent) => {
    event.preventDefault();
    const name = deviceName.trim();
    if (!name || newKey || creatingRef.current) return;
    creatingRef.current = true;
    setCreating(true);
    run(async () => {
      try {
        const device = await setup.createDevice(name);
        setNewKey(device.api_key);
        setDeviceName('');
      } finally {
        creatingRef.current = false;
        setCreating(false);
      }
    });
  };

  const handleToggleDevice = (device: TirolesaDevice) => {
    if (device.active && !window.confirm(`Deseja desativar o dispositivo ${device.name}? Ele deixará de enviar descidas.`)) {
      return;
    }
    run(() => setup.setDeviceActive(device.id, !device.active));
  };

  const handleLinkProduct = (event: FormEvent) => {
    event.preventDefault();
    if (!productId || !Number.isInteger(unitsPerDescent) || unitsPerDescent < 1) return;
    run(async () => {
      await setup.linkProduct(productId, unitsPerDescent);
      setProductId('');
      setUnitsPerDescent(1);
    });
  };

  const handleUnlinkProduct = (id: string, name: string) => {
    if (!window.confirm(`Deseja remover ${name} da auditoria? Isso altera os resultados dos dias anteriores.`)) return;
    run(() => setup.unlinkProduct(id));
  };

  if (!setup.loaded && setup.loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-12 text-gray-500">
        <Loader2 className="w-5 h-5 animate-spin text-blue-600" /> Carregando configuração...
      </div>
    );
  }

  if (!setup.loaded) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6 text-center space-y-3">
        <p className="text-red-600">{setup.error}</p>
        <button onClick={setup.reload} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium">
          Tentar novamente
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {actionError && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" /> {actionError}
        </div>
      )}

      {setup.error && (
        <div className="flex items-center justify-between gap-3 bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm">
          <span className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" /> {setup.error}
          </span>
          <button onClick={setup.reload} className="font-medium underline shrink-0">
            Tentar novamente
          </button>
        </div>
      )}

      {newKey && <DeviceKeyNotice apiKey={newKey} onDismiss={() => setNewKey(null)} />}

      <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 space-y-4">
        <h2 className="text-lg font-semibold text-gray-800">Dispositivos</h2>
        <form onSubmit={handleCreateDevice} className="flex flex-col sm:flex-row gap-2">
          <input
            value={deviceName}
            onChange={(event) => setDeviceName(event.target.value)}
            placeholder="Nome do dispositivo"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
          />
          <button
            type="submit"
            disabled={!deviceName.trim() || creating || newKey !== null}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium disabled:opacity-50"
          >
            <Plus className="w-4 h-4" /> Novo dispositivo
          </button>
        </form>
        {setup.devices.length === 0 ? (
          <p className="text-sm text-gray-500">Nenhum dispositivo cadastrado.</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {setup.devices.map((device) => {
              const status = deviceStatus(device);
              return (
                <li key={device.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 py-3">
                  <div>
                    <p className="font-medium text-gray-800">{device.name}</p>
                    <p className="text-xs text-gray-500">{lastSeen(device)}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${status.className}`}>{status.label}</span>
                    <button onClick={() => handleToggleDevice(device)} className="text-sm text-blue-600 hover:text-blue-800">
                      {device.active ? 'Desativar' : 'Reativar'}
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
        <p className="text-xs text-gray-500">Para trocar uma chave, desative o dispositivo e crie um novo.</p>
      </section>

      <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 space-y-4">
        <h2 className="text-lg font-semibold text-gray-800">Produtos da tirolesa</h2>
        <form onSubmit={handleLinkProduct} className="grid gap-2 sm:grid-cols-[1fr_auto_auto] sm:items-end">
          <label className="text-sm text-gray-600">
            Produto
            <select
              value={productId}
              onChange={(event) => setProductId(event.target.value)}
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
            >
              <option value="">Selecione</option>
              {setup.products.map((product) => (
                <option key={product.id} value={product.id}>{product.name}</option>
              ))}
            </select>
          </label>
          <label className="text-sm text-gray-600">
            Unidades por descida
            <input
              type="number"
              min={1}
              step={1}
              value={unitsPerDescent}
              onChange={(event) => setUnitsPerDescent(Number(event.target.value))}
              className="block mt-1 w-full sm:w-28 px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
          </label>
          <button
            type="submit"
            disabled={!productId}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium disabled:opacity-50"
          >
            <Plus className="w-4 h-4" /> Vincular
          </button>
        </form>
        <p className="text-xs text-gray-500">Use 1 para solo e tandem vendidos como uma descida.</p>
        {setup.links.length === 0 ? (
          <p className="text-sm text-gray-500">Nenhum produto vinculado.</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {setup.links.map((link) => (
              <li key={link.id} className="flex items-center justify-between gap-2 py-3">
                <div>
                  <p className="font-medium text-gray-800">{link.product_name}</p>
                  <p className="text-xs text-gray-500">{link.units_per_descent} por descida</p>
                </div>
                <button
                  onClick={() => handleUnlinkProduct(link.id, link.product_name)}
                  aria-label={`Remover ${link.product_name}`}
                  className="text-gray-400 hover:text-red-600"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

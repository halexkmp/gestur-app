import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';
import SetupTab from './SetupTab';
import { useTirolesaSetup } from '../../hooks/useTirolesaSetup';

type Setup = ReturnType<typeof useTirolesaSetup>;

const setup = (overrides: Partial<Setup> = {}): Setup => ({
  devices: [],
  links: [],
  products: [],
  loading: false,
  loaded: true,
  error: null,
  setupPending: false,
  hasActiveDevice: true,
  reload: vi.fn(),
  createDevice: vi.fn(),
  setDeviceActive: vi.fn(),
  linkProduct: vi.fn(),
  unlinkProduct: vi.fn(),
  ...overrides,
});

const created = (apiKey: string) => ({
  id: apiKey,
  name: 'Chegada',
  active: true,
  created_at: '2026-11-05',
  api_key: apiKey,
});

const fillName = () =>
  fireEvent.change(screen.getByPlaceholderText('Nome do dispositivo'), { target: { value: 'Chegada' } });

describe('SetupTab', () => {
  it('a double click creates one device', async () => {
    const createDevice = vi.fn().mockResolvedValue(created('key-1'));
    render(<SetupTab setup={setup({ createDevice })} />);
    fillName();

    const button = screen.getByRole('button', { name: /Novo dispositivo/ });
    fireEvent.click(button);
    fireEvent.click(button);

    await screen.findByText('key-1');
    expect(createDevice).toHaveBeenCalledTimes(1);
  });

  it('blocks a new device while a key is unsaved', async () => {
    const createDevice = vi.fn().mockResolvedValue(created('key-1'));
    render(<SetupTab setup={setup({ createDevice })} />);
    fillName();
    fireEvent.click(screen.getByRole('button', { name: /Novo dispositivo/ }));
    await screen.findByText('key-1');

    fillName();

    expect(screen.getByRole('button', { name: /Novo dispositivo/ })).toBeDisabled();
  });

  it('shows a failed reload after the first load, with a retry', () => {
    const reload = vi.fn();
    render(<SetupTab setup={setup({ error: 'falhou', reload })} />);

    expect(screen.getByText('falhou')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }));
    expect(reload).toHaveBeenCalled();
  });

  it('allows a new device again after the key is dismissed', async () => {
    const createDevice = vi.fn().mockResolvedValue(created('key-1'));
    render(<SetupTab setup={setup({ createDevice })} />);
    fillName();
    fireEvent.click(screen.getByRole('button', { name: /Novo dispositivo/ }));
    await screen.findByText('key-1');

    fireEvent.click(screen.getByRole('button', { name: 'Fechar' }));
    fillName();

    await waitFor(() =>
      expect(screen.getByRole('button', { name: /Novo dispositivo/ })).toBeEnabled(),
    );
  });
});

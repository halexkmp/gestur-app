import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { EmployeeJourney } from './EmployeeJourney';
import { useJourney } from '../../hooks/useJourney';
import { vi, describe, it, expect, beforeEach } from 'vitest';

vi.mock('../../hooks/useJourney');

describe('EmployeeJourney', () => {
  const mockFetchHistory = vi.fn();
  const mockRegisterJourney = vi.fn();

  beforeEach(() => {
    mockFetchHistory.mockClear();
    mockRegisterJourney.mockClear();

    vi.mocked(useJourney).mockReturnValue({
      history: [],
      loading: false,
      error: null,
      fetchHistory: mockFetchHistory,
      registerJourney: mockRegisterJourney,
      fetchAdminHistory: vi.fn(),
      updateJourney: vi.fn(),
      deleteJourney: vi.fn(),
    });
  });

  it('renders correctly and fetches history on mount', async () => {
    render(<EmployeeJourney />);
    expect(screen.getByText('Registro de Jornada')).toBeInTheDocument();
    await waitFor(() => expect(mockFetchHistory).toHaveBeenCalled());
  });

  it('calls registerJourney when button is clicked', async () => {
    const selfie = new File(['mock-selfie'], 'selfie.jpg', { type: 'image/jpeg' });

    render(<EmployeeJourney />);

    const input = screen.getByLabelText('Selfie obrigatória');
    fireEvent.change(input, { target: { files: [selfie] } });

    const button = screen.getByText('Registrar Ponto Agora');
    fireEvent.click(button);
    await waitFor(() => expect(mockRegisterJourney).toHaveBeenCalledWith(selfie));
  });

  it('blocks submission and shows validation when selfie is missing', async () => {
    render(<EmployeeJourney />);

    const button = screen.getByText('Registrar Ponto Agora');
    fireEvent.click(button);

    expect(mockRegisterJourney).not.toHaveBeenCalled();
    expect(screen.getByText('A selfie is required before registering your journey.')).toBeInTheDocument();
  });

  it('shows loading state on button', () => {
    vi.mocked(useJourney).mockReturnValue({
      history: [],
      loading: true,
      error: null,
      fetchHistory: mockFetchHistory,
      registerJourney: mockRegisterJourney,
      fetchAdminHistory: vi.fn(),
      updateJourney: vi.fn(),
      deleteJourney: vi.fn(),
    });

    render(<EmployeeJourney />);
    expect(screen.queryByText('Registrar Ponto Agora')).not.toBeInTheDocument();
  });

  it('displays history records', () => {
    const mockHistory = [
      { id: '1', user_id: 'u1', timestamp: '2024-01-01T10:00:00Z', latitude: 10, longitude: 20 },
    ];
    vi.mocked(useJourney).mockReturnValue({
      history: mockHistory,
      loading: false,
      error: null,
      fetchHistory: mockFetchHistory,
      registerJourney: mockRegisterJourney,
      fetchAdminHistory: vi.fn(),
      updateJourney: vi.fn(),
      deleteJourney: vi.fn(),
    });

    render(<EmployeeJourney />);
    expect(screen.getByText('01/01/2024')).toBeInTheDocument();
    expect(screen.getByText('10.000000, 20.000000')).toBeInTheDocument();
  });

  it('displays error message when error exists', () => {
    vi.mocked(useJourney).mockReturnValue({
      history: [],
      loading: false,
      error: 'Failed to get location',
      fetchHistory: mockFetchHistory,
      registerJourney: mockRegisterJourney,
      fetchAdminHistory: vi.fn(),
      updateJourney: vi.fn(),
      deleteJourney: vi.fn(),
    });

    render(<EmployeeJourney />);
    expect(screen.getByText('Failed to get location')).toBeInTheDocument();
  });
});

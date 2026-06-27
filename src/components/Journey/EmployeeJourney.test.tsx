import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { EmployeeJourney } from './EmployeeJourney';
import { useJourney } from '../../hooks/useJourney';
import { vi, describe, it, expect, beforeEach } from 'vitest';

vi.mock('../../hooks/useJourney');

describe('EmployeeJourney', () => {
  const mockFetchHistory = vi.fn();
  const mockRegisterJourney = vi.fn();
  const mockGetUserMedia = vi.fn();
  const mockTrackStop = vi.fn();

  beforeEach(() => {
    mockFetchHistory.mockClear();
    mockRegisterJourney.mockClear();
    mockGetUserMedia.mockClear();
    mockTrackStop.mockClear();

    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: { getUserMedia: mockGetUserMedia },
    });

    vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue();
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
      drawImage: vi.fn(),
    } as unknown as CanvasRenderingContext2D);
    vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation((callback) => {
      callback(new Blob(['mock-selfie'], { type: 'image/jpeg' }));
    });

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

    mockGetUserMedia.mockResolvedValue({
      getTracks: () => [{ stop: mockTrackStop }],
    });
  });

  it('renders correctly and fetches history on mount', async () => {
    render(<EmployeeJourney />);
    expect(screen.getByText('Registro de Jornada')).toBeInTheDocument();
    await waitFor(() => expect(mockFetchHistory).toHaveBeenCalled());
  });

  it('opens camera, captures selfie, and calls registerJourney when submit is clicked', async () => {
    render(<EmployeeJourney />);

    fireEvent.click(screen.getByRole('button', { name: 'Abrir câmera' }));

    await waitFor(() => expect(mockGetUserMedia).toHaveBeenCalledWith({
      video: { facingMode: 'user' },
      audio: false,
    }));

    const video = await screen.findByRole('video');
    Object.defineProperty(video, 'videoWidth', { configurable: true, value: 640 });
    Object.defineProperty(video, 'videoHeight', { configurable: true, value: 480 });

    fireEvent.click(screen.getByRole('button', { name: 'Capturar selfie' }));

    await waitFor(() => expect(screen.getByText('Selfie capturada com sucesso.')).toBeInTheDocument());

    const button = screen.getByText('Registrar Ponto Agora');
    fireEvent.click(button);

    await waitFor(() => expect(mockRegisterJourney).toHaveBeenCalledWith(expect.any(File)));
  });

  it('blocks submission and shows validation when selfie is missing', async () => {
    render(<EmployeeJourney />);

    const button = screen.getByText('Registrar Ponto Agora');
    fireEvent.click(button);

    expect(mockRegisterJourney).not.toHaveBeenCalled();
    expect(screen.getByText('A selfie is required before registering your journey.')).toBeInTheDocument();
  });

  it('shows camera permission error when access is denied', async () => {
    mockGetUserMedia.mockRejectedValueOnce(new Error('denied'));

    render(<EmployeeJourney />);

    fireEvent.click(screen.getByRole('button', { name: 'Abrir câmera' }));

    await waitFor(() =>
      expect(
        screen.getByText('Camera access was denied. Please allow camera permission to continue.')
      ).toBeInTheDocument()
    );
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

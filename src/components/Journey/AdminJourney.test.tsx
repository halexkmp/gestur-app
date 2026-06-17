import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AdminJourney } from './AdminJourney';
import { useJourney } from '../../hooks/useJourney';
import { userService } from '../../services/userService';
import { vi, describe, it, expect, beforeEach } from 'vitest';

vi.mock('../../hooks/useJourney');
vi.mock('../../services/userService');

describe('AdminJourney', () => {
  const mockFetchAdminHistory = vi.fn();
  const mockUpdateJourney = vi.fn();
  const mockDeleteJourney = vi.fn();
  const mockUsers = [
    { id: 'u1', name: 'John Doe', username: 'john', active: true, roles: [], created_at: '' },
  ];

  beforeEach(() => {
    vi.mocked(useJourney).mockReturnValue({
      history: [],
      loading: false,
      error: null,
      fetchHistory: vi.fn(),
      registerJourney: vi.fn(),
      fetchAdminHistory: mockFetchAdminHistory,
      updateJourney: mockUpdateJourney,
      deleteJourney: mockDeleteJourney,
    });
    vi.mocked(userService.getAll).mockResolvedValue(mockUsers);
    vi.stubGlobal('confirm', vi.fn().mockReturnValue(true));
  });

  it('renders correctly and loads data on mount', async () => {
    render(<AdminJourney />);
    expect(screen.getByText('Gerenciar Jornadas')).toBeInTheDocument();
    await waitFor(() => expect(userService.getAll).toHaveBeenCalled());
    expect(mockFetchAdminHistory).toHaveBeenCalled();
  });

  it('filters results when clicking filter button', async () => {
    render(<AdminJourney />);
    const button = screen.getByText('Filtrar');
    fireEvent.click(button);
    // On mount (useEffect) + handleSearch (called in useEffect) + button click = 3
    expect(mockFetchAdminHistory).toHaveBeenCalledTimes(3); 
  });

  it('opens edit modal and saves changes', async () => {
    const record = { id: 'j1', user_id: 'u1', timestamp: '2024-01-01T10:00:00', latitude: 10, longitude: 20 };
    vi.mocked(useJourney).mockReturnValue({
      history: [record],
      loading: false,
      error: null,
      fetchHistory: vi.fn(),
      registerJourney: vi.fn(),
      fetchAdminHistory: mockFetchAdminHistory,
      updateJourney: mockUpdateJourney,
      deleteJourney: mockDeleteJourney,
    });

    render(<AdminJourney />);
    
    await waitFor(() => expect(screen.getAllByText('John Doe').length).toBeGreaterThan(0));
    
    const editButton = screen.getByTestId('edit-j1');
    fireEvent.click(editButton);

    expect(screen.getByText('Editar Registro')).toBeInTheDocument();

    const reasonInput = screen.getByPlaceholderText('Explique o porquê desta alteração...');
    fireEvent.change(reasonInput, { target: { value: 'Typo' } });

    const saveButton = screen.getByText('Salvar');
    fireEvent.click(saveButton);

    await waitFor(() => expect(mockUpdateJourney).toHaveBeenCalled());
  });

  it('calls deleteJourney on delete button click', async () => {
    const record = { id: 'j1', user_id: 'u1', timestamp: '2024-01-01T10:00:00', latitude: 10, longitude: 20 };
    vi.mocked(useJourney).mockReturnValue({
      history: [record],
      loading: false,
      error: null,
      fetchHistory: vi.fn(),
      registerJourney: vi.fn(),
      fetchAdminHistory: mockFetchAdminHistory,
      updateJourney: mockUpdateJourney,
      deleteJourney: mockDeleteJourney,
    });

    render(<AdminJourney />);
    
    await waitFor(() => expect(screen.getAllByText('John Doe').length).toBeGreaterThan(0));
    
    const deleteButton = screen.getByTestId('delete-j1');
    fireEvent.click(deleteButton);

    expect(window.confirm).toHaveBeenCalled();
    expect(mockDeleteJourney).toHaveBeenCalledWith('j1');
  });
});

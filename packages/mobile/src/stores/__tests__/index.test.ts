import AsyncStorage from '@react-native-async-storage/async-storage';

jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(),
  getItem: jest.fn().mockResolvedValue(null),
  removeItem: jest.fn(),
}));

import { useAuthStore, useSearchStore, useSessionStore } from '../index';

describe('useAuthStore', () => {
  beforeEach(() => {
    useAuthStore.setState({ isAuthenticated: false, user: null, token: null });
    jest.clearAllMocks();
  });

  it('starts unauthenticated', () => {
    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(false);
    expect(state.user).toBeNull();
    expect(state.token).toBeNull();
  });

  it('setAuth authenticates the user', () => {
    useAuthStore.getState().setAuth(
      { id: 'u-1', email: 'test@example.com', name: 'Test', role: 'seeker' },
      'jwt-token'
    );

    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(true);
    expect(state.user?.email).toBe('test@example.com');
    expect(state.token).toBe('jwt-token');
  });

  it('logout clears authentication', () => {
    useAuthStore.getState().setAuth(
      { id: 'u-1', email: 'test@example.com', name: 'Test', role: 'consultant' },
      'jwt-token'
    );
    useAuthStore.getState().logout();

    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(false);
    expect(state.user).toBeNull();
    expect(state.token).toBeNull();
  });

  it('updateUser merges partial updates', () => {
    useAuthStore.getState().setAuth(
      { id: 'u-1', email: 'test@example.com', name: 'Test', role: 'seeker' },
      'jwt-token'
    );
    useAuthStore.getState().updateUser({ firstName: 'Jane', phone: '+1234567890' });

    const { user } = useAuthStore.getState();
    expect(user?.firstName).toBe('Jane');
    expect(user?.phone).toBe('+1234567890');
    expect(user?.email).toBe('test@example.com');
  });

  it('updateUser is a no-op when no user is set', () => {
    useAuthStore.getState().updateUser({ firstName: 'Jane' });
    expect(useAuthStore.getState().user).toBeNull();
  });

  it('persists state through AsyncStorage', () => {
    useAuthStore.getState().setAuth(
      { id: 'u-1', email: 'test@example.com', name: 'Test', role: 'seeker' },
      'jwt-token'
    );

    expect(AsyncStorage.setItem).toHaveBeenCalled();
    const calls = (AsyncStorage.setItem as jest.Mock).mock.calls;
    expect(calls.some((c) => c[0] === 'auth-storage')).toBe(true);
  });
});

describe('useSessionStore', () => {
  beforeEach(() => {
    useSessionStore.getState().clearSession();
  });

  it('starts disconnected', () => {
    const state = useSessionStore.getState();
    expect(state.activeSessionId).toBeNull();
    expect(state.isConnected).toBe(false);
    expect(state.isMuted).toBe(false);
    expect(state.isVideoOff).toBe(false);
  });

  it('setActiveSession marks connecting', () => {
    useSessionStore.getState().setActiveSession('s-1');

    const state = useSessionStore.getState();
    expect(state.activeSessionId).toBe('s-1');
    expect(state.isConnecting).toBe(true);
  });

  it('setConnectionStatus updates flags', () => {
    useSessionStore.getState().setConnectionStatus({ isConnecting: false, isConnected: true });
    const state = useSessionStore.getState();
    expect(state.isConnecting).toBe(false);
    expect(state.isConnected).toBe(true);
  });

  it('toggleMute flips the muted flag', () => {
    expect(useSessionStore.getState().isMuted).toBe(false);
    useSessionStore.getState().toggleMute();
    expect(useSessionStore.getState().isMuted).toBe(true);
    useSessionStore.getState().toggleMute();
    expect(useSessionStore.getState().isMuted).toBe(false);
  });

  it('toggleVideo flips the video flag', () => {
    expect(useSessionStore.getState().isVideoOff).toBe(false);
    useSessionStore.getState().toggleVideo();
    expect(useSessionStore.getState().isVideoOff).toBe(true);
  });

  it('setStreams stores local and remote streams', () => {
    useSessionStore.getState().setStreams('local', 'remote');
    const state = useSessionStore.getState();
    expect(state.localStream).toBe('local');
    expect(state.remoteStream).toBe('remote');
  });

  it('clearSession resets session state', () => {
    useSessionStore.getState().setActiveSession('s-1');
    useSessionStore.getState().setStreams('local', 'remote');
    useSessionStore.getState().clearSession();

    const state = useSessionStore.getState();
    expect(state.activeSessionId).toBeNull();
    expect(state.localStream).toBeNull();
    expect(state.remoteStream).toBeNull();
  });
});

describe('useSearchStore', () => {
  beforeEach(() => {
    useSearchStore.getState().reset();
  });

  it('starts empty', () => {
    const state = useSearchStore.getState();
    expect(state.query).toBe('');
    expect(state.results).toEqual([]);
    expect(state.isLoading).toBe(false);
  });

  it('setQuery updates the query', () => {
    useSearchStore.getState().setQuery('react');
    expect(useSearchStore.getState().query).toBe('react');
  });

  it('setFilters replaces filters', () => {
    useSearchStore.getState().setFilters({ vertical: 'tech', minRating: 4.5 });
    expect(useSearchStore.getState().filters).toEqual({ vertical: 'tech', minRating: 4.5 });
  });

  it('setResults stores results', () => {
    useSearchStore.getState().setResults([{ id: '1' }]);
    expect(useSearchStore.getState().results).toEqual([{ id: '1' }]);
  });

  it('setLoading toggles loading', () => {
    useSearchStore.getState().setLoading(true);
    expect(useSearchStore.getState().isLoading).toBe(true);
  });

  it('reset clears query, filters and results', () => {
    useSearchStore.getState().setQuery('react');
    useSearchStore.getState().setFilters({ vertical: 'tech' });
    useSearchStore.getState().setResults([{ id: '1' }]);
    useSearchStore.getState().reset();

    const state = useSearchStore.getState();
    expect(state.query).toBe('');
    expect(state.filters).toEqual({});
    expect(state.results).toEqual([]);
  });
});

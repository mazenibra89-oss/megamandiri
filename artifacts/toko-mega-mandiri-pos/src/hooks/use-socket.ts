import { useEffect } from 'react';
import { io } from 'socket.io-client';
import { useQueryClient } from '@tanstack/react-query';

const fallbackHost = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
const SOCKET_URL = import.meta.env.VITE_API_URL || `http://${fallbackHost}:5001`;

export const socket = io(SOCKET_URL, {
  autoConnect: false, // We'll connect manually in the hook
});

export function useSocketSync() {
  const qc = useQueryClient();

  useEffect(() => {
    socket.connect();

    socket.on('data-updated', (data: { entity: string }) => {
      console.log('Real-time update received for entity:', data.entity);
      // Invalidate the cache for the updated entity so React Query re-fetches it
      qc.invalidateQueries({ queryKey: [data.entity] });
    });

    return () => {
      socket.off('data-updated');
      socket.disconnect();
    };
  }, [qc]);
}

import { useContext } from 'react';
import { SocketContext } from '../socket/socket-context';

export function useSocket() {
  const ctx = useContext(SocketContext);

  if (!ctx) {
    throw new Error('useSocket must be used inside SocketProvider');
  }

  return ctx;
}

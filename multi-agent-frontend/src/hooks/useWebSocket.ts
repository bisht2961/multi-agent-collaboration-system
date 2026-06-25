
'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { WebSocketMessage } from '../types';

interface UseWebSocketOptions {
  onMessage?: (message: WebSocketMessage) => void;
  onError?: (error: Error) => void;
  onOpen?: () => void;
  onClose?: () => void;
}

export function useWebSocket(
  url: string,
  options: UseWebSocketOptions = {}
) {
  const [isConnected, setIsConnected] = useState(false);
  const ws = useRef<WebSocket | null>(null);
  // Keep options in a ref so callbacks never go stale without causing reconnects
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const buildWsUrl = useCallback(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    if (url.startsWith('ws://') || url.startsWith('wss://')) return url;
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url.replace(/^https?:/, protocol === 'wss:' ? 'wss:' : 'ws:');
    }
    return `${protocol}//${window.location.host}${url}`;
  }, [url]);

  const connect = useCallback(() => {
    const readyState = ws.current?.readyState;
    if (readyState === WebSocket.OPEN || readyState === WebSocket.CONNECTING) return;

    try {
      ws.current = new WebSocket(buildWsUrl());

      ws.current.onopen = () => {
        setIsConnected(true);
        optionsRef.current.onOpen?.();
      };

      ws.current.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          optionsRef.current.onMessage?.(message);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      ws.current.onerror = (event) => {
        const error = new Error('WebSocket connection error');
        console.error('WebSocket error:', event, error);
        optionsRef.current.onError?.(error);
      };

      ws.current.onclose = () => {
        setIsConnected(false);
        optionsRef.current.onClose?.();
      };
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Failed to connect to WebSocket');
      console.error('WebSocket connection failed:', err);
      optionsRef.current.onError?.(err);
    }
  }, [buildWsUrl]);

  const disconnect = useCallback(() => {
    ws.current?.close();
    ws.current = null;
  }, []);

  const send = useCallback((message: unknown) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(message));
    }
  }, []);

  // Connect on mount and close on unmount
  useEffect(() => {
    connect();
    return () => { ws.current?.close(); };
  }, [connect]);

  return { isConnected, send, connect, disconnect };
}

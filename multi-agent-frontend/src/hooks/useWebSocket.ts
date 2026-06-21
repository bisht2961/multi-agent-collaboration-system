
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

  useEffect(() => {
    // Construct WebSocket URL. Accept full ws/wss/http(s) URLs or relative paths.
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    let wsUrl: string;

    if (url.startsWith('ws://') || url.startsWith('wss://')) {
      wsUrl = url; // already a websocket URL
    } else if (url.startsWith('http://') || url.startsWith('https://')) {
      // convert http(s) to ws(s)
      wsUrl = url.replace(/^https?:/, protocol === 'wss:' ? 'wss:' : 'ws:');
    } else {
      // relative path, build from current host
      wsUrl = `${protocol}//${window.location.host}${url}`;
    }

    const connect = () => {
      try {
        ws.current = new WebSocket(wsUrl);

        ws.current.onopen = () => {
          setIsConnected(true);
          options.onOpen?.();
        };

        ws.current.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);
            options.onMessage?.(message);
          } catch (error) {
            console.error('Failed to parse WebSocket message:', error);
          }
        };

        ws.current.onerror = (error) => {
          const err = new Error('WebSocket error');
          options.onError?.(err);
        };

        ws.current.onclose = () => {
          setIsConnected(false);
          options.onClose?.();
        };
      } catch (error) {
        options.onError?.(new Error('Failed to connect'));
      }
    };

    connect();

    return () => {
      if (ws.current) {
        ws.current.close();
      }
    };
  }, [url, options]);

  const send = useCallback((message: any) => {
    if (ws.current && isConnected) {
      ws.current.send(JSON.stringify(message));
    }
  }, [isConnected]);

  return { isConnected, send, ws: ws.current };
}
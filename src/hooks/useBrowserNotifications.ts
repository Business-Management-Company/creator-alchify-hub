import { useState, useEffect, useCallback } from 'react';

export function useBrowserNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    if ('Notification' in window) {
      setIsSupported(true);
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = useCallback(async () => {
    if (!isSupported) return false;
    
    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      return result === 'granted';
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }, [isSupported]);

  const sendNotification = useCallback((title: string, options?: NotificationOptions) => {
    if (!isSupported || permission !== 'granted') return null;
    
    try {
      const notification = new Notification(title, {
        icon: '/favicon.png',
        ...options,
      });
      
      notification.onclick = () => {
        window.focus();
        notification.close();
      };
      
      return notification;
    } catch (error) {
      console.error('Error sending notification:', error);
      return null;
    }
  }, [isSupported, permission]);

  return {
    isSupported,
    permission,
    requestPermission,
    sendNotification,
    isGranted: permission === 'granted',
    isDenied: permission === 'denied',
  };
}

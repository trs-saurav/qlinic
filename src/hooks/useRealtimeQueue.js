'use client';
import { useEffect, useState } from 'react';
import { ref, onValue, off } from 'firebase/database';
import { realtimeDb } from '@/config/firebase';

export function useRealtimeQueue(doctorId, hospitalId) {
  const [queueData, setQueueData] = useState({
    currentToken: 0,
    isLive: false,
    status: 'LOADING', // Start with loading
    statusMessage: '',
    lastUpdated: null,
    isLoading: true,
    error: null
  });

  useEffect(() => {
    if (!doctorId || !hospitalId) {
      setQueueData(prev => ({ 
        ...prev, 
        isLoading: false,
        status: 'OFFLINE', // No IDs = Offline
        error: 'Missing doctor or hospital ID'
      }));
      return;
    }

    const queueRef = ref(realtimeDb, `queues/${hospitalId}/${doctorId}`);

    const unsubscribe = onValue(
      queueRef,
      (snapshot) => {
        const data = snapshot.val();
        
        if (data) {
          setQueueData({
            currentToken: data.currentToken || 0,
            isLive: data.isLive !== undefined ? data.isLive : false,
            status: data.status || 'OPD',
            statusMessage: data.statusMessage || '',
            lastUpdated: data.lastUpdated || null,
            isLoading: false,
            error: null
          });
        } else {
          // ✅ Queue doesn't exist -> 'NOT_STARTED' triggers auto-init in dashboard
          setQueueData({
            currentToken: 0,
            isLive: false,
            status: 'NOT_STARTED',
            statusMessage: 'Queue not initialized',
            lastUpdated: null,
            isLoading: false,
            error: null
          });
        }
      },
      (error) => {
        console.error('Firebase read error:', error);
        setQueueData(prev => ({
          ...prev,
          isLoading: false,
          error: error.message || 'Failed to connect to queue'
        }));
      }
    );

    return () => off(queueRef);
  }, [doctorId, hospitalId]);

  return queueData;
}

export default useRealtimeQueue;

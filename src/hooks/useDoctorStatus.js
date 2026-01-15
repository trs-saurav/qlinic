'use client';
import { useState } from 'react';

/**
 * Hook to manage doctor status changes (OPD, REST, MEETING, EMERGENCY)
 * @param {string} hospitalId - Current hospital ID
 * @param {string} doctorId - Current doctor ID (optional for doctors, required for receptionists)
 * @returns {object} { status, isUpdating, updateStatus, error }
 */
export function useDoctorStatus(hospitalId, doctorId = null) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState(null);
  const [currentStatus, setCurrentStatus] = useState('OPD');

  /**
   * Update doctor status
   * @param {string} statusType - 'OPD', 'REST', 'MEETING', 'EMERGENCY'
   * @param {string} statusMessage - Optional message (e.g., "Lunch Break")
   */
  const updateStatus = async (statusType, statusMessage = '') => {
    setIsUpdating(true);
    setError(null);

    try {
      const response = await fetch('/api/appointment/queue-action', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'SET_STATUS',
          statusType,
          statusMessage,
          hospitalId,
          doctorId // Will be used if receptionist is setting for a specific doctor
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update status');
      }

      setCurrentStatus(statusType);
      return { success: true, status: statusType };

    } catch (err) {
      console.error('Status update error:', err);
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setIsUpdating(false);
    }
  };

  /**
   * Quick preset actions
   */
  const goOnBreak = (message = 'Short Break') => updateStatus('REST', message);
  const startOPD = () => updateStatus('OPD', '');
  const handleEmergency = (message = 'Emergency Case') => updateStatus('EMERGENCY', message);
  const startMeeting = (message = 'In Meeting') => updateStatus('MEETING', message);

  return {
    currentStatus,
    isUpdating,
    error,
    updateStatus,
    // Convenience methods
    goOnBreak,
    startOPD,
    handleEmergency,
    startMeeting
  };
}

export default useDoctorStatus;

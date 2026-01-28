import { useEffect, useState } from 'react'
import { ref, onValue, off } from 'firebase/database'
import { realtimeDb } from '@/config/firebase' // Ensure this matches your config file path

export const useHospitalQueue = (hospitalId) => {
  const [queueData, setQueueData] = useState({}) // { doctorId: { currentToken, status, isLive } }
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!hospitalId) return

    // Listen to the entire hospital node
    const queueRef = ref(realtimeDb, `queues/${hospitalId}`)

    const unsubscribe = onValue(queueRef, (snapshot) => {
      const data = snapshot.val() || {}
      setQueueData(data)
      setLoading(false)
    })

    return () => off(queueRef)
  }, [hospitalId])

  return { queueData, loading }
}

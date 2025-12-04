// src/hooks/useCreateUser.js
'use client'
import { useUser } from '@clerk/nextjs';
import { useEffect, useState } from 'react';

export function useCreateUser(role) {
  const { user, isLoaded } = useUser();
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function createUser() {
      if (isLoaded && user && role && !isCreating) {
        setIsCreating(true);
        try {
          const response = await fetch('/api/user/create', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ role }),
          });

          const data = await response.json();
          
          if (data.success) {
            console.log('✅ User created in MongoDB');
          } else {
            console.error('❌ Failed to create user:', data.error);
            setError(data.error);
          }
        } catch (error) {
          console.error('❌ Error:', error);
          setError(error.message);
        } finally {
          setIsCreating(false);
        }
      }
    }

    createUser();
  }, [isLoaded, user, role, isCreating]);

  return { isCreating, error };
}

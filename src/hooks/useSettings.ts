import { useState, useEffect } from 'react'
import { getSettings, updateSettings } from '@/lib/db'
import type { Settings, UpdateSettings } from '@/lib/db/types'
import { useAuth } from '@/hooks/useAuth'

export const useSettings = () => {
  const [settings, setSettings] = useState<Settings | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()

  const fetchSettings = async () => {
    if (!user) return

    try {
      setLoading(true)
      setError(null)
      const data = await getSettings()
      setSettings(data)
    } catch (err: any) {
      console.error('Error fetching settings:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const updateUserSettings = async (updates: UpdateSettings) => {
    try {
      const updated = await updateSettings(updates)
      setSettings(updated)
      return updated
    } catch (err: any) {
      console.error('Error updating settings:', err)
      throw err
    }
  }

  useEffect(() => {
    fetchSettings()
  }, [user])

  return {
    settings,
    loading,
    error,
    updateSettings: updateUserSettings,
    refetch: fetchSettings
  }
}
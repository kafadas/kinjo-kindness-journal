import { useState } from 'react'
import { useSaveQuickMoment } from '@/lib/saveQuickMoment'

interface CaptureData {
  text: string
  seedPersonId?: string
  seedCategoryId?: string
}

export const useCapture = () => {
  const [loading, setLoading] = useState(false)
  const { saveQuickMoment } = useSaveQuickMoment()

  const capture = async ({ text, seedPersonId, seedCategoryId }: CaptureData) => {
    setLoading(true)
    
    try {
      const result = await saveQuickMoment({
        text,
        seedPersonId,
        seedCategoryId
      })

      return result
    } catch (error: any) {
      // Error handling is done in saveQuickMoment
      throw error
    } finally {
      setLoading(false)
    }
  }

  return { capture, loading }
}
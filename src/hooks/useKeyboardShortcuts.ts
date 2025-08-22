import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

export const useKeyboardShortcuts = (onNewMoment?: () => void, onSearch?: () => void) => {
  const navigate = useNavigate()

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Don't trigger shortcuts when user is typing in inputs
      if (event.target instanceof HTMLInputElement || 
          event.target instanceof HTMLTextAreaElement ||
          event.target instanceof HTMLSelectElement) {
        return
      }

      // Don't trigger shortcuts when modifiers are pressed (except for specific combinations)
      if (event.ctrlKey || event.altKey || event.metaKey) {
        return
      }

      switch (event.key.toLowerCase()) {
        case 'n':
          event.preventDefault()
          onNewMoment?.()
          break
        case '/':
          event.preventDefault()
          onSearch?.()
          break
        case 'g':
          // Handle 'g' prefix for navigation shortcuts
          const handleGShortcut = (nextEvent: KeyboardEvent) => {
            switch (nextEvent.key.toLowerCase()) {
              case 'p':
                nextEvent.preventDefault()
                navigate('/people')
                break
              case 'c':
                nextEvent.preventDefault()
                navigate('/categories')
                break
              case 't':
                nextEvent.preventDefault()
                navigate('/timeline')
                break
              case 'i':
                nextEvent.preventDefault()
                navigate('/trends')
                break
              case 'h':
                nextEvent.preventDefault()
                navigate('/home')
                break
            }
            document.removeEventListener('keydown', handleGShortcut)
          }
          
          event.preventDefault()
          document.addEventListener('keydown', handleGShortcut)
          
          // Remove listener after 2 seconds if no second key is pressed
          setTimeout(() => {
            document.removeEventListener('keydown', handleGShortcut)
          }, 2000)
          break
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [navigate, onNewMoment, onSearch])
}
// Discreet Mode utilities for masking sensitive data in the UI

export const maskName = (name: string | null | undefined, isDiscreet: boolean): string => {
  if (!name || !isDiscreet) return name || ''
  
  // Keep first letter, blur the rest
  const firstChar = name.charAt(0)
  const masked = '•'.repeat(Math.max(1, name.length - 1))
  return firstChar + masked
}

export const maskDescription = (description: string | null | undefined, isDiscreet: boolean): string => {
  if (!description || !isDiscreet) return description || ''
  
  // Show first few words, blur the rest
  const words = description.split(' ')
  if (words.length <= 2) {
    return '•'.repeat(description.length)
  }
  
  const visibleWords = words.slice(0, 2).join(' ')
  const maskedPart = '•'.repeat(Math.max(10, description.length - visibleWords.length))
  
  return visibleWords + ' ' + maskedPart
}

export const maskText = (text: string | null | undefined, isDiscreet: boolean): string => {
  if (!text || !isDiscreet) return text || ''
  return '•'.repeat(Math.min(20, Math.max(8, text.length)))
}

// CSS classes for blurred text when discreet mode is on
export const getDiscreetClasses = (isDiscreet: boolean): string => {
  return isDiscreet ? 'blur-sm hover:blur-none transition-all duration-200' : ''
}

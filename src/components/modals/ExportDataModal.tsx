import React, { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Download, FileText, Loader2, CheckCircle, AlertTriangle } from 'lucide-react'
import { supabase } from '@/integrations/supabase/client'
import { toast } from 'sonner'

interface ExportDataModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialFormat?: 'csv' | 'pdf'
}

export const ExportDataModal = ({ open, onOpenChange, initialFormat = 'csv' }: ExportDataModalProps) => {
  const [currentFormat, setCurrentFormat] = useState<'csv' | 'pdf'>(initialFormat)
  const [exporting, setExporting] = useState(false)
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null)
  const [lastExport, setLastExport] = useState<{ 
    type: string; 
    timestamp: string; 
    recordCount: number;
  } | null>(null)
  const [abortController, setAbortController] = useState<AbortController | null>(null)

  // Start export when modal opens or format changes
  React.useEffect(() => {
    if (open && currentFormat && !exporting && !downloadUrl) {
      handleExport()
    }
  }, [open, currentFormat])

  // Reset state when modal opens
  React.useEffect(() => {
    if (open) {
      setCurrentFormat(initialFormat)
      setDownloadUrl(null)
    }
  }, [open, initialFormat])

  // Clean up on unmount
  React.useEffect(() => {
    return () => {
      if (abortController) {
        abortController.abort()
      }
    }
  }, [abortController])

  const handleFormatSwitch = (newFormat: 'csv' | 'pdf') => {
    if (abortController) {
      abortController.abort()
    }
    setCurrentFormat(newFormat)
    setDownloadUrl(null)
    setExporting(false)
  }

  const handleExport = async () => {
    if (exporting) return
    
    // Cancel any existing export
    if (abortController) {
      abortController.abort()
    }

    const controller = new AbortController()
    setAbortController(controller)
    setExporting(true)
    setDownloadUrl(null)

    try {
      if (currentFormat === 'csv') {
        const { data, error } = await supabase.functions.invoke('export-data', {
          body: { format: 'csv', range: 'all' }
        })

        if (error) throw error

        if (typeof data === 'string') {
          const blob = new Blob([data], { type: 'text/csv' })
          const url = window.URL.createObjectURL(blob)
          setDownloadUrl(url)

          setLastExport({
            type: 'CSV',
            timestamp: new Date().toISOString(),
            recordCount: data.split('\n').length - 1
          })

          toast.success('CSV export ready for download')
        } else {
          throw new Error('Invalid response format')
        }
      } else {
        const { data, error } = await supabase.functions.invoke('export-pdf')

        if (error) throw error

        if (data?.content) {
          const blob = new Blob([data.content], { type: 'text/html' })
          const url = window.URL.createObjectURL(blob)
          setDownloadUrl(url)

          setLastExport({
            type: 'PDF',
            timestamp: new Date().toISOString(),
            recordCount: data.recordCount || 0
          })

          toast.success('PDF export ready for download')
        } else {
          throw new Error('No content in response')
        }
      }
    } catch (error: any) {
      if (error.name === 'AbortError') return
      console.error('Export error:', error)
      toast.error(error.message || `Failed to export ${currentFormat.toUpperCase()}`)
    } finally {
      setExporting(false)
      setAbortController(null)
    }
  }

  const handleDownload = () => {
    if (!downloadUrl) return

    const a = document.createElement('a')
    a.href = downloadUrl
    
    if (currentFormat === 'csv') {
      a.download = `kinjo-export-${new Date().toISOString().split('T')[0]}.csv`
    } else {
      // For PDF, open in new window instead of download
      window.open(downloadUrl, '_blank')
      return
    }
    
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  const formatFileSize = (recordCount: number) => {
    // Rough estimate: CSV ~100 bytes per record, PDF ~50KB base
    const csvSize = recordCount * 100
    const pdfSize = 50000 + recordCount * 20
    
    if (csvSize < 1024) return `~${csvSize}B`
    if (csvSize < 1024 * 1024) return `~${Math.round(csvSize / 1024)}KB`
    return `~${Math.round(csvSize / (1024 * 1024))}MB`
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5 text-primary" />
            Export Your Data
          </DialogTitle>
          <DialogDescription>
            Download a copy of all your Kinjo data in your preferred format.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Alert>
            <FileText className="h-4 w-4" />
            <AlertDescription>
              Exports include all your moments, people, categories, and groups. 
              Files are generated securely and contain only your personal data.
            </AlertDescription>
          </Alert>

          {lastExport && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription>
                Last export: {lastExport.type} on {' '}
                {new Date(lastExport.timestamp).toLocaleDateString()} 
                ({lastExport.recordCount} records)
              </AlertDescription>
            </Alert>
          )}

          {/* Current format export */}
          <div className="p-4 border rounded-lg">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <h4 className="font-medium">
                    {currentFormat === 'csv' ? 'CSV Format' : 'PDF Summary'}
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    {currentFormat === 'csv' 
                      ? 'Structured data files for analysis'
                      : 'Formatted report with stats and timeline'
                    }
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Est. size: {currentFormat === 'csv' ? formatFileSize(100) + ' • Multiple files' : '~100KB • Last 30 days'}
                  </p>
                </div>
                
                {downloadUrl ? (
                  <Button onClick={handleDownload} className="min-w-[120px]">
                    <Download className="h-4 w-4 mr-2" />
                    Download {currentFormat.toUpperCase()}
                  </Button>
                ) : (
                  <Button disabled className="min-w-[120px]">
                    {exporting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        {currentFormat === 'csv' ? 'Exporting...' : 'Generating...'}
                      </>
                    ) : (
                      <>
                        <Download className="h-4 w-4 mr-2" />
                        Preparing...
                      </>
                    )}
                  </Button>
                )}
              </div>

              {/* Format switch option */}
              <div className="pt-2 border-t">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleFormatSwitch(currentFormat === 'csv' ? 'pdf' : 'csv')}
                  disabled={exporting}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  Need {currentFormat === 'csv' ? 'PDF' : 'CSV'} instead?
                </Button>
              </div>
            </div>
          </div>

          <Alert className="border-amber-200 bg-amber-50">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-800">
              Export links expire after 15 minutes for your security.
              Download files immediately after generation.
            </AlertDescription>
          </Alert>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
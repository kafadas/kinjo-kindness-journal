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
}

export const ExportDataModal = ({ open, onOpenChange }: ExportDataModalProps) => {
  const [exportingCSV, setExportingCSV] = useState(false)
  const [exportingPDF, setExportingPDF] = useState(false)
  const [lastExport, setLastExport] = useState<{ 
    type: string; 
    timestamp: string; 
    recordCount: number;
  } | null>(null)

  const handleCSVExport = async () => {
    setExportingCSV(true)
    try {
      const { data, error } = await supabase.functions.invoke('export-data', {
        body: { format: 'csv', range: 'all' }
      })

      if (error) throw error

      // Create a blob from the CSV content and trigger download
      if (typeof data === 'string') {
        const blob = new Blob([data], { type: 'text/csv' })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `kinjo-export-${new Date().toISOString().split('T')[0]}.csv`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        window.URL.revokeObjectURL(url)

        setLastExport({
          type: 'CSV',
          timestamp: new Date().toISOString(),
          recordCount: data.split('\n').length - 1
        })

        toast.success('CSV export downloaded successfully')
      } else {
        throw new Error('Invalid response format')
      }
    } catch (error: any) {
      console.error('CSV export error:', error)
      toast.error(error.message || 'Failed to export CSV')
    } finally {
      setExportingCSV(false)
    }
  }

  const handlePDFExport = async () => {
    setExportingPDF(true)
    try {
      const { data, error } = await supabase.functions.invoke('export-pdf')

      if (error) throw error

      if (data?.content) {
        // Create a blob from the HTML content and open in new window
        const blob = new Blob([data.content], { type: 'text/html' })
        const url = window.URL.createObjectURL(blob)
        window.open(url, '_blank')

        setLastExport({
          type: 'PDF',
          timestamp: new Date().toISOString(),
          recordCount: data.recordCount || 0
        })

        toast.success('PDF export generated successfully')
      } else {
        throw new Error('No content in response')
      }
    } catch (error: any) {
      console.error('PDF export error:', error)
      toast.error(error.message || 'Failed to export PDF')
    } finally {
      setExportingPDF(false)
    }
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

          <div className="grid gap-3">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="space-y-1">
                <h4 className="font-medium">CSV Format</h4>
                <p className="text-sm text-muted-foreground">
                  Structured data files for analysis
                </p>
                <p className="text-xs text-muted-foreground">
                  Est. size: {formatFileSize(100)} • Multiple files
                </p>
              </div>
              <Button
                onClick={handleCSVExport}
                disabled={exportingCSV}
                variant="outline"
              >
                {exportingCSV ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
                {exportingCSV ? 'Exporting...' : 'Download CSV'}
              </Button>
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="space-y-1">
                <h4 className="font-medium">PDF Summary</h4>
                <p className="text-sm text-muted-foreground">
                  Formatted report with stats and timeline
                </p>
                <p className="text-xs text-muted-foreground">
                  Est. size: ~100KB • Last 30 days
                </p>
              </div>
              <Button
                onClick={handlePDFExport}
                disabled={exportingPDF}
                variant="outline"
              >
                {exportingPDF ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <FileText className="h-4 w-4" />
                )}
                {exportingPDF ? 'Generating...' : 'Generate PDF'}
              </Button>
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
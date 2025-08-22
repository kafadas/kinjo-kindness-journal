import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { toast } from 'sonner'

interface TestResult {
  test: string
  status: 'pending' | 'success' | 'error'
  message: string
  data?: any
}

export const DevRLSCheck = () => {
  const { user } = useAuth()
  const [results, setResults] = useState<TestResult[]>([])
  const [isRunning, setIsRunning] = useState(false)

  const updateResult = (index: number, status: 'success' | 'error', message: string, data?: any) => {
    setResults(prev => prev.map((result, i) => 
      i === index ? { ...result, status, message, data } : result
    ))
  }

  const runTests = async () => {
    if (!user) {
      toast.error('Must be logged in to run tests')
      return
    }

    setIsRunning(true)
    const initialResults: TestResult[] = [
      { test: 'Create Person + Moment', status: 'pending', message: 'Creating test data...' },
      { test: 'Fetch Another User\'s Data', status: 'pending', message: 'Testing cross-user access...' },
      { test: 'List Prompts (Global vs Mine)', status: 'pending', message: 'Checking prompt visibility...' }
    ]
    setResults(initialResults)

    try {
      // Test 1: Create person + moment as current user
      const { data: person, error: personError } = await supabase
        .from('people')
        .insert({
          display_name: 'Test Person ' + Date.now(),
          user_id: user.id
        })
        .select()
        .single()

      if (personError) {
        updateResult(0, 'error', `Failed to create person: ${personError.message}`)
      } else {
        const { data: moment, error: momentError } = await supabase
          .from('moments')
          .insert({
            user_id: user.id,
            person_id: person.id,
            action: 'given',
            happened_at: new Date().toISOString(),
            description: 'Test moment for RLS check'
          })
          .select()
          .single()

        if (momentError) {
          updateResult(0, 'error', `Failed to create moment: ${momentError.message}`)
        } else {
          updateResult(0, 'success', `Created person "${person.display_name}" and moment successfully`, 
            { personId: person.id, momentId: moment.id })
        }
      }

      // Test 2: Try to fetch another user's data (should fail)
      // First, let's try to get ALL people (should only see our own)
      const { data: allPeople, error: allPeopleError } = await supabase
        .from('people')
        .select('*')

      if (allPeopleError) {
        updateResult(1, 'error', `Failed to query people table: ${allPeopleError.message}`)
      } else {
        // All returned people should belong to current user
        const otherUsersPeople = allPeople?.filter(p => p.user_id !== user.id) || []
        
        if (otherUsersPeople.length > 0) {
          updateResult(1, 'error', 
            `WARNING: RLS BREACH! Can see ${otherUsersPeople.length} people from other users!`, 
            { ownPeople: allPeople?.length, othersPeople: otherUsersPeople.length })
        } else {
          updateResult(1, 'success', 
            `Good! RLS working - can only see own data (${allPeople?.length || 0} people)`, 
            { peopleCount: allPeople?.length })
        }
      }

      // Test 3: List prompts and categorize them
      const { data: prompts, error: promptsError } = await supabase
        .from('prompts')
        .select('*')

      if (promptsError) {
        updateResult(2, 'error', `Failed to fetch prompts: ${promptsError.message}`)
      } else {
        const globalPrompts = prompts?.filter(p => p.user_id === null) || []
        const userPrompts = prompts?.filter(p => p.user_id === user.id) || []
        
        updateResult(2, 'success', 
          `Found ${globalPrompts.length} global prompts, ${userPrompts.length} user prompts`, 
          { global: globalPrompts, user: userPrompts })
      }

    } catch (error) {
      toast.error('Test suite failed: ' + (error as Error).message)
    } finally {
      setIsRunning(false)
    }
  }

  const clearResults = () => {
    setResults([])
  }

  if (!user) {
    return (
      <div className="container mx-auto p-6">
        <Alert>
          <AlertDescription>
            You must be logged in to access the RLS testing page.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">RLS Security Test Suite</h1>
          <p className="text-muted-foreground">Development utility to verify Row Level Security policies</p>
        </div>
        <Badge variant="destructive">DEV ONLY</Badge>
      </div>

      <div className="flex gap-4">
        <Button onClick={runTests} disabled={isRunning}>
          {isRunning ? 'Running Tests...' : 'Run Security Tests'}
        </Button>
        <Button variant="outline" onClick={clearResults} disabled={isRunning}>
          Clear Results
        </Button>
      </div>

      <div className="space-y-4">
        {results.map((result, index) => (
          <Card key={index}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {result.test}
                <Badge 
                  variant={
                    result.status === 'success' ? 'default' : 
                    result.status === 'error' ? 'destructive' : 'secondary'
                  }
                >
                  {result.status}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-2">{result.message}</p>
              {result.data && (
                <details className="mt-2">
                  <summary className="cursor-pointer text-sm text-muted-foreground">
                    Show raw data
                  </summary>
                  <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-auto">
                    {JSON.stringify(result.data, null, 2)}
                  </pre>
                </details>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {results.length === 0 && (
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground text-center">
              Click "Run Security Tests" to verify RLS policies are working correctly.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
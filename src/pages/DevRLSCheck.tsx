import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { toast } from 'sonner'
import { createPerson, createMoment, getCategories, getCurrentUserId } from '@/lib/db'

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
  const [isInsertingSample, setIsInsertingSample] = useState(false)

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

  const insertSampleData = async () => {
    if (!user) {
      toast.error('You must be logged in to insert sample data')
      return
    }

    setIsInsertingSample(true)
    try {
      const userId = await getCurrentUserId()
      if (!userId) throw new Error('Not authenticated')

      // Get existing categories to use Family and Work
      const categories = await getCategories()
      const familyCategory = categories.find(c => c.slug === 'family')
      const workCategory = categories.find(c => c.slug === 'work')
      
      if (!familyCategory || !workCategory) {
        throw new Error('Family or Work category not found')
      }

      // Create sample people (use raw supabase for consistency with direct user_id)
      const { data: alex, error: alexError } = await supabase
        .from('people')
        .insert({
          display_name: 'Alex',
          avatar_type: 'initials',
          aliases: ['alex', 'al'],
          user_id: userId
        })
        .select()
        .single()
      
      if (alexError) throw alexError

      const { data: jamie, error: jamieError } = await supabase
        .from('people')
        .insert({
          display_name: 'Jamie',
          avatar_type: 'initials', 
          aliases: ['jamie', 'j'],
          user_id: userId
        })
        .select()
        .single()
      
      if (jamieError) throw jamieError

      // Create Friends group
      const { data: friendsGroup, error: groupError } = await supabase
        .from('groups')
        .insert({
          name: 'Friends',
          emoji: '👥',
          user_id: userId,
          sort_order: 0
        })
        .select()
        .single()

      if (groupError) throw groupError

      // Associate people with Friends group
      await supabase.from('person_groups').insert([
        { person_id: alex.id, group_id: friendsGroup.id },
        { person_id: jamie.id, group_id: friendsGroup.id }
      ])

      // Create sample moments over last 45 days
      const now = new Date()
      const sampleMoments = [
        {
          description: 'Called to check in and catch up',
          person_id: alex.id,
          category_id: familyCategory.id,
          action: 'given' as const,
          happened_at: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          tags: ['seed', 'demo'],
          significance: true
        },
        {
          description: 'Helped with work presentation feedback',
          person_id: jamie.id,
          category_id: workCategory.id,
          action: 'given' as const,
          happened_at: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          tags: ['seed', 'demo', 'work']
        },
        {
          description: 'Received thoughtful birthday message',
          person_id: alex.id,
          category_id: familyCategory.id,
          action: 'received' as const,
          happened_at: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000).toISOString(),
          tags: ['seed', 'demo'],
          significance: true
        },
        {
          description: 'Grabbed coffee and shared career advice',
          person_id: jamie.id,
          category_id: workCategory.id,
          action: 'received' as const,
          happened_at: new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000).toISOString(),
          tags: ['seed', 'demo']
        },
        {
          description: 'Sent encouraging text during difficult time',
          person_id: alex.id,
          category_id: familyCategory.id,
          action: 'given' as const,
          happened_at: new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000).toISOString(),
          tags: ['seed', 'demo']
        },
        {
          description: 'Collaborated on project proposal',
          person_id: jamie.id,
          category_id: workCategory.id,
          action: 'given' as const,
          happened_at: new Date(now.getTime() - 25 * 24 * 60 * 60 * 1000).toISOString(),
          tags: ['seed', 'demo', 'collaboration']
        },
        {
          description: 'Received helpful book recommendation',
          person_id: alex.id,
          category_id: familyCategory.id,
          action: 'received' as const,
          happened_at: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          tags: ['seed', 'demo']
        },
        {
          description: 'Shared lunch and discussed weekend plans',
          person_id: jamie.id,
          category_id: workCategory.id,
          action: 'received' as const,
          happened_at: new Date(now.getTime() - 35 * 24 * 60 * 60 * 1000).toISOString(),
          tags: ['seed', 'demo']
        }
      ]

      // Insert all moments (use raw supabase for consistency with direct user_id)
      for (const moment of sampleMoments) {
        const { error } = await supabase
          .from('moments')
          .insert({
            ...moment,
            user_id: userId
          })
        if (error) throw error
      }

      toast.success(`Sample data inserted: 2 people, 1 group, ${sampleMoments.length} moments`)
    } catch (error) {
      toast.error('Failed to insert sample data: ' + (error as Error).message)
    } finally {
      setIsInsertingSample(false)
    }
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
        <Button 
          variant="secondary" 
          onClick={insertSampleData} 
          disabled={isInsertingSample || isRunning}
        >
          {isInsertingSample ? 'Inserting...' : 'Insert Sample Data'}
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
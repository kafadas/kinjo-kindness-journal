import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { format, subDays } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";

interface MomentCount {
  d: string;
  given: number;
  received: number;
  total: number;
}

interface ClientMomentCount {
  date: string;
  given: number;
  received: number;
  total: number;
}

export default function DevTrendsAudit() {
  const { user } = useAuth();
  const [useCurrentUser, setUseCurrentUser] = useState(true);
  const isDevMode = new URLSearchParams(window.location.search).get('dev') === '1';
  const canUseTestUser = isDevMode && user?.email === 'domingo.coleden@malldrops.com';
  
  const effectiveUserId = user?.id;

  // Get user timezone
  const { data: userTimezone } = useQuery({
    queryKey: ['user-timezone', effectiveUserId],
    queryFn: async () => {
      if (!effectiveUserId) return 'UTC';
      const { data } = await supabase.rpc('user_tz', { p_user: effectiveUserId });
      return data || 'UTC';
    },
    enabled: !!effectiveUserId,
  });

  // Get server-side data using daily_moment_counts
  const { data: serverData, isLoading: serverLoading } = useQuery({
    queryKey: ['server-moments', effectiveUserId, userTimezone],
    queryFn: async () => {
      if (!effectiveUserId || !userTimezone) return [];
      
      const endDate = new Date();
      const startDate = subDays(endDate, 45);
      
      const { data, error } = await supabase.rpc('daily_moment_counts', {
        p_user: effectiveUserId,
        p_start: format(startDate, 'yyyy-MM-dd'),
        p_end: format(endDate, 'yyyy-MM-dd'),
        p_action: 'both',
        p_significant_only: false,
        p_tz: userTimezone
      });
      
      if (error) throw error;
      return data as MomentCount[];
    },
    enabled: !!effectiveUserId && !!userTimezone,
  });

  // Get client-side data for comparison
  const { data: clientData, isLoading: clientLoading } = useQuery({
    queryKey: ['client-moments', effectiveUserId, userTimezone],
    queryFn: async () => {
      if (!effectiveUserId || !userTimezone) return [];
      
      const endDate = new Date();
      const startDate = subDays(endDate, 45);
      
      const { data: moments, error } = await supabase
        .from('moments')
        .select('happened_at, action')
        .eq('user_id', effectiveUserId)
        .gte('happened_at', startDate.toISOString())
        .lte('happened_at', endDate.toISOString());
      
      if (error) throw error;
      
      // Group by date in user timezone
      const counts: { [date: string]: ClientMomentCount } = {};
      
      moments.forEach(moment => {
        const dateInTz = formatInTimeZone(new Date(moment.happened_at), userTimezone, 'yyyy-MM-dd');
        
        if (!counts[dateInTz]) {
          counts[dateInTz] = { date: dateInTz, given: 0, received: 0, total: 0 };
        }
        
        if (moment.action === 'given') {
          counts[dateInTz].given++;
        } else {
          counts[dateInTz].received++;
        }
        counts[dateInTz].total++;
      });
      
      return Object.values(counts).sort((a, b) => a.date.localeCompare(b.date));
    },
    enabled: !!effectiveUserId && !!userTimezone,
  });

  if (!user) {
    return <div>Please log in to access this dev tool.</div>;
  }

  const loading = serverLoading || clientLoading;

  // Merge server and client data for comparison
  const comparisonData = serverData?.map(serverRow => {
    const clientRow = clientData?.find(c => c.date === serverRow.d);
    
    const givenMatch = serverRow.given === (clientRow?.given || 0);
    const receivedMatch = serverRow.received === (clientRow?.received || 0);
    const totalMatch = serverRow.total === (clientRow?.total || 0);
    
    return {
      date: serverRow.d,
      server: serverRow,
      client: clientRow || { date: serverRow.d, given: 0, received: 0, total: 0 },
      matches: { given: givenMatch, received: receivedMatch, total: totalMatch }
    };
  }) || [];

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Trends Data Audit</h1>
          <p className="text-muted-foreground">
            Compare server-side daily_moment_counts vs client-side aggregation
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            User: {user.email} | Timezone: {userTimezone}
          </p>
        </div>
        
        {canUseTestUser && (
          <Button
            variant={useCurrentUser ? "default" : "outline"}
            onClick={() => setUseCurrentUser(!useCurrentUser)}
          >
            Using Current User
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Data Comparison (Last 45 Days)</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div>Loading...</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Server Given</TableHead>
                    <TableHead>Server Received</TableHead>
                    <TableHead>Server Total</TableHead>
                    <TableHead>Client Given</TableHead>
                    <TableHead>Client Received</TableHead>
                    <TableHead>Client Total</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {comparisonData.map((row) => (
                    <TableRow key={row.date}>
                      <TableCell className="font-mono">{row.date}</TableCell>
                      <TableCell className={!row.matches.given ? "bg-red-50 dark:bg-red-900/20" : ""}>
                        {row.server.given}
                      </TableCell>
                      <TableCell className={!row.matches.received ? "bg-red-50 dark:bg-red-900/20" : ""}>
                        {row.server.received}
                      </TableCell>
                      <TableCell className={!row.matches.total ? "bg-red-50 dark:bg-red-900/20" : ""}>
                        {row.server.total}
                      </TableCell>
                      <TableCell className={!row.matches.given ? "bg-red-50 dark:bg-red-900/20" : ""}>
                        {row.client.given}
                      </TableCell>
                      <TableCell className={!row.matches.received ? "bg-red-50 dark:bg-red-900/20" : ""}>
                        {row.client.received}
                      </TableCell>
                      <TableCell className={!row.matches.total ? "bg-red-50 dark:bg-red-900/20" : ""}>
                        {row.client.total}
                      </TableCell>
                      <TableCell>
                        {row.matches.given && row.matches.received && row.matches.total ? (
                          <Badge variant="default" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                            Match
                          </Badge>
                        ) : (
                          <Badge variant="destructive">
                            Mismatch
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <p>Total rows: {comparisonData.length}</p>
            <p>Matches: {comparisonData.filter(r => r.matches.given && r.matches.received && r.matches.total).length}</p>
            <p>Mismatches: {comparisonData.filter(r => !(r.matches.given && r.matches.received && r.matches.total)).length}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
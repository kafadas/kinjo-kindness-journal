import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { seedSampleData, clearSampleData, seedStreakDemo } from '@/lib/dev/seed';

export const DevSeedData = () => {
  const [isSeeding, setIsSeeding] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [isCreatingStreak, setIsCreatingStreak] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleSeedData = async () => {
    setIsSeeding(true);
    try {
      await seedSampleData();
      
      // Refresh React Query caches
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      queryClient.invalidateQueries({ queryKey: ['people'] });
      queryClient.invalidateQueries({ queryKey: ['groups'] });
      queryClient.invalidateQueries({ queryKey: ['moments'] });
      queryClient.invalidateQueries({ queryKey: ['trends'] });
      queryClient.invalidateQueries({ queryKey: ['home-insights'] });
      
      toast({
        title: "Sample data inserted successfully",
        description: "Rich sample data has been created for testing",
      });
      navigate('/trends');
    } catch (error) {
      toast({
        title: "Error inserting sample data",
        description: error instanceof Error ? error.message : "Failed to insert sample data",
        variant: "destructive",
      });
    } finally {
      setIsSeeding(false);
    }
  };

  const handleStreakDemo = async () => {
    setIsCreatingStreak(true);
    try {
      await seedStreakDemo();
      
      // Refresh React Query caches
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      queryClient.invalidateQueries({ queryKey: ['people'] });
      queryClient.invalidateQueries({ queryKey: ['moments'] });
      queryClient.invalidateQueries({ queryKey: ['trends'] });
      queryClient.invalidateQueries({ queryKey: ['home-insights'] });
      
      toast({
        title: "Streak demo data created",
        description: "12-day streak pattern with variety across categories and people",
      });
      navigate('/reflection');
    } catch (error) {
      toast({
        title: "Error creating streak demo",
        description: error instanceof Error ? error.message : "Failed to create streak demo",
        variant: "destructive",
      });
    } finally {
      setIsCreatingStreak(false);
    }
  };

  const handleClearData = async () => {
    setIsClearing(true);
    try {
      await clearSampleData();
      
      // Refresh React Query caches
      queryClient.invalidateQueries({ queryKey: ['people'] });
      queryClient.invalidateQueries({ queryKey: ['groups'] });
      queryClient.invalidateQueries({ queryKey: ['moments'] });
      queryClient.invalidateQueries({ queryKey: ['trends'] });
      queryClient.invalidateQueries({ queryKey: ['home-insights'] });
      
      toast({
        title: "Sample data cleared",
        description: "All sample data has been removed",
      });
    } catch (error) {
      toast({
        title: "Error clearing sample data",
        description: error instanceof Error ? error.message : "Failed to clear sample data",
        variant: "destructive",
      });
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Development Tools</h1>
        <p className="text-muted-foreground mt-2">
          Generate sample data for testing and development purposes
        </p>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-primary">Insert Rich Sample Data</CardTitle>
            <CardDescription>
              Creates comprehensive test data including categories, people, groups, and 60+ moments 
              spanning the past 120 days with realistic patterns and variety.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={handleSeedData} 
              disabled={isSeeding || isClearing || isCreatingStreak}
              className="w-full"
            >
              {isSeeding ? "Inserting..." : "Insert Rich Sample Data"}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-secondary">Insert Streak Demo</CardTitle>
            <CardDescription>
              Creates a 12-day streak pattern with 1-3 moments per day, then a gap, then sparse days.
              Perfect for testing weekday dots, streak calculations, and reflection views.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              variant="secondary"
              onClick={handleStreakDemo} 
              disabled={isSeeding || isClearing || isCreatingStreak}
              className="w-full"
            >
              {isCreatingStreak ? "Creating..." : "Insert Streak Demo"}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-destructive">Clear Sample Data</CardTitle>
            <CardDescription>
              Removes all moments, people, and groups for the current user. 
              Categories and settings are preserved.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              variant="destructive" 
              onClick={handleClearData} 
              disabled={isSeeding || isClearing || isCreatingStreak}
              className="w-full"
            >
              {isClearing ? "Clearing..." : "Clear Sample Data"}
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8 text-sm text-muted-foreground">
        <p>
          This page is only visible in development mode or when ?dev=1 is present in the URL.
        </p>
      </div>
    </div>
  );
};
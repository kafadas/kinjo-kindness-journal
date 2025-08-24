import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Settings, User, Bell, Palette, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useDiscreetMode } from '@/contexts/DiscreetModeContext';
import { useAuth } from '@/hooks/useAuth';
import { useSettings } from '@/hooks/useSettings';
import { getProfile, updateProfile, updateSettings } from '@/lib/db';
import { toast } from 'sonner';
import type { Profile } from '@/lib/db/types';

interface FormData {
  displayName: string;
  timezone: string;
  theme: 'system' | 'light' | 'dark';
  fontSize: 'small' | 'medium' | 'large';
  discreetMode: boolean;
  dailyReflection: boolean;
  weeklyReflection: boolean;
  milestones: boolean;
}

const DEFAULT_FORM_DATA: FormData = {
  displayName: '',
  timezone: 'UTC',
  theme: 'system',
  fontSize: 'medium',
  discreetMode: false,
  dailyReflection: true,
  weeklyReflection: true,
  milestones: true,
};

export const Preferences: React.FC = () => {
  const navigate = useNavigate();
  const { isDiscreetMode, toggleDiscreetMode } = useDiscreetMode();
  const { session } = useAuth();
  const { settings, loading: settingsLoading } = useSettings();
  
  const [formData, setFormData] = useState<FormData>(DEFAULT_FORM_DATA);
  const [initialData, setInitialData] = useState<FormData>(DEFAULT_FORM_DATA);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Check if form has unsaved changes
  const hasUnsavedChanges = JSON.stringify(formData) !== JSON.stringify(initialData);

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      if (!session?.user?.id) return;
      
      try {
        const profileData = await getProfile();
        setProfile(profileData);
        
        const initialFormData: FormData = {
          displayName: profileData?.display_name || '',
          timezone: profileData?.timezone || 'UTC',
          theme: 'system', // Will be enhanced later with actual theme setting
          fontSize: 'medium', // Will be enhanced later
          discreetMode: settings?.discreet_mode || false,
          dailyReflection: true, // Will be enhanced later with actual settings
          weeklyReflection: settings?.weekly_digest || true,
          milestones: true, // Will be enhanced later
        };
        
        setFormData(initialFormData);
        setInitialData(initialFormData);
      } catch (error) {
        console.error('Error loading preferences:', error);
        toast.error('Failed to load preferences');
      } finally {
        setLoading(false);
      }
    };
    
    if (!settingsLoading) {
      loadData();
    }
  }, [session?.user?.id, settings, settingsLoading]);

  // Update form field
  const updateField = (field: keyof FormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Save changes
  const handleSave = async () => {
    if (!session?.user?.id || !hasUnsavedChanges) return;
    
    setSaving(true);
    try {
      // Update profile data
      if (formData.displayName !== initialData.displayName || formData.timezone !== initialData.timezone) {
        await updateProfile({
          display_name: formData.displayName,
          timezone: formData.timezone,
        });
      }
      
      // Update settings data
      if (formData.discreetMode !== initialData.discreetMode || formData.weeklyReflection !== initialData.weeklyReflection) {
        await updateSettings({
          discreet_mode: formData.discreetMode,
          weekly_digest: formData.weeklyReflection,
        });
      }
      
      // Update discreet mode context if changed
      if (formData.discreetMode !== isDiscreetMode) {
        toggleDiscreetMode();
      }
      
      setInitialData(formData);
      toast.success('Preferences saved');
    } catch (error) {
      console.error('Error saving preferences:', error);
      toast.error('Failed to save preferences');
    } finally {
      setSaving(false);
    }
  };

  // Reset to defaults
  const handleReset = () => {
    setFormData({
      ...DEFAULT_FORM_DATA,
      displayName: profile?.display_name || '',
    });
  };

  if (loading) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="h-4 bg-muted rounded w-1/2"></div>
          <div className="space-y-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-32 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider>
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-semibold mb-2">
          Preferences & Settings
        </h1>
        <p className="text-muted-foreground">
          Customize your Kinjo experience
        </p>
      </div>

      <div className="space-y-6">
        {/* Profile Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              Profile
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input 
                  id="email" 
                  value={session?.user?.email || ''} 
                  disabled 
                  className="bg-muted"
                />
              </div>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="displayName">Display Name</Label>
                  <Input 
                    id="displayName" 
                    placeholder="How should we address you?" 
                    value={formData.displayName}
                    onChange={(e) => updateField('displayName', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="timezone">Timezone</Label>
                  <Select value={formData.timezone} onValueChange={(value) => updateField('timezone', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select timezone" />
                    </SelectTrigger>
                    <SelectContent className="max-h-60">
                      {/* Middle East & Gulf */}
                      <SelectItem value="Asia/Dubai">UAE Time (Dubai/Abu Dhabi)</SelectItem>
                      <SelectItem value="Asia/Kuwait">Kuwait Time</SelectItem>
                      <SelectItem value="Asia/Qatar">Qatar Time</SelectItem>
                      <SelectItem value="Asia/Bahrain">Bahrain Time</SelectItem>
                      <SelectItem value="Asia/Riyadh">Saudi Arabia Time</SelectItem>
                      <SelectItem value="Asia/Muscat">Oman Time</SelectItem>
                      
                      {/* UTC */}
                      <SelectItem value="UTC">UTC (Coordinated Universal Time)</SelectItem>
                      
                      {/* Europe */}
                      <SelectItem value="Europe/London">London (GMT/BST)</SelectItem>
                      <SelectItem value="Europe/Paris">Paris (CET/CEST)</SelectItem>
                      <SelectItem value="Europe/Berlin">Berlin (CET/CEST)</SelectItem>
                      <SelectItem value="Europe/Rome">Rome (CET/CEST)</SelectItem>
                      <SelectItem value="Europe/Madrid">Madrid (CET/CEST)</SelectItem>
                      <SelectItem value="Europe/Amsterdam">Amsterdam (CET/CEST)</SelectItem>
                      <SelectItem value="Europe/Stockholm">Stockholm (CET/CEST)</SelectItem>
                      <SelectItem value="Europe/Moscow">Moscow (MSK)</SelectItem>
                      
                      {/* Asia */}
                      <SelectItem value="Asia/Kolkata">India (IST)</SelectItem>
                      <SelectItem value="Asia/Singapore">Singapore (SGT)</SelectItem>
                      <SelectItem value="Asia/Hong_Kong">Hong Kong (HKT)</SelectItem>
                      <SelectItem value="Asia/Shanghai">China (CST)</SelectItem>
                      <SelectItem value="Asia/Tokyo">Japan (JST)</SelectItem>
                      <SelectItem value="Asia/Seoul">South Korea (KST)</SelectItem>
                      <SelectItem value="Asia/Bangkok">Thailand (ICT)</SelectItem>
                      <SelectItem value="Asia/Jakarta">Indonesia (WIB)</SelectItem>
                      <SelectItem value="Asia/Manila">Philippines (PST)</SelectItem>
                      
                      {/* North America */}
                      <SelectItem value="America/New_York">Eastern Time (ET)</SelectItem>
                      <SelectItem value="America/Chicago">Central Time (CT)</SelectItem>
                      <SelectItem value="America/Denver">Mountain Time (MT)</SelectItem>
                      <SelectItem value="America/Los_Angeles">Pacific Time (PT)</SelectItem>
                      <SelectItem value="America/Toronto">Toronto (ET)</SelectItem>
                      <SelectItem value="America/Vancouver">Vancouver (PT)</SelectItem>
                      
                      {/* Australia & Oceania */}
                      <SelectItem value="Australia/Sydney">Sydney (AEST/AEDT)</SelectItem>
                      <SelectItem value="Australia/Melbourne">Melbourne (AEST/AEDT)</SelectItem>
                      <SelectItem value="Australia/Perth">Perth (AWST)</SelectItem>
                      <SelectItem value="Pacific/Auckland">New Zealand (NZST/NZDT)</SelectItem>
                      
                      {/* Africa */}
                      <SelectItem value="Africa/Cairo">Egypt (EET)</SelectItem>
                      <SelectItem value="Africa/Johannesburg">South Africa (SAST)</SelectItem>
                      <SelectItem value="Africa/Lagos">Nigeria (WAT)</SelectItem>
                      <SelectItem value="Africa/Nairobi">Kenya (EAT)</SelectItem>
                      
                      {/* South America */}
                      <SelectItem value="America/Sao_Paulo">Brazil (BRT)</SelectItem>
                      <SelectItem value="America/Argentina/Buenos_Aires">Argentina (ART)</SelectItem>
                      <SelectItem value="America/Santiago">Chile (CLT)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Privacy Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Privacy & Control
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="discreet-mode" className="text-base font-medium">
                  Discreet Mode
                </Label>
                <p className="text-sm text-muted-foreground">
                  Blur names and sensitive details in the interface for privacy when others might see your screen
                </p>
              </div>
              <Switch
                id="discreet-mode"
                checked={formData.discreetMode}
                onCheckedChange={(checked) => updateField('discreetMode', checked)}
              />
            </div>
            
            <Separator />
            
            <div className="space-y-4">
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => navigate('/privacy')}
              >
                <Settings className="h-4 w-4 mr-2" />
                Advanced Privacy Settings
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" />
              Notifications
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="text-base font-medium">Daily Reflection Reminders</Label>
                <p className="text-sm text-muted-foreground">
                  Gentle reminders to capture your daily moments of kindness
                </p>
              </div>
              <Switch 
                checked={formData.dailyReflection}
                onCheckedChange={(checked) => updateField('dailyReflection', checked)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="text-base font-medium">Weekly Reflection</Label>
                <p className="text-sm text-muted-foreground">
                  Weekly prompt to reflect on your kindness journey
                </p>
              </div>
              <Switch 
                checked={formData.weeklyReflection}
                onCheckedChange={(checked) => updateField('weeklyReflection', checked)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="text-base font-medium">Milestone Celebrations</Label>
                <p className="text-sm text-muted-foreground">
                  Celebrate your kindness milestones and streaks
                </p>
              </div>
              <Switch 
                checked={formData.milestones}
                onCheckedChange={(checked) => updateField('milestones', checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Appearance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5 text-primary" />
              Appearance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Theme</Label>
              <Select value={formData.theme} onValueChange={(value: 'system' | 'light' | 'dark') => updateField('theme', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose theme" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="system">System</SelectItem>
                  <SelectItem value="light">Light</SelectItem>
                  <SelectItem value="dark">Dark</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Font Size</Label>
              <Select value={formData.fontSize} onValueChange={(value: 'small' | 'medium' | 'large') => updateField('fontSize', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select font size" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="small">Small</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="large">Large</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="outline" 
                onClick={handleReset}
                disabled={saving}
              >
                Reset to Defaults
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              Restores defaults (you still need to save)
            </TooltipContent>
          </Tooltip>
          
          <Button 
            onClick={handleSave}
            disabled={!hasUnsavedChanges || saving}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>
    </div>
    </TooltipProvider>
  );
};
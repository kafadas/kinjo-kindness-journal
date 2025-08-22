import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Settings, User, Bell, Palette, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useDiscreetMode } from '@/contexts/DiscreetModeContext';
import { useAuth } from '@/hooks/useAuth';

export const Preferences: React.FC = () => {
  const navigate = useNavigate();
  const { isDiscreetMode, toggleDiscreetMode } = useDiscreetMode();
  const { session } = useAuth();

  return (
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
                  <Input id="displayName" placeholder="How should we address you?" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="timezone">Timezone</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select timezone" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="utc">UTC</SelectItem>
                      <SelectItem value="est">Eastern Time</SelectItem>
                      <SelectItem value="pst">Pacific Time</SelectItem>
                      <SelectItem value="cet">Central European Time</SelectItem>
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
                checked={isDiscreetMode}
                onCheckedChange={toggleDiscreetMode}
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
              <div className="grid md:grid-cols-2 gap-3">
                <Button variant="outline" size="sm">
                  Export My Data
                </Button>
                <Button variant="outline" size="sm">
                  Download Archive
                </Button>
              </div>
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
              <Switch defaultChecked />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="text-base font-medium">Weekly Reflection</Label>
                <p className="text-sm text-muted-foreground">
                  Weekly prompt to reflect on your kindness journey
                </p>
              </div>
              <Switch defaultChecked />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="text-base font-medium">Milestone Celebrations</Label>
                <p className="text-sm text-muted-foreground">
                  Celebrate your kindness milestones and streaks
                </p>
              </div>
              <Switch defaultChecked />
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
              <Select>
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
              <Select>
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
          <Button variant="outline">
            Reset to Defaults
          </Button>
          <Button>
            Save Changes
          </Button>
        </div>
      </div>
    </div>
  );
};
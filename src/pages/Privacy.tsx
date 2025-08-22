import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Shield, Download, Trash2, AlertTriangle, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useDiscreetMode } from '@/contexts/DiscreetModeContext';

export const Privacy: React.FC = () => {
  const navigate = useNavigate();
  const { isDiscreetMode, toggleDiscreetMode } = useDiscreetMode();

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/preferences')}
          className="p-2"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="font-display text-2xl font-semibold">
            Privacy & Control Settings
          </h1>
          <p className="text-muted-foreground">
            Manage your data and privacy preferences
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Discreet Mode */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Discreet Mode
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="discreet-mode" className="text-base font-medium">
                  Enable Discreet Mode
                </Label>
                <p className="text-sm text-muted-foreground">
                  Blur names and sensitive details when others might see your screen
                </p>
              </div>
              <Switch
                id="discreet-mode"
                checked={isDiscreetMode}
                onCheckedChange={toggleDiscreetMode}
              />
            </div>
            
            <Alert>
              <Shield className="h-4 w-4" />
              <AlertDescription>
                Discreet Mode only affects the visual display of your data. Your actual data remains unchanged and secure.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        {/* Data Export */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5 text-primary" />
              Data Export
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Download a copy of all your Kinjo data including entries, people, categories, and reflections.
            </p>
            
            <div className="grid md:grid-cols-2 gap-3">
              <Button variant="outline" className="justify-start">
                <Download className="h-4 w-4 mr-2" />
                Export as JSON
              </Button>
              <Button variant="outline" className="justify-start">
                <Download className="h-4 w-4 mr-2" />
                Export as CSV
              </Button>
            </div>
            
            <p className="text-xs text-muted-foreground">
              Export includes all your data in a portable format. Exported files are encrypted for your security.
            </p>
          </CardContent>
        </Card>

        {/* Data Retention */}
        <Card>
          <CardHeader>
            <CardTitle>Data Retention</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="text-base font-medium">Auto-delete old entries</Label>
                <p className="text-sm text-muted-foreground">
                  Automatically remove entries older than a specified time
                </p>
              </div>
              <Switch />
            </div>
            
            <div className="space-y-2">
              <Label className="text-sm font-medium">Retention Period</Label>
              <p className="text-xs text-muted-foreground">
                Currently disabled. When enabled, entries older than 2 years will be automatically removed.
              </p>
            </div>
          </CardContent>
        </Card>

        <Separator />

        {/* Danger Zone */}
        <Card className="border-destructive/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Danger Zone
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <Alert className="border-destructive/20">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                These actions are permanent and cannot be undone. Please proceed with caution.
              </AlertDescription>
            </Alert>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border border-destructive/20 rounded-lg">
                <div className="space-y-1">
                  <Label className="text-base font-medium">Clear All Entries</Label>
                  <p className="text-sm text-muted-foreground">
                    Permanently delete all your kindness entries while keeping people and categories
                  </p>
                </div>
                <Button variant="destructive" size="sm">
                  Clear Entries
                </Button>
              </div>
              
              <div className="flex items-center justify-between p-4 border border-destructive/20 rounded-lg">
                <div className="space-y-1">
                  <Label className="text-base font-medium">Delete Account</Label>
                  <p className="text-sm text-muted-foreground">
                    Permanently delete your account and all associated data
                  </p>
                </div>
                <Button variant="destructive" size="sm">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Account
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Back Button */}
        <div className="flex justify-start">
          <Button variant="outline" onClick={() => navigate('/preferences')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Preferences
          </Button>
        </div>
      </div>
    </div>
  );
};
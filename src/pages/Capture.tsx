import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Heart, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const Capture: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(-1)}
          className="p-2"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="font-display text-2xl font-semibold">
          Capture Kindness
        </h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-primary" />
            Share your moment
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="description">What happened?</Label>
            <Textarea
              id="description"
              placeholder="Describe the act of kindness..."
              className="min-h-32 resize-none"
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="person">Person (optional)</Label>
              <Input
                id="person"
                placeholder="Who was involved?"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="family">Family</SelectItem>
                  <SelectItem value="friends">Friends</SelectItem>
                  <SelectItem value="community">Community</SelectItem>
                  <SelectItem value="work">Work</SelectItem>
                  <SelectItem value="stranger">Stranger</SelectItem>
                  <SelectItem value="self">Self-care</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Type of kindness</Label>
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Given or received?" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="given">I gave kindness</SelectItem>
                <SelectItem value="received">I received kindness</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-3 pt-4">
            <Button variant="outline" onClick={() => navigate(-1)}>
              Cancel
            </Button>
            <Button className="flex-1">
              Save Entry
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
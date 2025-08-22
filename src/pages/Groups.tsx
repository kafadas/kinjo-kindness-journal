import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, Plus, Settings, UserPlus, MessageCircle } from 'lucide-react';

export const Groups: React.FC = () => {
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-semibold mb-2">
            Groups Manager
          </h1>
          <p className="text-muted-foreground">
            Connect with communities and share kindness together
          </p>
        </div>
        <Button className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Create Group
        </Button>
      </div>

      {/* Coming Soon Notice */}
      <Card className="mb-6 border-dashed border-2">
        <CardContent className="p-12 text-center">
          <Users className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="font-semibold text-xl mb-2">Groups Coming Soon</h3>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            Connect with friends, family, or communities to share your kindness journey together. 
            Create challenges, celebrate milestones, and inspire each other.
          </p>
          <div className="flex gap-3 justify-center">
            <Button variant="outline">
              Join Waitlist
            </Button>
            <Button>
              Learn More
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Planned Features */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-primary" />
              Family Circles
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Create private groups with family members to share daily kindness and celebrate each other's acts of love.
            </p>
            <Badge variant="outline">Coming Soon</Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-primary" />
              Community Challenges
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Join community-wide kindness challenges and work together towards shared goals of spreading joy.
            </p>
            <Badge variant="outline">Coming Soon</Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-primary" />
              Workplace Teams
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Build stronger workplace relationships by tracking team kindness and recognizing colleagues' contributions.
            </p>
            <Badge variant="outline">Coming Soon</Badge>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
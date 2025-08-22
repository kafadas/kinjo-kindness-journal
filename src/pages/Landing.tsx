import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Heart, Shield, Users, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const Landing: React.FC = () => {
  const navigate = useNavigate();

  const handleGetStarted = () => {
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary-soft via-background to-accent">
        <div className="container mx-auto px-4 py-20">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="font-display text-5xl md:text-7xl font-bold text-foreground mb-6">
              Kinjo
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Your private sanctuary for capturing, reflecting on, and celebrating moments of kindness.
            </p>
            <Button 
              onClick={handleGetStarted}
              size="lg"
              className="px-8 py-4 text-lg font-medium"
            >
              Begin Your Journey
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-card">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="font-display text-3xl md:text-4xl font-semibold text-foreground mb-4">
              A calm space for reflection
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Track kindness given and received, reflect on meaningful connections, and discover patterns in your journey of compassion.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <Card className="text-center border-border/50 hover:border-primary/20 transition-colors">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Heart className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold text-lg mb-2">Capture Moments</h3>
                <p className="text-muted-foreground text-sm">
                  Record acts of kindness, both given and received, in a simple, distraction-free interface.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center border-border/50 hover:border-primary/20 transition-colors">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Shield className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold text-lg mb-2">Private & Secure</h3>
                <p className="text-muted-foreground text-sm">
                  Your entries are private to you. Optional "Discreet Mode" for additional privacy when needed.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center border-border/50 hover:border-primary/20 transition-colors">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold text-lg mb-2">Track Connections</h3>
                <p className="text-muted-foreground text-sm">
                  See patterns in your relationships and the people who bring kindness to your life.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center border-border/50 hover:border-primary/20 transition-colors">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <TrendingUp className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold text-lg mb-2">Gentle Insights</h3>
                <p className="text-muted-foreground text-sm">
                  Discover trends and patterns in your kindness journey through beautiful, non-judgmental visualizations.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-2xl mx-auto">
            <h2 className="font-display text-3xl md:text-4xl font-semibold text-foreground mb-4">
              Start your kindness journal today
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Join a community dedicated to celebrating the small acts of kindness that make life meaningful.
            </p>
            <Button 
              onClick={handleGetStarted}
              size="lg"
              className="px-8 py-4 text-lg font-medium"
            >
              Get Started Free
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};
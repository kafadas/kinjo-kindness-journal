import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { signIn, signUp, resetPassword } from '@/lib/auth';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  
  const [isLogin, setIsLogin] = useState(true);
  const [isResetPassword, setIsResetPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // Redirect if already authenticated
  useEffect(() => {
    if (user && !authLoading) {
      navigate('/home');
    }
  }, [user, authLoading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isResetPassword) {
        await resetPassword(email);
        toast({
          title: 'Reset email sent',
          description: 'Check your email for password reset instructions.',
        });
        setIsResetPassword(false);
      } else if (isLogin) {
        await signIn({ email, password });
        toast({
          title: 'Welcome back!',
          description: 'You have successfully logged in.',
        });
      } else {
        if (password !== confirmPassword) {
          throw new Error('Passwords do not match');
        }
        if (password.length < 6) {
          throw new Error('Password must be at least 6 characters');
        }
        
        const { user } = await signUp({ email, password });
        
        if (user && !user.email_confirmed_at) {
          toast({
            title: 'Check your email',
            description: 'We sent you a confirmation link to complete your registration.',
          });
        } else {
          toast({
            title: 'Account created!',
            description: 'Welcome to Kinjo. Your kindness journey begins now.',
          });
        }
      }
    } catch (error: any) {
      toast({
        title: 'Authentication error',
        description: error.message || 'An unexpected error occurred.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGuestAccess = () => {
    navigate('/home');
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-soft via-background to-accent flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="font-display text-4xl font-bold text-primary mb-2">
            Kinjo
          </h1>
          <p className="text-muted-foreground">
            Your kindness journal
          </p>
        </div>

        <Card className="border-border/50 shadow-lg backdrop-blur-sm bg-card/95">
          <CardHeader className="text-center">
            <CardTitle className="text-xl">
              {isResetPassword 
                ? 'Reset your password' 
                : isLogin 
                  ? 'Welcome back' 
                  : 'Join Kinjo'
              }
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              
              {!isResetPassword && (
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                </div>
              )}
              
              {!isLogin && !isResetPassword && (
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Confirm your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                </div>
              )}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isResetPassword 
                  ? 'Send Reset Email' 
                  : isLogin 
                    ? 'Sign In' 
                    : 'Create Account'
                }
              </Button>
            </form>

            {!isResetPassword && (
              <>
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <Separator />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2 text-muted-foreground">
                      Or
                    </span>
                  </div>
                </div>

                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={handleGuestAccess}
                >
                  Continue as Guest
                </Button>
              </>
            )}

            <div className="text-center space-y-2">
              {!isResetPassword && (
                <Button
                  variant="link"
                  onClick={() => setIsLogin(!isLogin)}
                  className="text-sm text-muted-foreground hover:text-foreground"
                >
                  {isLogin 
                    ? "Don't have an account? Sign up" 
                    : "Already have an account? Sign in"
                  }
                </Button>
              )}
              
              {isLogin && !isResetPassword && (
                <Button
                  variant="link"
                  onClick={() => setIsResetPassword(true)}
                  className="text-sm text-muted-foreground hover:text-foreground"
                >
                  Forgot your password?
                </Button>
              )}
              
              {isResetPassword && (
                <Button
                  variant="link"
                  onClick={() => {
                    setIsResetPassword(false)
                    setIsLogin(true)
                  }}
                  className="text-sm text-muted-foreground hover:text-foreground"
                >
                  Back to sign in
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
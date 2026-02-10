import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Sparkles, Mail, Lock, User, ArrowRight, Loader2, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';

// Auth now uses Lovable Cloud authentication directly

const emailSchema = z.string().email('Please enter a valid email address');
const passwordSchema = z.string().min(6, 'Password must be at least 6 characters');

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [showPassword, setShowPassword] = useState(false);
  const [forgotMode, setForgotMode] = useState(false);
  const [sendingReset, setSendingReset] = useState(false);
  
  const { user, loading, signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!loading && user) {
      navigate('/dashboard');
    }
  }, [user, loading, navigate]);

  const validateForm = () => {
    const newErrors: { email?: string; password?: string } = {};
    
    const emailResult = emailSchema.safeParse(email);
    if (!emailResult.success) {
      newErrors.email = emailResult.error.errors[0].message;
    }
    
    const passwordResult = passwordSchema.safeParse(password);
    if (!passwordResult.success) {
      newErrors.password = passwordResult.error.errors[0].message;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleForgotPassword = async () => {
    const emailResult = emailSchema.safeParse(email);
    if (!emailResult.success) {
      setErrors({ email: emailResult.error.errors[0].message });
      return;
    }
    setSendingReset(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth`,
      });
      if (error) throw error;
      toast({
        title: 'Reset email sent',
        description: 'Check your inbox for the password reset link.',
      });
      setForgotMode(false);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to send reset email.',
        variant: 'destructive',
      });
    } finally {
      setSendingReset(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (forgotMode) {
      handleForgotPassword();
      return;
    }
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    
    try {
      if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) {
          if (error.message.includes('Invalid login credentials')) {
            toast({
              title: 'Login failed',
              description: 'Invalid email or password. Please try again.',
              variant: 'destructive',
            });
          } else {
            toast({
              title: 'Login failed',
              description: error.message,
              variant: 'destructive',
            });
          }
        } else {
          navigate('/dashboard?welcome=true');
        }
      } else {
        const { error } = await signUp(email, password, displayName);
        if (error) {
          if (error.message.includes('already registered')) {
            toast({
              title: 'Account exists',
              description: 'This email is already registered. Try signing in instead.',
              variant: 'destructive',
            });
          } else {
            toast({
              title: 'Sign up failed',
              description: error.message,
              variant: 'destructive',
            });
          }
        } else {
          toast({
            title: 'Account created!',
            description: 'Welcome to Alchify. Let\'s start creating!',
          });
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>{forgotMode ? 'Reset Password' : isLogin ? 'Sign In' : 'Sign Up'} | Alchify</title>
        <meta name="description" content="Sign in to Alchify to start refining your content with AI-powered post-production tools." />
      </Helmet>
      
      <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/20 via-background to-background" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-pulse" />
        
        <div className="relative z-10 w-full max-w-md px-4">
          {/* Logo */}
          <a href="/" className="flex items-center justify-center gap-2 mb-8">
            <div className="relative">
              <Sparkles className="h-10 w-10 text-primary animate-pulse-glow" />
              <div className="absolute inset-0 bg-primary/30 blur-xl rounded-full" />
            </div>
            <span className="text-2xl font-bold gradient-text">Alchify</span>
          </a>
          
          {/* Auth Card */}
          <div className="bg-card/50 backdrop-blur-xl border border-border rounded-2xl p-8 shadow-2xl">
            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold text-foreground mb-2">
                {forgotMode ? 'Reset your password' : isLogin ? 'Welcome back' : 'Create your account'}
              </h1>
              <p className="text-muted-foreground">
                {forgotMode
                  ? 'Enter your email and we\'ll send you a reset link'
                  : isLogin 
                    ? 'Sign in to continue refining your content' 
                    : 'Start transforming your content with AI'}
              </p>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && !forgotMode && (
                <div className="space-y-2">
                  <Label htmlFor="displayName" className="text-foreground">Display Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="displayName"
                      type="text"
                      placeholder="Your name"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="pl-10 bg-background/50 border-border"
                    />
                  </div>
                </div>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="email" className="text-foreground">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setErrors(prev => ({ ...prev, email: undefined }));
                    }}
                    className="pl-10 bg-background/50 border-border"
                  />
                </div>
                {errors.email && (
                  <p className="text-sm text-destructive">{errors.email}</p>
                )}
              </div>
              
              {!forgotMode && (
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-foreground">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        setErrors(prev => ({ ...prev, password: undefined }));
                      }}
                      className="pl-10 pr-10 bg-background/50 border-border"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-sm text-destructive">{errors.password}</p>
                  )}
                  {isLogin && (
                    <button
                      type="button"
                      onClick={() => {
                        setForgotMode(true);
                        setErrors({});
                      }}
                      className="text-sm text-primary hover:underline"
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
              )}
              
              <Button 
                type="submit" 
                variant="hero" 
                className="w-full"
                disabled={isSubmitting || sendingReset}
              >
                {(isSubmitting || sendingReset) ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                {forgotMode ? 'Send Reset Link' : isLogin ? 'Sign In' : 'Create Account'}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </form>
            
            <div className="mt-6 text-center">
              <p className="text-muted-foreground">
                {forgotMode ? (
                  <button
                    type="button"
                    onClick={() => {
                      setForgotMode(false);
                      setErrors({});
                    }}
                    className="text-primary hover:underline font-medium"
                  >
                    ← Back to sign in
                  </button>
                ) : (
                  <>
                    {isLogin ? "Don't have an account?" : 'Already have an account?'}
                    <button
                      type="button"
                      onClick={() => {
                        setIsLogin(!isLogin);
                        setErrors({});
                      }}
                      className="ml-2 text-primary hover:underline font-medium"
                    >
                      {isLogin ? 'Sign up' : 'Sign in'}
                    </button>
                  </>
                )}
              </p>
            </div>
          </div>
          
          <p className="text-center text-muted-foreground text-sm mt-6">
            By continuing, you agree to Alchify's Terms of Service and Privacy Policy.
          </p>
        </div>
      </div>
    </>
  );
};

export default Auth;

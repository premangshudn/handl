import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader2, ArrowLeft, KeyRound, Mail, Lock, ShieldCheck, Eye, EyeOff } from 'lucide-react';

interface AuthProps {
  mode?: 'auth' | 'reset';
  onResetSuccess?: () => void;
}

type ViewState = 'login' | 'register' | 'forgot';

export function Auth({ mode = 'auth', onResetSuccess }: AuthProps) {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [view, setView] = useState<ViewState>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Real-time password rules validation
  const isMinLength = password.length >= 8;
  const hasNumber = /\d/.test(password);
  const hasUppercase = /[A-Z]/.test(password);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  const isPasswordValid = isMinLength && hasNumber && hasUppercase && hasSpecial;

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (mode === 'reset') {
        // Password Reset flow
        if (password !== confirmPassword) {
          throw new Error('Passwords do not match');
        }
        if (!isPasswordValid) {
          throw new Error('Password does not meet the safety requirements');
        }

        const { error } = await supabase.auth.updateUser({
          password: password,
        });
        if (error) throw error;

        toast.success('Password updated successfully! Welcome back.');
        if (onResetSuccess) onResetSuccess();
      } else if (view === 'forgot') {
        // Forgot Password link email trigger
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}`,
        });
        if (error) throw error;

        toast.success('Reset email sent! Please check your inbox for instructions.');
        setView('login');
      } else if (view === 'register') {
        // New Registration flow
        if (!isPasswordValid) {
          throw new Error('Password does not meet the safety requirements');
        }

        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        toast.success('Registration successful! Please check your email inbox to verify.');
      } else {
        // Standard Login flow
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        toast.success('Logged in successfully!');
      }
    } catch (error: any) {
      toast.error(error.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const getCardTitle = () => {
    if (mode === 'reset') return 'Set New Password';
    if (view === 'forgot') return 'Forgot Password';
    if (view === 'register') return 'Create an Account';
    return 'Welcome to Handl';
  };

  const getCardDescription = () => {
    if (mode === 'reset') return 'Choose a strong, complex password to secure your personal dashboard.';
    if (view === 'forgot') return "Enter your email below and we'll send you a recovery link.";
    if (view === 'register') return 'Sign up for a private, isolated personal focus space.';
    return 'Log in to manage your mindful personal workspace.';
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-md shadow-xl border rounded-2xl bg-card/80 backdrop-blur-sm">
        <CardHeader className="space-y-2 pb-6 border-b">
          <div className="flex justify-center pb-2">
            <div className="bg-primary/10 p-3 rounded-2xl border border-primary/20 text-primary animate-pulse">
              {mode === 'reset' ? <KeyRound className="h-6 w-6" /> : <ShieldCheck className="h-6 w-6" />}
            </div>
          </div>
          <CardTitle className="text-2xl font-extrabold tracking-tight text-center">
            {getCardTitle()}
          </CardTitle>
          <CardDescription className="text-center text-xs leading-normal">
            {getCardDescription()}
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleAuth}>
          <CardContent className="space-y-4 pt-6">
            
            {/* Email Field (Hidden in reset mode) */}
            {mode !== 'reset' && (
              <div className="space-y-2">
                <Label htmlFor="email" className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5 text-muted-foreground/60" />
                  Email Address
                </Label>
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="name@example.com" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="rounded-xl shadow-inner bg-background/50 focus:bg-background transition-all"
                  required 
                  disabled={loading}
                />
              </div>
            )}

            {/* Password Field (Hidden in forgot mode) */}
            {view !== 'forgot' && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <Lock className="h-3.5 w-3.5 text-muted-foreground/60" />
                    {mode === 'reset' ? 'New Password' : 'Password'}
                  </Label>
                  {/* Forgot Password trigger */}
                  {mode === 'auth' && view === 'login' && (
                    <button 
                      type="button" 
                      onClick={() => setView('forgot')}
                      className="text-xs text-primary font-semibold hover:underline"
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Input 
                    id="password" 
                    type={showPassword ? 'text' : 'password'} 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="rounded-xl pr-10 shadow-inner bg-background/50 focus:bg-background transition-all"
                    required 
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer focus:outline-none transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            )}

            {/* Confirm Password Field (Only shown in reset mode) */}
            {mode === 'reset' && (
              <div className="space-y-2 animate-in slide-in-from-top duration-300">
                <Label htmlFor="confirmPassword" className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Lock className="h-3.5 w-3.5 text-muted-foreground/60" />
                  Confirm New Password
                </Label>
                <div className="relative">
                  <Input 
                    id="confirmPassword" 
                    type={showConfirmPassword ? 'text' : 'password'} 
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="rounded-xl pr-10 shadow-inner bg-background/50 focus:bg-background transition-all"
                    required 
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer focus:outline-none transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            )}

            {/* Real-time Password Complexity Rules Indicator Panel */}
            {view !== 'forgot' && (view === 'register' || mode === 'reset') && password && (
              <div className="space-y-2 p-3 bg-muted/30 border rounded-xl animate-in fade-in duration-300 text-xs">
                <p className="font-bold text-[10px] uppercase tracking-wider text-muted-foreground">Password Safety Checklist:</p>
                <div className="grid grid-cols-2 gap-x-3 gap-y-1.5">
                  <div className={`flex items-center gap-1.5 font-medium transition-colors ${isMinLength ? 'text-green-600 dark:text-green-500' : 'text-muted-foreground'}`}>
                    <div className={`h-1.5 w-1.5 rounded-full ${isMinLength ? 'bg-green-500 animate-pulse' : 'bg-muted-foreground/30'}`} />
                    <span>At least 8 characters</span>
                  </div>
                  <div className={`flex items-center gap-1.5 font-medium transition-colors ${hasUppercase ? 'text-green-600 dark:text-green-500' : 'text-muted-foreground'}`}>
                    <div className={`h-1.5 w-1.5 rounded-full ${hasUppercase ? 'bg-green-500 animate-pulse' : 'bg-muted-foreground/30'}`} />
                    <span>At least 1 uppercase</span>
                  </div>
                  <div className={`flex items-center gap-1.5 font-medium transition-colors ${hasNumber ? 'text-green-600 dark:text-green-500' : 'text-muted-foreground'}`}>
                    <div className={`h-1.5 w-1.5 rounded-full ${hasNumber ? 'bg-green-500 animate-pulse' : 'bg-muted-foreground/30'}`} />
                    <span>At least 1 number</span>
                  </div>
                  <div className={`flex items-center gap-1.5 font-medium transition-colors ${hasSpecial ? 'text-green-600 dark:text-green-500' : 'text-muted-foreground'}`}>
                    <div className={`h-1.5 w-1.5 rounded-full ${hasSpecial ? 'bg-green-500 animate-pulse' : 'bg-muted-foreground/30'}`} />
                    <span>At least 1 special char</span>
                  </div>
                </div>
              </div>
            )}

          </CardContent>
          <CardFooter className="flex flex-col space-y-4 pt-2">
            <Button className="w-full rounded-xl font-bold py-2 shadow-md" type="submit" disabled={loading || (view !== 'forgot' && (view === 'register' || mode === 'reset') && !isPasswordValid)}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {mode === 'reset' ? 'Update Password' : view === 'forgot' ? 'Send Reset Link' : view === 'register' ? 'Register' : 'Login'}
            </Button>
            
            {/* View switching logic */}
            {mode === 'auth' && (
              <div className="text-xs text-center text-muted-foreground">
                {view === 'forgot' ? (
                  <button 
                    type="button" 
                    onClick={() => setView('login')} 
                    className="text-primary hover:underline font-bold flex items-center gap-1 mx-auto"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" /> Back to Sign In
                  </button>
                ) : view === 'register' ? (
                  <>
                    Already have an account?{' '}
                    <button 
                      type="button"
                      onClick={() => setView('login')}
                      className="text-primary hover:underline font-bold"
                    >
                      Sign In
                    </button>
                  </>
                ) : (
                  <>
                    Don't have an account?{' '}
                    <button 
                      type="button"
                      onClick={() => setView('register')}
                      className="text-primary hover:underline font-bold"
                    >
                      Create one
                    </button>
                  </>
                )}
              </div>
            )}
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}

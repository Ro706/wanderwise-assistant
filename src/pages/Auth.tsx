import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { toast } from 'sonner';
import { Plane, Mail, KeyRound, ArrowRight, Loader2 } from 'lucide-react';

type AuthMode = 'signin' | 'signup';
type AuthStep = 'email' | 'otp';

const Auth = () => {
  const [mode, setMode] = useState<AuthMode>('signin');
  const [step, setStep] = useState<AuthStep>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn, signUp, verifyOtp } = useAuth();
  const navigate = useNavigate();

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error('Please enter your email');
      return;
    }

    setLoading(true);
    const { error } = mode === 'signup' ? await signUp(email) : await signIn(email);
    setLoading(false);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success('OTP sent to your email!');
      setStep('otp');
    }
  };

  const handleVerifyOtp = async () => {
    if (otp.length !== 6) {
      toast.error('Please enter a valid 6-digit OTP');
      return;
    }

    setLoading(true);
    const { error } = await verifyOtp(email, otp);
    setLoading(false);

    if (error) {
      toast.error('Invalid or expired OTP. Please try again.');
    } else {
      toast.success('Successfully verified!');
      navigate('/language');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center gradient-hero p-4">
      {/* Decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-64 h-64 bg-primary/10 rounded-full blur-3xl animate-pulse-soft" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-pulse-soft" />
      </div>

      <Card className="w-full max-w-md shadow-elevated border-0 animate-scale-in relative overflow-hidden">
        {/* Header pattern */}
        <div className="absolute top-0 left-0 right-0 h-1 gradient-primary" />
        
        <CardHeader className="text-center pb-2">
          <div className="mx-auto w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center mb-4 shadow-glow-primary">
            <Plane className="w-8 h-8 text-primary-foreground" />
          </div>
          <CardTitle className="font-display text-2xl">
            {mode === 'signin' ? 'Welcome Back' : 'Create Account'}
          </CardTitle>
          <CardDescription>
            {step === 'email' 
              ? 'Enter your email to receive a one-time password'
              : 'Enter the 6-digit code sent to your email'}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {step === 'email' ? (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  type="email"
                  placeholder="agent@travelco.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-11 h-12"
                  autoFocus
                />
              </div>
              <Button 
                type="submit" 
                className="w-full h-12 gradient-primary text-primary-foreground font-medium"
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    Send OTP
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </>
                )}
              </Button>
            </form>
          ) : (
            <div className="space-y-6">
              <div className="flex flex-col items-center space-y-4">
                <div className="flex items-center gap-2 text-muted-foreground text-sm">
                  <KeyRound className="w-4 h-4" />
                  <span>Enter the code sent to {email}</span>
                </div>
                <InputOTP
                  maxLength={6}
                  value={otp}
                  onChange={(value) => setOtp(value)}
                >
                  <InputOTPGroup>
                    <InputOTPSlot index={0} className="w-12 h-14 text-xl" />
                    <InputOTPSlot index={1} className="w-12 h-14 text-xl" />
                    <InputOTPSlot index={2} className="w-12 h-14 text-xl" />
                    <InputOTPSlot index={3} className="w-12 h-14 text-xl" />
                    <InputOTPSlot index={4} className="w-12 h-14 text-xl" />
                    <InputOTPSlot index={5} className="w-12 h-14 text-xl" />
                  </InputOTPGroup>
                </InputOTP>
              </div>
              <Button 
                onClick={handleVerifyOtp}
                className="w-full h-12 gradient-primary text-primary-foreground font-medium"
                disabled={loading || otp.length !== 6}
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  'Verify & Continue'
                )}
              </Button>
              <div className="flex justify-center">
                <Button
                  variant="ghost"
                  onClick={() => {
                    setStep('email');
                    setOtp('');
                  }}
                  className="text-muted-foreground text-sm"
                >
                  Use different email
                </Button>
              </div>
            </div>
          )}

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">
                {mode === 'signin' ? "Don't have an account?" : 'Already have an account?'}
              </span>
            </div>
          </div>

          <Button
            variant="outline"
            className="w-full"
            onClick={() => {
              setMode(mode === 'signin' ? 'signup' : 'signin');
              setStep('email');
              setOtp('');
            }}
          >
            {mode === 'signin' ? 'Create Account' : 'Sign In'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
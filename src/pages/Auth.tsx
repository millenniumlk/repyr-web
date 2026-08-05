import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';

import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, Mail, Lock, User, Check, X } from 'lucide-react';
import googleLogo from '../assets/google.png';
import authBg from '../assets/auth-bg.jpg';
import { Button } from '../components/ui/Button';

const AnimatedInput = React.forwardRef<HTMLInputElement, any>(({ icon: Icon, rightAccessory, className = "", ...props }, ref) => {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <div className={`mb-3 relative transition-all duration-200 rounded-2xl border-[1.5px] bg-white flex items-center px-4 h-12
      ${isFocused ? 'border-primary shadow-[0_4px_12px_rgba(0,98,255,0.08)]' : 'border-gray-200'}
      ${className}
    `}>
      <Icon className={`w-5 h-5 mr-3 transition-colors duration-200 ${isFocused ? 'text-primary' : 'text-primary'}`} />
      <input
        ref={ref}
        onFocus={(e) => {
          setIsFocused(true);
          props.onFocus?.(e);
        }}
        onBlur={(e) => {
          setIsFocused(false);
          props.onBlur?.(e);
        }}
        className="flex-1 bg-transparent border-none outline-none text-gray-900 font-medium placeholder:text-gray-400 w-full h-full"
        {...props}
      />
      {rightAccessory && <div className="ml-2">{rightAccessory()}</div>}
    </div>
  );
});

const Auth = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const isSignUpParam = searchParams.get('signup') === 'true';
  const fromGuestChatParam = searchParams.get('fromGuestChat') === 'true';
  
  // Clear stale pending guest chat if we navigated here directly (not from the guest chat intercept overlay)
  const isFromGuestChat = useRef(location.state?.fromGuestChat || fromGuestChatParam);
  useEffect(() => {
    if (!isFromGuestChat.current) {
      localStorage.removeItem('pending_guest_chat');
    }
  }, []);
  
  const [isSignUp, setIsSignUp] = useState(location.state?.isSignUp || isSignUpParam || false);

  useEffect(() => {
    if (location.state?.isSignUp !== undefined) {
      setIsSignUp(location.state.isSignUp);
    } else if (isSignUpParam) {
      setIsSignUp(true);
    }
  }, [location.state?.isSignUp, isSignUpParam]);

  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [forgotStep, setForgotStep] = useState<'email' | 'otp' | 'new_password'>('email');
  
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  const maskEmail = (email: string) => {
    if (!email || !email.includes('@')) return email;
    const [username, domain] = email.split('@');
    if (username.length <= 3) return `${username[0]}****${username.slice(-1)}@${domain}`;
    return `${username[0]}****${username.slice(-2)}@${domain}`;
  };

  const handleToggleState = (newState: 'signup' | 'login' | 'forgot') => {
    setError(null);
    setSuccessMsg(null);
    if (newState === 'signup') {
      setIsSignUp(true);
      setIsForgotPassword(false);
    } else if (newState === 'login') {
      setIsSignUp(false);
      setIsForgotPassword(false);
    } else if (newState === 'forgot') {
      setIsForgotPassword(true);
    }
    
    setFullName('');
    setEmail('');
    setPassword('');
    setOtp('');
    setNewPassword('');
    setConfirmNewPassword('');
    setAcceptedTerms(false);
    setForgotStep('email');
  };

  const handleAuth = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!email || !password || (isSignUp && (!fullName || !acceptedTerms))) {
      setError('Please fill in all fields and accept the terms');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({ 
          email, 
          password,
          options: { data: { full_name: fullName } } 
        });
        if (error) throw error;
        if (data.session) {
          // If they came from the guest chat intercept, collect the remaining vehicle
          // details (fuel type, transmission, location) before starting the session.
          navigate(isFromGuestChat.current ? '/complete-profile' : '/');
        } else {
          localStorage.removeItem('diagnostics_run_count');
          setSuccessMsg('Account created successfully! Please log in.');
          handleToggleState('login');
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate('/');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!email) return setError('Please enter your email to receive an OTP.');
    
    setLoading(true);
    setError(null);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) throw error;
      setForgotStep('otp');
      setSuccessMsg('OTP sent to your inbox.');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (otp.length !== 6) return setError('Please enter the full 6-digit OTP.');
    
    setLoading(true);
    setError(null);
    try {
      const { error } = await supabase.auth.verifyOtp({ email, token: otp, type: 'recovery' });
      if (error) throw error;
      setForgotStep('new_password');
      setSuccessMsg(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newPassword || !confirmNewPassword) return setError('Please fill in all password fields.');
    if (newPassword !== confirmNewPassword) return setError('Passwords do not match.');
    
    setLoading(true);
    setError(null);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      await supabase.auth.signOut();
      setSuccessMsg('Password has been reset successfully. Please log in.');
      handleToggleState('login');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({ 
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
          queryParams: {
            prompt: 'consent'
          }
        }
      });
      if (error) throw error;
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (val: string, index: number) => {
    const cleanVal = val.replace(/[^0-9]/g, '');
    let newOtp = otp.split('');
    
    if (cleanVal.length > 1) {
      const pasted = cleanVal.slice(0, 6);
      setOtp(pasted);
      if (pasted.length < 6) otpRefs.current[pasted.length]?.focus();
      return;
    }

    if (cleanVal) {
      newOtp[index] = cleanVal;
      setOtp(newOtp.join(''));
      if (index < 5) otpRefs.current[index + 1]?.focus();
    } else {
      newOtp[index] = '';
      setOtp(newOtp.join(''));
    }
  };

  const handleOtpKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const isFormIncomplete = isForgotPassword 
    ? (forgotStep === 'otp' ? otp.length !== 6 : forgotStep === 'new_password' ? !newPassword || !confirmNewPassword : !email)
    : isSignUp 
        ? !email || !password || !fullName || !acceptedTerms
        : !email || !password;

  return (
    <div className="h-[100dvh] overflow-hidden bg-background flex flex-col md:items-center md:justify-center relative font-sans">
      
      {/* Desktop Background Image */}
      <div className="hidden md:block absolute inset-0 bg-cover bg-center z-0" style={{ backgroundImage: `url(${authBg})` }} />

      {/* Desktop Overlay */}
      <div className="hidden md:block absolute inset-0 bg-black/50 backdrop-blur-sm z-0"></div>
      
      {/* Top Right Close/Skip Button */}
      <div className="absolute top-6 right-6 z-50">
        <Button 
          variant="ghost"
          size="icon"
          onClick={() => {
            if (isForgotPassword) {
              if (forgotStep === 'new_password' || forgotStep === 'otp') {
                setForgotStep('email');
                setOtp('');
                setNewPassword('');
                setConfirmNewPassword('');
              } else {
                handleToggleState(isSignUp ? 'signup' : 'login');
              }
            } else {
              navigate('/guest-intake');
            }
          }}
          className="hover:bg-gray-200/50 md:bg-white/10 md:hover:bg-white/20 md:backdrop-blur-md transition-colors"
        >
          <X className="w-6 h-6 text-primary md:text-white" strokeWidth={2.5} />
        </Button>
      </div>

      <div className="flex-1 md:flex-none w-full max-w-md px-8 py-8 mt-8 md:mt-0 md:bg-white md:shadow-2xl md:rounded-[32px] flex flex-col justify-center relative z-10 overflow-y-auto no-scrollbar max-h-[100dvh] md:max-h-[90dvh]">
        <AnimatePresence mode="wait">
          <motion.div 
            key={isForgotPassword ? `forgot-${forgotStep}` : isSignUp ? 'signup' : 'login'}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            
            <div className="mb-6 text-center">
              <h1 className="text-3xl font-black text-black tracking-tighter leading-tight mb-2">
                {isForgotPassword 
                  ? (forgotStep === 'otp' ? "Check your inbox" : forgotStep === 'new_password' ? "New Password" : "Reset Password") 
                  : isSignUp ? "Create Account" : "Welcome back"}
              </h1>
              {isForgotPassword && (
                <p className="text-sm font-medium text-gray-500 tracking-wide px-4 mt-1">
                  {forgotStep === 'otp' 
                      ? `We sent a secure 6-digit code to ${maskEmail(email)}.`
                      : forgotStep === 'new_password'
                      ? "Create a new strong password for your account."
                      : "Enter your email address to receive a secure password reset code."}
                </p>
              )}
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 text-sm font-medium p-3 rounded-xl mb-4 border border-red-100 text-center">
                {error}
              </div>
            )}
            {successMsg && (
              <div className="bg-blue-50 text-blue-600 text-sm font-medium p-3 rounded-xl mb-4 border border-blue-100 text-center">
                {successMsg}
              </div>
            )}

            <form onSubmit={(e) => {
              e.preventDefault();
              if (isForgotPassword) {
                if (forgotStep === 'otp') handleVerifyOtp();
                else if (forgotStep === 'new_password') handleUpdatePassword();
                else handleResetPassword();
              } else {
                handleAuth();
              }
            }}>
              
              {!isForgotPassword && isSignUp && (
                <AnimatedInput
                  icon={User}
                  value={fullName}
                  onChange={(e: any) => setFullName(e.target.value)}
                  placeholder="Full Name"
                  type="text"
                />
              )}

              {isForgotPassword && forgotStep === 'otp' ? (
                <div className="flex justify-between w-full mb-6 mt-2 gap-2">
                  {[0, 1, 2, 3, 4, 5].map((index) => {
                    const isActive = otp.length === index || (otp.length === 6 && index === 5);
                    return (
                      <input
                        key={index}
                        ref={(el) => { otpRefs.current[index] = el; }}
                        value={otp.charAt(index)}
                        onChange={(e) => handleOtpChange(e.target.value, index)}
                        onKeyDown={(e) => handleOtpKeyDown(e, index)}
                        type="text"
                        inputMode="numeric"
                        maxLength={6}
                        autoFocus={index === 0}
                        className={`w-full aspect-[4/5] rounded-xl text-center text-xl font-bold border-2 transition-all outline-none ${
                          isActive ? 'border-primary bg-white shadow-sm text-primary' : 'border-gray-200 bg-gray-50 text-gray-900'
                        }`}
                      />
                    );
                  })}
                </div>
              ) : isForgotPassword && forgotStep === 'new_password' ? (
                <>
                  <AnimatedInput
                    icon={Lock}
                    value={newPassword}
                    onChange={(e: any) => setNewPassword(e.target.value)}
                    placeholder="New Password"
                    type={showPassword ? "text" : "password"}
                    rightAccessory={() => newPassword.length > 0 && (
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="p-1 text-primary">
                        {showPassword ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                      </button>
                    )}
                  />
                  <AnimatedInput
                    icon={Lock}
                    value={confirmNewPassword}
                    onChange={(e: any) => setConfirmNewPassword(e.target.value)}
                    placeholder="Confirm New Password"
                    type={showPassword ? "text" : "password"}
                  />
                </>
              ) : (
                <AnimatedInput
                  icon={Mail}
                  value={email}
                  onChange={(e: any) => setEmail(e.target.value)}
                  placeholder="Email Address"
                  type="email"
                />
              )}

              {!isForgotPassword && (
                <AnimatedInput
                  icon={Lock}
                  value={password}
                  onChange={(e: any) => setPassword(e.target.value)}
                  placeholder="Password"
                  type={showPassword ? "text" : "password"}
                  rightAccessory={() => password.length > 0 && (
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="p-1 text-primary">
                      {showPassword ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                    </button>
                  )}
                />
              )}

              {!isSignUp && !isForgotPassword && (
                <div className="flex justify-end pb-4 pt-1">
                  <Button variant="link" size="sm" type="button" onClick={() => handleToggleState('forgot')} className="h-auto p-0 text-sm">
                    Forgot password?
                  </Button>
                </div>
              )}

              {isSignUp && (
                <div className="flex items-center mt-1 mb-4 px-1">
                  <button
                    type="button"
                    onClick={() => setAcceptedTerms(!acceptedTerms)}
                    className={`mr-3 w-5 h-5 rounded flex items-center justify-center border transition-colors ${
                      acceptedTerms ? 'bg-primary border-primary' : 'bg-white border-gray-300'
                    }`}
                  >
                    {acceptedTerms && <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />}
                  </button>
                  <p className="text-gray-600 text-sm flex-1 font-medium">
                    I agree to the <span className="text-primary font-semibold">Terms & Conditions</span> and <span className="text-primary font-semibold">Privacy Policy</span>
                  </p>
                </div>
              )}

              {isForgotPassword && <div className="h-4" />}

              <Button
                type="submit"
                disabled={isFormIncomplete}
                isLoading={loading}
                className="w-full mt-1"
              >
                {isForgotPassword 
                  ? (forgotStep === 'otp' ? 'Verify OTP' : forgotStep === 'new_password' ? 'Update Password' : 'Send OTP') 
                  : isSignUp ? 'Sign Up' : 'Log In'}
              </Button>
            </form>

            {!isForgotPassword && (
              <>
                <div className="flex items-center my-6">
                  <div className="flex-1 h-[1px] bg-gray-200" />
                  <span className="mx-4 text-gray-400 text-[11px] font-bold uppercase tracking-widest">OR</span>
                  <div className="flex-1 h-[1px] bg-gray-200" />
                </div>

                <Button 
                  type="button"
                  variant="outline"
                  onClick={handleGoogleSignIn}
                  className="w-full mb-4 font-medium shadow-[0_2px_10px_rgba(0,0,0,0.04)]"
                >
                  <img src={googleLogo} alt="Google" className="w-[22px] h-[22px] mr-2.5" onError={(e) => { e.currentTarget.hidden = true; }} />
                  Continue with Google
                </Button>

                <div className="flex justify-center items-center mt-4">
                  <span className="text-gray-900 font-medium text-[15px]">
                    {isSignUp ? "Already have an account? " : "Don't have an account? "}
                  </span>
                  <Button 
                    variant="link"
                    size="sm"
                    onClick={() => handleToggleState(isSignUp ? 'login' : 'signup')}
                    className="h-auto p-0 text-[15px] ml-1"
                  >
                    {isSignUp ? "Log In" : "Sign Up"}
                  </Button>
                </div>
              </>
            )}

          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Auth;

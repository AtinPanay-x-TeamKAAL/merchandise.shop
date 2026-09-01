import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  X, 
  User, 
  Mail, 
  Lock, 
  Phone, 
  Eye, 
  EyeOff, 
  Sparkles, 
  KeyRound, 
  CheckCircle2, 
  ArrowRight,
  ShieldCheck
} from 'lucide-react';

interface CustomerAuthModalProps {
  initialTab?: 'login' | 'register' | 'forgot';
  returnToCheckout?: boolean;
}

export const CustomerAuthModal: React.FC<CustomerAuthModalProps> = ({ 
  initialTab = 'login',
  returnToCheckout = false 
}) => {
  const { 
    closeModal, 
    loginCustomer, 
    registerCustomer, 
    verifyCustomerEmail, 
    openModal,
    addToast 
  } = useApp();

  const [activeTab, setActiveTab] = useState<'login' | 'register' | 'verify' | 'forgot'>(initialTab);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Registration form
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [facebookName, setFacebookName] = useState('');
  const [password, setPassword] = useState('');

  // Verification
  const [verificationCode, setVerificationCode] = useState('');
  const [unverifiedEmail, setUnverifiedEmail] = useState('');
  const [generatedCodeNotice, setGeneratedCodeNotice] = useState('');

  // Forgot password
  const [resetEmail, setResetEmail] = useState('');
  const [resetSubmitted, setResetSubmitted] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      addToast('error', 'Required Fields', 'Please input your registered email and password.');
      return;
    }

    try {
      setLoading(true);
      await loginCustomer(email.trim());
      closeModal();
      if (returnToCheckout) {
        openModal('checkout');
      }
    } catch (err: any) {
      addToast('error', 'Login Failed', err?.message || 'Invalid credentials. Please check or register.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !email.trim() || !mobileNumber.trim() || !password.trim()) {
      addToast('error', 'Missing Information', 'Full Name, Email, Mobile Number, and Password are required.');
      return;
    }

    try {
      setLoading(true);
      const res = await registerCustomer({
        fullName: fullName.trim(),
        email: email.trim(),
        mobileNumber: mobileNumber.trim(),
        facebookName: facebookName.trim(),
        password: password.trim()
      });

      setUnverifiedEmail(email.trim());
      setGeneratedCodeNotice(res.code);
      setActiveTab('verify');
    } catch (err: any) {
      addToast('error', 'Registration Failed', err?.message || 'Could not register account.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verificationCode.trim()) {
      addToast('error', 'Input Code', 'Please enter the 6-digit verification code.');
      return;
    }

    try {
      setLoading(true);
      await verifyCustomerEmail(unverifiedEmail, verificationCode.trim());
      closeModal();
      if (returnToCheckout) {
        openModal('checkout');
      }
    } catch (err: any) {
      addToast('error', 'Verification Failed', err?.message || 'Invalid verification code.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail.trim()) {
      addToast('error', 'Input Email', 'Please enter your registered email address.');
      return;
    }
    setResetSubmitted(true);
    addToast('info', 'Password Reset Email Sent', `Password reset instructions dispatched to ${resetEmail}.`);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6">
      <div className="relative w-full max-w-md bg-[#0b0f19] border border-[#232f4b] rounded-2xl shadow-2xl overflow-hidden text-slate-100 flex flex-col">
        
        {/* Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#232f4b] bg-[#131b2e]/80">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#1e1b4b] border border-[#3b2b73] flex items-center justify-center">
              <User className="w-4 h-4 text-[#f472b6]" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">A'TIN Panay Customer Hub</h2>
              <p className="text-[11px] text-slate-400">Exclusive BlockScreening Merch Access</p>
            </div>
          </div>
          <button
            onClick={closeModal}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher (Login / Register) */}
        {activeTab !== 'verify' && activeTab !== 'forgot' && (
          <div className="grid grid-cols-2 border-b border-[#232f4b] bg-[#131b2e]/40 text-xs font-bold uppercase tracking-wider">
            <button
              type="button"
              onClick={() => setActiveTab('login')}
              className={`py-3 text-center transition-colors border-b-2 ${
                activeTab === 'login'
                  ? 'border-[#f472b6] text-white bg-[#1e1b4b]/40'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('register')}
              className={`py-3 text-center transition-colors border-b-2 ${
                activeTab === 'register'
                  ? 'border-[#f472b6] text-white bg-[#1e1b4b]/40'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              Create Account
            </button>
          </div>
        )}

        {/* Modal Body */}
        <div className="p-6 space-y-5">
          
          {/* TAB: LOGIN */}
          {activeTab === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="e.g. maria@gmail.com"
                    className="w-full pl-10 pr-3.5 py-2.5 bg-[#131b2e] border border-[#232f4b] rounded-xl text-sm text-white focus:border-[#7c5cb7] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-300">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => setActiveTab('forgot')}
                    className="text-[11px] text-[#f472b6] hover:underline font-semibold"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-10 py-2.5 bg-[#131b2e] border border-[#232f4b] rounded-xl text-sm text-white focus:border-[#7c5cb7] focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-[#7c5cb7] via-[#9381ff] to-[#f472b6] text-white font-bold text-sm shadow-lg shadow-[#7c5cb7]/30 hover:opacity-95 transition-all flex items-center justify-center gap-2"
              >
                <span>{loading ? 'Authenticating...' : 'Sign In to Portal'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="pt-2 text-center text-xs text-slate-400">
                Don't have an account yet?{' '}
                <button
                  type="button"
                  onClick={() => setActiveTab('register')}
                  className="text-[#b19cd9] font-bold hover:underline"
                >
                  Register now
                </button>
              </div>
            </form>
          )}

          {/* TAB: REGISTER */}
          {activeTab === 'register' && (
            <form onSubmit={handleRegister} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Full Name <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    placeholder="e.g. Maria Clara Santos"
                    className="w-full pl-10 pr-3.5 py-2 bg-[#131b2e] border border-[#232f4b] rounded-xl text-xs sm:text-sm text-white focus:border-[#7c5cb7] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Email Address <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="e.g. maria@gmail.com"
                    className="w-full pl-10 pr-3.5 py-2 bg-[#131b2e] border border-[#232f4b] rounded-xl text-xs sm:text-sm text-white focus:border-[#7c5cb7] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Mobile Number <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="tel"
                      required
                      value={mobileNumber}
                      onChange={e => setMobileNumber(e.target.value)}
                      placeholder="09171234567"
                      className="w-full pl-9 pr-3 py-2 bg-[#131b2e] border border-[#232f4b] rounded-xl text-xs text-white focus:border-[#7c5cb7] focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Facebook Name <span className="text-slate-500">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    value={facebookName}
                    onChange={e => setFacebookName(e.target.value)}
                    placeholder="Clara Perez"
                    className="w-full px-3 py-2 bg-[#131b2e] border border-[#232f4b] rounded-xl text-xs text-white focus:border-[#7c5cb7] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Password <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Minimum 6 characters"
                    className="w-full pl-10 pr-10 py-2 bg-[#131b2e] border border-[#232f4b] rounded-xl text-xs sm:text-sm text-white focus:border-[#7c5cb7] focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-[#1e1b4b]/60 border border-[#3b2b73] text-[11px] text-slate-300 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>An email verification code will be generated upon registration.</span>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-[#7c5cb7] to-[#9381ff] text-white font-bold text-sm shadow-lg shadow-[#7c5cb7]/30 hover:opacity-95 transition-all flex items-center justify-center gap-2"
              >
                <span>{loading ? 'Creating Account...' : 'Continue to Verification'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* TAB: VERIFY EMAIL */}
          {activeTab === 'verify' && (
            <form onSubmit={handleVerifyEmail} className="space-y-4">
              <div className="text-center space-y-2">
                <div className="w-12 h-12 rounded-full bg-[#1e1b4b] text-[#b19cd9] border border-[#3b2b73] flex items-center justify-center mx-auto">
                  <KeyRound className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-white">Email Verification Required</h3>
                <p className="text-xs text-slate-300">
                  We sent a 6-digit verification code to <strong>{unverifiedEmail}</strong>.
                </p>
                {generatedCodeNotice && (
                  <div className="p-2 rounded-lg bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs font-mono">
                    Simulation Code: <strong>{generatedCodeNotice}</strong>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1 text-center">
                  Enter 6-Digit Code
                </label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={verificationCode}
                  onChange={e => setVerificationCode(e.target.value)}
                  placeholder="e.g. 123456"
                  className="w-full text-center tracking-[0.4em] font-mono text-xl py-3 bg-[#131b2e] border border-[#232f4b] rounded-xl text-white focus:border-[#7c5cb7] focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-[#7c5cb7] via-[#9381ff] to-[#f472b6] text-white font-bold text-sm shadow-lg hover:opacity-95"
              >
                {loading ? 'Verifying...' : 'Verify & Unlock Account'}
              </button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setActiveTab('login')}
                  className="text-xs text-slate-400 hover:text-white"
                >
                  Back to Sign In
                </button>
              </div>
            </form>
          )}

          {/* TAB: FORGOT PASSWORD */}
          {activeTab === 'forgot' && (
            <div className="space-y-4">
              {resetSubmitted ? (
                <div className="text-center py-4 space-y-3">
                  <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
                  <h3 className="text-base font-bold text-white">Reset Link Sent</h3>
                  <p className="text-xs text-slate-300">
                    If an account exists for {resetEmail}, we've dispatched a recovery code to your inbox.
                  </p>
                  <button
                    type="button"
                    onClick={() => { setActiveTab('login'); setResetSubmitted(false); }}
                    className="px-4 py-2 rounded-xl bg-slate-800 text-xs font-semibold text-white hover:bg-slate-700"
                  >
                    Return to Sign In
                  </button>
                </div>
              ) : (
                <form onSubmit={handleForgotPassword} className="space-y-4">
                  <div className="text-center space-y-1">
                    <h3 className="text-base font-bold text-white">Reset Password</h3>
                    <p className="text-xs text-slate-400">
                      Enter your email to receive recovery instructions.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Account Email
                    </label>
                    <input
                      type="email"
                      required
                      value={resetEmail}
                      onChange={e => setResetEmail(e.target.value)}
                      placeholder="e.g. maria@gmail.com"
                      className="w-full px-3.5 py-2.5 bg-[#131b2e] border border-[#232f4b] rounded-xl text-sm text-white focus:border-[#7c5cb7] focus:outline-none"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-[#7c5cb7] to-[#9381ff] text-white font-bold text-sm shadow-md hover:opacity-95"
                  >
                    Send Reset Instructions
                  </button>

                  <div className="text-center">
                    <button
                      type="button"
                      onClick={() => setActiveTab('login')}
                      className="text-xs text-slate-400 hover:text-white"
                    >
                      Back to Sign In
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

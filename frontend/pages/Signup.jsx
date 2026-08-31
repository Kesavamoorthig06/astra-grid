import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { authUrl } from '../config/backends';

export default function Signup() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [showVerification, setShowVerification] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const navigate = useNavigate();

  // Cookie helper functions
  const setCookie = (name, value, days) => {
    const expires = new Date();
    expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
    document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;SameSite=Strict`;
  };

  const deleteCookie = (name) => {
    document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:01 GMT;path=/;SameSite=Strict`;
  };

  useEffect(() => {
    const user = localStorage.getItem('user');
    if (user) {
      navigate('/dashboard', { replace: true });
    }
  }, [navigate]);

  const handleSendVerification = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      const checkResponse = await fetch(authUrl('/auth/check-email'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email }),
      });

      const checkData = await checkResponse.json();

      if (checkData.exists) {
        setError('Email already registered. Please login.');
        setLoading(false);
        return;
      }

      const response = await fetch(authUrl('/auth/send-verification'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (data.success) {
        setShowVerification(true);
        setError('');
      } else {
        setError(data.error || 'Verification code send failed');
      }
    } catch (err) {
      setError('Connection error. Ensure backend is running on port 5001');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch(authUrl('/auth/verify-code'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, code: verificationCode }),
      });

      const data = await response.json();

      if (data.success) {
        setIsVerified(true);
        setError('');
        // Proceed to create account
        await handleSignup();
      } else {
        setError(data.error || 'Invalid verification code');
      }
    } catch (err) {
      setError('Connection error. Ensure backend is running on port 5001');
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async () => {
    try {
      const response = await fetch(authUrl('/auth/signup'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name, email, password, verified: true }),
      });

      const data = await response.json();

      if (data.success) {
        localStorage.setItem('user', JSON.stringify(data.user));
        localStorage.setItem('token', data.token);
        localStorage.setItem('isAuthenticated', 'true');

        // Handle Remember Me
        if (rememberMe) {
          setCookie('rememberedEmail', email, 30); // 30 days
          setCookie('rememberedPassword', btoa(password), 30); // Encode to base64
        } else {
          deleteCookie('rememberedEmail');
          deleteCookie('rememberedPassword');
        }

        navigate('/dashboard', { replace: true });
      } else {
        setError(data.error || 'Signup failed');
      }
    } catch (err) {
      setError('Connection error. Ensure backend is running on port 5001');
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-[#030b1f]">
      <div className="pointer-events-none absolute inset-0">
        <img 
          src="/cables_highlighted.jpg" 
          alt="High voltage transmission lines"
          loading="lazy"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-[#030b1f]/75" />
      </div>
      <div className="relative z-10 w-full max-w-md mx-4 bg-white rounded-xl shadow-xl overflow-hidden">
        <div className="p-8">
          <div className="flex justify-center mb-4">
            <div className="w-10 h-10 rounded-md bg-gray-200 flex items-center justify-center">◻</div>
          </div>

          <h2 className="text-center text-2xl font-semibold text-gray-900">
            {showVerification ? 'Verify Email' : 'Create Account'}
          </h2>
          <p className="text-center text-sm text-gray-500 mt-2">
            {showVerification ? 'Enter the verification code sent to your email' : 'Sign up to get started with ASTRA GRID'}
          </p>

          {!showVerification ? (
            <form className="mt-6 space-y-4" onSubmit={handleSendVerification}>
              <div>
                <label className="block text-sm text-gray-700 mb-1">Full Name</label>
                <input
                  type="text"
                  name="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoComplete="name"
                  required
                  className="w-full h-10 px-3 rounded-md border border-gray-200 bg-white text-sm outline-none focus:ring-2 focus:ring-slate-300"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-1">Email address</label>
                <input
                  type="email"
                  name="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="username email"
                  required
                  className="w-full h-10 px-3 rounded-md border border-gray-200 bg-white text-sm outline-none focus:ring-2 focus:ring-slate-300"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-1">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="new-password"
                    required
                    minLength={6}
                    className="w-full h-10 px-3 pr-10 rounded-md border border-gray-200 bg-white text-sm outline-none focus:ring-2 focus:ring-slate-300"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute inset-y-0 right-2 flex items-center text-gray-500 hover:text-gray-700"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-1">Confirm Password</label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    autoComplete="new-password"
                    required
                    minLength={6}
                    className="w-full h-10 px-3 pr-10 rounded-md border border-gray-200 bg-white text-sm outline-none focus:ring-2 focus:ring-slate-300"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                    className="absolute inset-y-0 right-2 flex items-center text-gray-500 hover:text-gray-700"
                    aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="remember-me-signup"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="remember-me-signup" className="ml-2 text-sm text-gray-700">
                  Remember me
                </label>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full h-10 bg-gray-800 text-white rounded-md shadow-md flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700 transition"
              >
                <span>{loading ? 'Sending...' : 'Send Verification Code'}</span>
              </button>
            </form>
          ) : (
            <form className="mt-6 space-y-4" onSubmit={handleVerifyCode}>
              <div>
                <label className="block text-sm text-gray-700 mb-1">Verification Code</label>
                <input
                  type="text"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  required
                  maxLength={6}
                  placeholder="Enter 6-digit code"
                  className="w-full h-10 px-3 rounded-md border border-gray-200 bg-white outline-none focus:ring-2 focus:ring-slate-300 text-center text-lg tracking-widest"
                />
              </div>

              <div className="text-xs text-gray-500 text-center">
                Code sent to: {email}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full h-10 bg-gray-800 text-white rounded-md shadow-md flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700 transition"
              >
                <span>{loading ? 'Verifying...' : 'Verify & Create Account'}</span>
              </button>

              <button
                type="button"
                onClick={() => setShowVerification(false)}
                className="w-full text-sm text-gray-600 hover:text-gray-800"
              >
                Change email or resend code
              </button>
            </form>
          )}

          <div className="mt-6 border-t pt-4 text-center text-sm text-gray-600">
            Already have an account? <Link to="/" className="text-blue-600 font-medium">Sign in</Link>
          </div>
        </div>

        <div className="bg-gray-50 px-8 py-3 text-center text-xs text-gray-500">Secured by <span className="font-semibold">MongoDB</span></div>
      </div>
    </div>
  );
}

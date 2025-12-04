import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Alert, AlertDescription, AlertTitle } from '../components/ui/alert';
import { RiErrorWarningFill } from '@remixicon/react';
import { Eye, EyeOff } from 'lucide-react';
import { AnimatePresence, motion as Motion } from 'framer-motion';
import { TextReveal } from '@/components/ui/text-reveal';
import { ShimmeringText } from '@/components/ui/shimmering-text';
import { useToast } from '@/hooks/use-toast';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [sloganPhase, setSloganPhase] = useState(0);
  const toast = useToast();
  const navigate = useNavigate();

  // Cookie helper functions
  const setCookie = (name, value, days) => {
    const expires = new Date();
    expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
    document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;SameSite=Strict`;
  };

  const getCookie = (name) => {
    const nameEQ = name + '=';
    const ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) === ' ') c = c.substring(1, c.length);
      if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
  };

  const deleteCookie = (name) => {
    document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:01 GMT;path=/;SameSite=Strict`;
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setSloganPhase((prev) => (prev === 0 ? 1 : 0));
    }, 4500);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // If already logged in, redirect to prediction
    const user = localStorage.getItem('user');
    if (user) {
      navigate('/prediction', { replace: true });
      return;
    }

    // Load saved credentials from cookies
    const savedEmail = getCookie('rememberedEmail');
    const savedPassword = getCookie('rememberedPassword');
    if (savedEmail && savedPassword) {
      setEmail(savedEmail);
      setPassword(atob(savedPassword)); // Decode from base64
      setRememberMe(true);
    }
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('http://localhost:5001/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (data.success) {
        // Store user data and token in localStorage
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

        const friendlyName = data.user?.name || data.user?.email?.split('@')[0] || 'operator';
        toast.add({
          title: 'Authenticated',
          description: `Welcome back, ${friendlyName}`,
          type: 'success',
        });
        // Redirect to prediction page and replace history
        navigate('/prediction', { replace: true });
      } else {
        setError(data.error || 'Login failed');
      }
    } catch (err) {
      setError('Connection error. Ensure backend is running on port 5001');
    } finally {
      setLoading(false);
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
      <div className="relative z-10 w-full max-w-sm mx-4 bg-white text-gray-900 backdrop-blur rounded-2xl shadow-2xl overflow-hidden">
        <div className="px-10 py-12 space-y-8">
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="flex items-center justify-center gap-2">
              <img src="/powergrid-logo.png" alt="PowerGrid" className="h-12 w-auto object-contain" />
              <span className="text-xl font-bold text-gray-400">×</span>
              <img src="/astragrid-logo.png" alt="Astra Grid" className="h-10 w-auto object-contain" />
            </div>
            <div className="h-12 overflow-hidden text-base font-medium text-gray-600">
              <AnimatePresence mode="wait">
                <Motion.div
                  key={sloganPhase}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.4 }}
                  className="flex justify-center">
                  <TextReveal
                    key={`slogan-${sloganPhase}`}
                    variant="blur"
                    startOnView={false}
                    once={false}
                    staggerDelay={0.05}
                    className="text-sm font-semibold text-gray-800"
                    wordLevel>
                    {sloganPhase === 0 ? 'We Read The Signs' : 'You Hit Lines'}
                  </TextReveal>
                </Motion.div>
              </AnimatePresence>
            </div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-500" style={{ fontFamily: 'var(--font-sans)' }}>
              Sign in to your power grid dashboard
            </p>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm text-gray-700 mb-1">Email</label>
              <input
                type="email"
                name="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder=""
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
                  autoComplete="current-password"
                  placeholder=""
                  required
                  className="w-full h-10 px-3 rounded-md border border-gray-200 bg-white text-sm outline-none focus:ring-2 focus:ring-slate-300 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute inset-y-0 right-2 flex items-center text-gray-500 hover:text-gray-700"
                  aria-label={showPassword ? 'Hide' : 'Show'}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="remember-me"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="remember-me" className="ml-2 text-sm text-gray-700">
                Remember me
              </label>
            </div>

            {error && (
              <Alert variant="destructive" className="items-center gap-3 border-red-500">
                <RiErrorWarningFill className="h-5 w-5 text-red-600" aria-hidden />
                <div className="space-y-1">
                  <AlertTitle className="text-sm font-semibold text-red-800">Error</AlertTitle>
                  <AlertDescription className="text-sm text-red-700">{error}</AlertDescription>
                </div>
              </Alert>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full px-8 py-3 bg-white border border-gray-300 text-gray-900 rounded-lg font-semibold transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-60 hover:bg-gray-900 hover:text-white hover:border-gray-900 hover:shadow-lg shadow flex items-center justify-center gap-2"
            >
              <span>{loading ? 'Logging in...' : 'Login'}</span>
            </button>
          </form>
        </div>

        <div className="bg-gray-50/80 px-10 py-4 text-center text-xs text-gray-500">Secured by MongoDB</div>
      </div>
    </div>
  );
}

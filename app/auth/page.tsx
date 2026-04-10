'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FaEnvelope, FaLock, FaSpinner, FaArrowRight, FaUser,
    FaKey, FaShieldAlt, FaRedo, FaUtensils, FaTimes, FaInfoCircle
} from 'react-icons/fa';
import MathCaptcha from '@/components/auth/MathCaptcha';
import Link from 'next/link';

function AuthPageContent() {
    const [showOtp, setShowOtp] = useState(false);
    const [otpEmail, setOtpEmail] = useState('');

    // Login States
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    // Captcha validation states
    const [loginCaptchaValid, setLoginCaptchaValid] = useState(false);
    const [captchaKey, setCaptchaKey] = useState(0); // Used to force refresh captcha

    // OTP States
    const [otp, setOtp] = useState('');
    const [otpTimer, setOtpTimer] = useState(30);
    const [resendingOtp, setResendingOtp] = useState(false);

    const {
        login, googleSignIn, verifyOtp, resendOtp
    } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();

    useEffect(() => {
        const initialEmail = searchParams.get('email');
        if (initialEmail) {
            setOtpEmail(initialEmail);
            setShowOtp(true);
        }
    }, [searchParams]);

    const handleGoogleResponse = async (response: any) => {
        setIsLoading(true);
        setError('');
        try {
            const { getAdminDeviceInfo } = require('@/utils/device');
            const deviceInfo = getAdminDeviceInfo();
            
            await googleSignIn(response.credential, deviceInfo.deviceId, deviceInfo.deviceName);
            router.push('/admin/dashboard');
        } catch (err: any) {
            setError(err?.response?.data?.message || 'Google Sign-In failed');
            setIsLoading(false);
        }
    };

    useEffect(() => {
        // Initialize Google Identity Services
        const initializeGis = () => {
            if (typeof window !== 'undefined' && (window as any).google) {
                (window as any).google.accounts.id.initialize({
                    client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
                    callback: handleGoogleResponse,
                    auto_select: false,
                    cancel_on_tap_outside: true,
                });

                (window as any).google.accounts.id.renderButton(
                    document.getElementById('google-signin-button'),
                    { 
                        theme: 'outline', 
                        size: 'large', 
                        width: 400, // Fixed width for better layout consistency
                        text: 'signin_with',
                        shape: 'rectangular',
                        logo_alignment: 'left'
                    }
                );
            } else {
                // Retry if script not loaded yet
                setTimeout(initializeGis, 100);
            }
        };

        initializeGis();
    }, []);

    const handleGoogleSignInFallback = () => {
        // Fallback for direct click if needed (though GIS button handles itself)
        if ((window as any).google) {
            (window as any).google.accounts.id.prompt();
        }
    };

    const handleVerifyOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            await verifyOtp(otpEmail, otp);
            router.push('/admin/dashboard');
        } catch (err) {
            setIsLoading(false);
        }
    };

    const handleResendOtp = async () => {
        if (otpTimer > 0) return;
        setResendingOtp(true);
        try {
            await resendOtp(otpEmail);
            setOtpTimer(30);
        } catch (err) {
            // Handled in context
        } finally {
            setResendingOtp(false);
        }
    };

    const handleOtpChange = (value: string) => {
        setOtp(value.replace(/\D/g, '').slice(0, 6));
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!loginCaptchaValid) {
            setError('Please solve the math captcha correctly');
            return;
        }
        setIsLoading(true);
        setError('');
        try {
            const result = await login(email, password);
            if (result?.notVerified) {
                setOtpEmail(email);
                setShowOtp(true);
                setIsLoading(false);
            } else {
                router.push('/admin/dashboard');
            }
        } catch (err: any) {
            setError(err?.response?.data?.message || 'Login failed');
            setCaptchaKey(prev => prev + 1);
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-800 via-slate-900 to-indigo-900 relative overflow-hidden flex items-center justify-center p-4">
            {/* Animated Background Pattern */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute top-0 left-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '0s' }} />
                <div className="absolute top-1/4 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
                <div className="absolute bottom-0 left-1/3 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '4s' }} />
            </div>

            {/* Main Card - Single Centered Layout */}
            <div className="relative z-10 w-full max-w-max">
                <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl p-6 md:p-8 border border-white/20">
                    {/* Logo & Header */}
                    <div className="text-center mb-6">
                        <div className="w-14 h-14 bg-gradient-to-br from-indigo-600 to-blue-600 rounded-2xl flex items-center justify-center mx-auto shadow-lg mb-3">
                            <FaUtensils className="text-white text-xl" />
                        </div>
                        <h1 className="text-2xl font-bold text-slate-900 mb-1 tracking-tight">Digital<span className="text-indigo-600">Menu</span></h1>
                        <p className="text-slate-500 text-xs">Sign in to your account</p>
                    </div>

                    {/* Info Notice */}
                    <div className="mb-5 p-3 bg-indigo-50 border border-indigo-100 rounded-xl flex items-start gap-2">
                        <FaInfoCircle className="text-indigo-600 mt-0.5 shrink-0 text-xs" />
                        <p className="text-[11px] text-slate-600 font-medium leading-relaxed">
                            Email & Password login is only available if an administrator has set a password for you.
                        </p>
                    </div>

                    {/* Login Form */}
                    <form onSubmit={handleLogin} className="space-y-3">
                        <div className="relative group">
                            <FaEnvelope className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors text-sm" />
                            <input
                                type="email"
                                placeholder="Email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-10 pr-4 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all placeholder:text-slate-400"
                            />
                        </div>
                        <div className="relative group">
                            <FaLock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors text-sm" />
                            <input
                                type="password"
                                placeholder="Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-10 pr-4 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all placeholder:text-slate-400"
                            />
                        </div>

                        {error && <p className="text-red-500 text-xs text-center">{error}</p>}

                        <MathCaptcha key={`login-${captchaKey}`} onValidate={setLoginCaptchaValid} />

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-bold py-3 rounded-xl shadow-lg shadow-indigo-500/20 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 group text-sm"
                        >
                            {isLoading ? <FaSpinner className="animate-spin" /> : <>Sign In <FaArrowRight className="group-hover:translate-x-1 transition-transform text-xs" /></>}
                        </button>
                    </form>

                    {/* Divider */}
                    <div className="mt-5 flex items-center justify-between">
                        <hr className="w-full border-slate-200" />
                        <span className="p-2 text-slate-400 text-xs">or</span>
                        <hr className="w-full border-slate-200" />
                    </div>

                    {/* Google Sign In Button Container */}
                    <div id="google-signin-button" className="w-full mt-3 h-[44px]"></div>
                    
                    <p className="text-[10px] text-slate-400 text-center mt-2">
                        Managed securely by Google Identity Services
                    </p>

                    {/* Register Notice */}
                    <div className="mt-5 p-3 bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-100 rounded-xl flex items-start gap-2">
                        <FaInfoCircle className="text-indigo-600 mt-0.5 shrink-0 text-xs" />
                        <p className="text-[11px] text-slate-600 font-medium leading-relaxed">
                            New merchant? Registration is only available via Google Sign-in.
                        </p>
                    </div>

                    {/* Terms */}
                    <p className="text-[11px] text-slate-400 text-center mt-4 leading-relaxed">
                        By signing in, you agree to our{' '}
                        <Link href="/privacy-policy" className="text-indigo-600 hover:underline">Privacy Policy</Link>
                        {' '}and{' '}
                        <Link href="/terms-of-service" className="text-indigo-600 hover:underline">Terms of Service</Link>
                    </p>
                </div>

                {/* Back to Home */}
                <Link href="/" className="mt-4 text-white/80 hover:text-white transition-colors text-xs flex items-center justify-center gap-2">
                    <span>←</span>
                    <span>Back to website</span>
                </Link>
            </div>

            {/* OTP Overlay */}
            <AnimatePresence>
                {showOtp && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="fixed inset-0 z-[110] bg-white flex flex-col justify-center items-center p-6 md:p-12 text-center"
                    >
                        <button
                            onClick={() => setShowOtp(false)}
                            className="absolute top-6 right-6 text-slate-400 hover:text-slate-900 transition-colors"
                        >
                            <FaTimes size={24} />
                        </button>
                        <FaShieldAlt className="text-4xl md:text-5xl text-indigo-600 mb-6" />
                        <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2">Verify OTP</h2>
                        <p className="text-slate-500 mb-8 text-sm md:text-base">Code sent to {otpEmail}</p>

                        <form onSubmit={handleVerifyOtp} className="max-w-md w-full space-y-8">
                            <div className="flex flex-col gap-4">
                                <input
                                    type="text"
                                    value={otp}
                                    onChange={(e) => handleOtpChange(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-5 text-center text-3xl font-bold tracking-[1.2em] text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
                                    placeholder="000000"
                                    maxLength={6}
                                />
                                <p className="text-xs text-slate-400 font-medium">Please enter the numeric code precisely</p>
                            </div>
                            <button
                                type="submit"
                                disabled={isLoading || otp.length !== 6}
                                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2"
                            >
                                {isLoading ? <FaSpinner className="animate-spin" /> : "Verify & Continue"}
                            </button>

                            <div className="text-sm">
                                {otpTimer > 0 ? (
                                    <span className="text-slate-400">Resend in {otpTimer}s</span>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={handleResendOtp}
                                        disabled={resendingOtp}
                                        className="text-indigo-600 font-bold hover:underline flex items-center gap-2 mx-auto"
                                    >
                                        {resendingOtp ? <FaSpinner className="animate-spin" /> : <FaRedo size={12} />} Resend Code
                                    </button>
                                )}
                            </div>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

export default function AuthPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <FaSpinner className="w-8 h-8 animate-spin text-indigo-600" />
            </div>
        }>
            <AuthPageContent />
        </Suspense>
    );
}

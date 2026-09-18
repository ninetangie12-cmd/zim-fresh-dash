import React, { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  Lock,
  Mail,
  Phone,
  ShieldCheck,
  Smartphone,
  Sparkles,
  User,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { brand } from "@/config/brand";
import { useApp } from "@/lib/app-state";

const DISMISS_KEY = "tenganow.auth_modal_dismissed";
const DISMISS_TIMEOUT_MS = 24 * 60 * 60 * 1000; // 24 hours

export function AuthModal() {
  const { user, isAuthModalOpen, openAuthModal, closeAuthModal, simulateSignIn } = useApp();
  
  // Two-step flow: "phone" (or email) -> "otp"
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [mode, setMode] = useState<"phone" | "email">("phone");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [formattedPhone, setFormattedPhone] = useState("");
  const [emailAddress, setEmailAddress] = useState("");
  const [fullName, setFullName] = useState("");

  // OTP State
  const [otp, setOtp] = useState<string[]>(["", "", "", ""]);
  const [countdown, setCountdown] = useState<number>(30);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [isVerified, setIsVerified] = useState<boolean>(false);
  const otpInputs = useRef<(HTMLInputElement | null)[]>([]);

  // Optional 6-second timer to prompt unauthenticated users once per session
  useEffect(() => {
    if (user || isAuthModalOpen) return;

    try {
      const dismissed = localStorage.getItem(DISMISS_KEY);
      if (dismissed) {
        const timePassed = Date.now() - Number(dismissed);
        if (timePassed < DISMISS_TIMEOUT_MS) return;
      }
    } catch {
      // ignore
    }

    const timer = setTimeout(() => {
      if (!user && !isAuthModalOpen) {
        openAuthModal();
      }
    }, 6000);

    return () => clearTimeout(timer);
  }, [user, isAuthModalOpen, openAuthModal]);

  // 30-Second Countdown Timer for OTP screen
  useEffect(() => {
    if (step !== "otp" || countdown <= 0) return;

    const timer = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [step, countdown]);

  // Reset OTP state when entering OTP step & auto-focus first box
  useEffect(() => {
    if (step === "otp") {
      setOtp(["", "", "", ""]);
      setIsVerifying(false);
      setIsVerified(false);
      setTimeout(() => {
        otpInputs.current[0]?.focus();
      }, 100);
    }
  }, [step]);

  if (!isAuthModalOpen || user) return null;

  const handleDismiss = () => {
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch {}
    setStep("phone");
    setIsVerified(false);
    setIsVerifying(false);
    closeAuthModal();
  };

  // Step 1: Phone or Email Submission
  const handleStep1Submit = (e: React.FormEvent) => {
    e.preventDefault();

    if (mode === "phone") {
      const cleaned = phoneNumber.replace(/\s+/g, "");
      if (!cleaned || cleaned.length < 7) {
        toast.error("Please enter a valid mobile phone number (e.g. 77 123 4567)");
        return;
      }
      const formatted = cleaned.startsWith("0") ? `+263 ${cleaned.slice(1)}` : `+263 ${cleaned}`;
      setFormattedPhone(formatted);
      setStep("otp");
      setCountdown(30);
      toast.info("SMS code sent! Use demo code 4821");
    } else {
      if (!emailAddress.includes("@") || !emailAddress.includes(".")) {
        toast.error("Please enter a valid email address");
        return;
      }
      setFormattedPhone(emailAddress.trim());
      setStep("otp");
      setCountdown(30);
      toast.info("Verification code sent! Use demo code 4821");
    }
  };

  // Trigger Verification (either automatically on 4th digit or button click)
  const handleVerifyOtp = (digits: string[]) => {
    const fullCode = digits.join("");
    if (fullCode.length < 4 || isVerifying || isVerified) return;

    setIsVerifying(true);

    // Simulate verification delay & green checkmark animation
    setTimeout(() => {
      setIsVerifying(false);
      setIsVerified(true);

      // Brief celebration before completing authentication & action fulfillment
      setTimeout(() => {
        simulateSignIn(formattedPhone, fullName.trim() || undefined);
        toast.success("Number verified! Welcome to TengaNow.");
        setStep("phone");
        setIsVerified(false);
      }, 700);
    }, 600);
  };

  // Handle single digit changes
  const handleOtpChange = (index: number, val: string) => {
    const char = val.slice(-1); // grab latest typed character
    if (char && !/^\d$/.test(char)) return; // numbers only

    const next = [...otp];
    next[index] = char;
    setOtp(next);

    // Auto-advance to next input
    if (char && index < 3) {
      otpInputs.current[index + 1]?.focus();
    }

    // Auto-verify if all 4 digits are entered
    if (char && index === 3 && next.every((d) => d !== "")) {
      handleVerifyOtp(next);
    }
  };

  // Handle Backspace navigation
  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      if (!otp[index] && index > 0) {
        otpInputs.current[index - 1]?.focus();
      }
    }
  };

  // Handle Auto-Paste of 4-digit code
  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 4);
    if (!pasted) return;

    const next = ["", "", "", ""];
    for (let i = 0; i < pasted.length; i++) {
      next[i] = pasted[i] || "";
    }
    setOtp(next);

    const targetFocus = Math.min(pasted.length, 3);
    otpInputs.current[targetFocus]?.focus();

    if (pasted.length === 4) {
      handleVerifyOtp(next);
    }
  };

  // Resend OTP
  const handleResend = () => {
    if (countdown > 0) return;
    setCountdown(30);
    setOtp(["", "", "", ""]);
    otpInputs.current[0]?.focus();
    toast.success("New 4-digit SMS OTP sent to " + formattedPhone);
  };

  const handleSocialAuth = (provider: "Google" | "Apple") => {
    const mockNames = {
      Google: "Tatenda Chidzero",
      Apple: "Rumbidzai Moyo",
    };
    const mockEmail = provider === "Google" ? "tatenda.chidzero@gmail.com" : "rumbidzai@icloud.com";
    simulateSignIn(mockEmail, mockNames[provider]);
    toast.success(`Signed in with ${provider}`);
  };

  const handleGuestContinue = () => {
    simulateSignIn("+263 77 000 1234", "Guest Shopper");
    toast.info("Continuing as guest. You can complete checkout anytime.");
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/65 p-0 backdrop-blur-sm transition-opacity duration-200 animate-in fade-in md:items-center md:p-4"
    >
      {/* Backdrop Click */}
      <div
        className="fixed inset-0"
        aria-hidden="true"
        onClick={handleDismiss}
      />

      {/* Sixty60-Inspired Modal Card (Slide-up on Mobile, Centered Card on Desktop) */}
      <div className="relative z-10 w-full max-w-md overflow-hidden rounded-t-3xl border border-border/80 bg-card p-6 shadow-2xl transition-all animate-in slide-in-from-bottom-6 md:rounded-3xl md:p-8">
        {/* Top Dismiss Button */}
        <button
          type="button"
          onClick={handleDismiss}
          aria-label="Dismiss and preview prices"
          className="absolute right-4 top-4 grid size-9 place-items-center rounded-full bg-mist/60 text-slate transition-colors hover:bg-mist hover:text-slate active:scale-95 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-botanical"
        >
          <X className="size-4.5" />
        </button>

        {/* -------------------------------- STEP 2: OTP VERIFICATION SCREEN -------------------------------- */}
        {step === "otp" ? (
          <div>
            {/* Top Navigation: Edit phone number */}
            <button
              type="button"
              onClick={() => setStep("phone")}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-botanical transition-colors hover:underline"
            >
              <ArrowLeft className="size-3.5" />
              <span>Edit phone number</span>
            </button>

            {/* Header */}
            <div className="mt-4 flex items-center gap-3">
              <div className="grid size-12 shrink-0 place-items-center rounded-2xl bg-botanical/10 text-botanical shadow-xs">
                <Smartphone className="size-6 text-botanical" />
              </div>
              <div>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700 dark:text-emerald-300">
                  <ShieldCheck className="size-3" /> SMS Verification
                </span>
                <h2
                  id="auth-modal-title"
                  className="font-heading text-lg font-black tracking-tight text-slate sm:text-xl"
                >
                  Verify Your Number
                </h2>
              </div>
            </div>

            {/* Subtitle */}
            <p className="mt-2.5 text-xs leading-relaxed text-slate-secondary sm:text-sm">
              Enter the 4-digit code sent via SMS to{" "}
              <strong className="text-slate font-bold">{formattedPhone}</strong>.
            </p>

            {/* 4-Digit Input Boxes */}
            <div className="my-6 flex items-center justify-center gap-3 sm:gap-4">
              {otp.map((digit, idx) => (
                <input
                  key={idx}
                  ref={(el) => {
                    otpInputs.current[idx] = el;
                  }}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={1}
                  value={digit}
                  disabled={isVerifying || isVerified}
                  onChange={(e) => handleOtpChange(idx, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                  onPaste={handleOtpPaste}
                  className={`size-13 sm:size-15 text-center font-heading text-2xl font-black rounded-2xl border bg-background shadow-xs transition-all outline-hidden tabular-nums ${
                    digit
                      ? "border-botanical text-botanical ring-2 ring-botanical/20"
                      : "border-border text-slate focus:border-botanical focus:ring-2 focus:ring-botanical/25"
                  }`}
                />
              ))}
            </div>

            {/* Success Verification Checkmark State */}
            {isVerified ? (
              <div className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 text-sm font-bold text-white shadow-md animate-in zoom-in-95 duration-200">
                <CheckCircle2 className="size-5" />
                <span>Verified! Signing you in...</span>
              </div>
            ) : (
              /* Action Button */
              <button
                type="button"
                disabled={otp.some((d) => !d) || isVerifying}
                onClick={() => handleVerifyOtp(otp)}
                className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-coral px-4 text-sm font-bold text-white shadow-md shadow-coral/25 transition-all duration-200 hover:scale-[1.01] hover:bg-coral-hover active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isVerifying ? (
                  <div className="flex items-center gap-2">
                    <span className="size-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    <span>Verifying Code...</span>
                  </div>
                ) : (
                  <span>Verify & Proceed</span>
                )}
              </button>
            )}

            {/* Resend Countdown Timer */}
            <div className="mt-4 text-center text-xs">
              {countdown > 0 ? (
                <span className="text-slate-muted font-medium">
                  Resend code in{" "}
                  <strong className="text-slate tabular-nums font-semibold">
                    0:{countdown < 10 ? `0${countdown}` : countdown}
                  </strong>
                </span>
              ) : (
                <button
                  type="button"
                  onClick={handleResend}
                  className="font-bold text-botanical hover:underline"
                >
                  Resend SMS OTP
                </button>
              )}
            </div>

            {/* Security Note */}
            <p className="mt-5 text-center text-[11px] text-slate-muted">
              🔒 Instant SMS token · Standard carrier rates may apply
            </p>
          </div>
        ) : (
          /* -------------------------------- STEP 1: PHONE / EMAIL SCREEN -------------------------------- */
          <div>
            {/* Brand/Security Header Icon */}
            <div className="flex items-center gap-3">
              <div className="grid size-12 shrink-0 place-items-center rounded-2xl bg-botanical/10 text-botanical shadow-xs">
                <Lock className="size-6 text-botanical" />
              </div>
              <div>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700 dark:text-emerald-300">
                  <Sparkles className="size-3" /> {brand.name} Express
                </span>
                <h2
                  id="auth-modal-title"
                  className="font-heading text-lg font-black tracking-tight text-slate sm:text-xl"
                >
                  Unlock Faster Delivery & Checkout
                </h2>
              </div>
            </div>

            {/* Subtitle */}
            <p className="mt-3 text-xs leading-relaxed text-slate-secondary sm:text-sm">
              Sign in or register to save your delivery address, track orders live, and pay bills in seconds.
            </p>

            {/* Phone / Email Toggle */}
            <div className="mt-5 grid grid-cols-2 rounded-xl bg-mist p-1 text-xs font-bold text-slate-muted">
              <button
                type="button"
                onClick={() => setMode("phone")}
                className={`flex items-center justify-center gap-1.5 rounded-lg py-2 transition-all ${
                  mode === "phone"
                    ? "bg-card text-slate shadow-xs"
                    : "text-slate-muted hover:text-slate"
                }`}
              >
                <Phone className="size-3.5" />
                <span>Mobile Phone</span>
              </button>
              <button
                type="button"
                onClick={() => setMode("email")}
                className={`flex items-center justify-center gap-1.5 rounded-lg py-2 transition-all ${
                  mode === "email"
                    ? "bg-card text-slate shadow-xs"
                    : "text-slate-muted hover:text-slate"
                }`}
              >
                <Mail className="size-3.5" />
                <span>Email Address</span>
              </button>
            </div>

            {/* Primary Auth Form */}
            <form onSubmit={handleStep1Submit} className="mt-4 space-y-3">
              {/* Optional Name */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-muted">
                  Full Name (Optional)
                </label>
                <div className="relative mt-1 flex items-center">
                  <User className="absolute left-3.5 size-4 text-slate-muted" />
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Farai Moyo"
                    className="w-full rounded-xl border border-border bg-background py-2.5 pl-10 pr-3 text-sm text-slate placeholder:text-slate-muted focus:border-botanical focus:outline-hidden focus:ring-1 focus:ring-botanical"
                  />
                </div>
              </div>

              {/* Primary Input */}
              {mode === "phone" ? (
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-muted">
                    Mobile Number
                  </label>
                  <div className="mt-1 flex rounded-xl border border-border bg-background focus-within:border-botanical focus-within:ring-1 focus-within:ring-botanical">
                    {/* Zimbabwe Country Code Prefix */}
                    <div className="flex items-center gap-1.5 border-r border-border bg-mist/50 px-3 py-2.5 text-xs font-bold text-slate">
                      <span>🇿🇼</span>
                      <span>+263</span>
                    </div>
                    <input
                      type="tel"
                      autoFocus
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="77 123 4567"
                      className="w-full bg-transparent px-3 py-2.5 text-sm font-semibold text-slate placeholder:text-slate-muted focus:outline-hidden"
                    />
                  </div>
                  <p className="mt-1 text-[11px] text-slate-muted">
                    Econet, NetOne, or Telecel mobile numbers supported
                  </p>
                </div>
              ) : (
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-muted">
                    Email Address
                  </label>
                  <div className="relative mt-1 flex items-center">
                    <Mail className="absolute left-3.5 size-4 text-slate-muted" />
                    <input
                      type="email"
                      autoFocus
                      value={emailAddress}
                      onChange={(e) => setEmailAddress(e.target.value)}
                      placeholder="name@example.com"
                      className="w-full rounded-xl border border-border bg-background py-2.5 pl-10 pr-3 text-sm text-slate placeholder:text-slate-muted focus:border-botanical focus:outline-hidden focus:ring-1 focus:ring-botanical"
                    />
                  </div>
                </div>
              )}

              {/* Primary Submit Button */}
              <button
                type="submit"
                className="mt-2 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-coral px-4 text-sm font-bold text-white shadow-md shadow-coral/25 transition-all duration-200 hover:scale-[1.01] hover:bg-coral-hover active:scale-[0.99] focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-coral"
              >
                <span>Continue with {mode === "phone" ? "Phone" : "Email"}</span>
              </button>
            </form>

            {/* Divider */}
            <div className="relative my-4 flex items-center justify-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border" />
              </div>
              <span className="relative bg-card px-3 text-[11px] font-medium uppercase tracking-wider text-slate-muted">
                or continue with
              </span>
            </div>

            {/* Quick Social & One-Tap Actions */}
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                {/* Google */}
                <button
                  type="button"
                  onClick={() => handleSocialAuth("Google")}
                  className="flex min-h-11 items-center justify-center gap-2 rounded-xl border border-border bg-background px-3 text-xs font-semibold text-slate transition-colors hover:border-slate/30 hover:bg-mist active:scale-[0.98]"
                >
                  <svg className="size-4" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>Google</span>
                </button>

                {/* Apple */}
                <button
                  type="button"
                  onClick={() => handleSocialAuth("Apple")}
                  className="flex min-h-11 items-center justify-center gap-2 rounded-xl border border-border bg-background px-3 text-xs font-semibold text-slate transition-colors hover:border-slate/30 hover:bg-mist active:scale-[0.98]"
                >
                  <svg className="size-4 fill-current" viewBox="0 0 170 170">
                    <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.69-3.04-7.67-7.81-11.96-14.31-6.19-9.35-11.05-19.8-14.58-31.34-3.53-11.54-5.3-22.39-5.3-32.55 0-14.3 3.65-26.04 10.95-35.21 7.3-9.17 16.29-13.86 26.96-14.07 5.14 0 10.74 1.34 16.8 4.02 6.06 2.68 10.05 4.08 11.96 4.2 2.24-.24 6.56-1.74 12.96-4.51 6.4-2.77 12.01-4.04 16.84-3.8 12.39.61 22.36 5.39 29.9 14.34-10.74 6.52-16 15.42-15.78 26.7.22 8.78 3.58 16.14 10.08 22.08 6.5 5.94 14.13 9.4 22.9 10.37-2.3 6.96-5.11 14.32-8.43 22.08zM119.22 33.72c0-7.39 2.64-14.28 7.92-20.67 5.28-6.39 11.83-10.42 19.64-12.1-.82 7.74-3.66 14.81-8.52 21.2-4.86 6.39-11.23 10.39-19.11 11.98-.22-.14-.3-.27-.24-.41h.31z" />
                  </svg>
                  <span>Apple</span>
                </button>
              </div>

              {/* One-Tap Guest Access */}
              <button
                type="button"
                onClick={handleGuestContinue}
                className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-mist/40 px-3 text-xs font-semibold text-slate-secondary transition-colors hover:bg-mist hover:text-slate active:scale-[0.98]"
              >
                <span>Continue as Guest (Preview Prices & Stock)</span>
              </button>
            </div>

            {/* Security / Privacy Assurance */}
            <p className="mt-4 text-center text-[11px] text-slate-muted">
              🔒 Secure authentication · No spam · Instant verification
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

"use client";

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useState } from "react";

import {
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";

import { auth } from "@/lib/firebase";

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError("");

    try {
      const provider = new GoogleAuthProvider();

      await signInWithPopup(auth, provider);

      // Pages that need a session send people here with ?next=; only a
      // same-site path is honoured so the parameter cannot bounce elsewhere.
      const next = new URLSearchParams(window.location.search).get("next") ?? "";
      router.push(next.startsWith("/") && !next.startsWith("//") ? next : "/teams");
    } catch (error) {
      console.error("Google login failed:", error);
      setError("Unable to sign in with Google. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[100vh] flex items-center justify-center bg-black relative overflow-hidden">
      {/* Animated Grid Background */}
      <div className="absolute inset-0 -z-10">
        <div className="h-[20px] w-[20px] bg-neon/10 -translate-x-1/2 -translate-y-1/2 animate-[moveGrid_10s_linear_infinite]"></div>
        <style jsx>{`
          @keyframes moveGrid {
            0% { background-position: 0 0; }
            100% { background-position: 20px 20px; }
          }
          .animate-moveGrid {
            background-image: repeating-linear-gradient(
              0deg,
              transparent,
              transparent 20px,
              rgba(66, 255, 90, 0.1) 20px,
              rgba(66, 255, 90, 0.1) 21px
            );
            background-size: 20px 20px;
          }
        `}</style>
      </div>

      {/* Subtle Glow Layer */}
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_center,var(--neon)_0%,transparent_70%)] opacity-10"></div>

      {/* Login Card */}
      <div className="relative z-10 flex w-[90%] max-w-md items-center justify-center p-6">
        <div className="w-full space-y-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-neon tracking-[0.05em]">
              HackGrid
            </h1>
            <p className="text-zinc-400 mt-2">
              Continue with Google to access your teams and auctions
            </p>
          </div>

          <div className="space-y-6">
            {/* Google Button */}
            <Button
              variant="google"
              size="lg"
              className="w-full flex items-center justify-center gap-3"
              onClick={handleGoogleLogin}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <svg
                    className="h-4 w-4 animate-spin"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 4v1m0 14v1m8-8h-1M5 12H4m14.95-4.95-.7.7M6.75 17.25l-.7.7m11.9 0-.7-.7M6.75 6.75l-.7-.7"
                    />
                  </svg>

                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <svg
                    className="h-4 w-4"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      fill="#4285F4"
                      d="M21.35 11.1h-9.18v3.55h5.27c-.23 1.18-.9 2.18-1.92 2.85v2.36h3.1c1.82-1.68 2.87-4.16 2.87-7.09 0-.69-.06-1.35-.14-1.67z"
                    />
                    <path
                      fill="#34A853"
                      d="M12.17 21.5c2.6 0 4.78-.86 6.37-2.32l-3.1-2.36c-.86.58-1.96.92-3.27.92-2.51 0-4.64-1.7-5.4-3.99H3.57v2.43a9.62 9.62 0 0 0 8.6 5.32z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M6.77 13.75a5.77 5.77 0 0 1 0-3.5V7.82H3.57a9.6 9.6 0 0 0 0 8.36l3.2-2.43z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12.17 6.26c1.42 0 2.69.49 3.69 1.45l2.77-2.77C16.95 3.42 14.77 2.5 12.17 2.5a9.62 9.62 0 0 0-8.6 5.32l3.2 2.43c.76-2.29 2.89-3.99 5.4-3.99z"
                    />
                  </svg>

                  <span>Continue with Google</span>
                </>
              )}
            </Button>

            {/* Error Message */}
            {error && (
              <p className="text-destructive text-sm text-center">
                {error}
              </p>
            )}
          </div>

          <div className="text-xs text-zinc-500 text-center">
            By continuing, you agree to our Terms of Service and Privacy Policy
          </div>
        </div>
      </div>
    </div>
  );
}
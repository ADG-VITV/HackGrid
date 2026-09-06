import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleLogin = async () => {
    // TODO: Connect Firebase Google Authentication
    setIsLoading(true);
    setError(null);

    // Simulate API call delay
    try {
      // In a real implementation, this would be:
      // const provider = new GoogleAuthProvider(auth);
      // await signInWithPopup(auth, provider);
      // Then on success:
      await new Promise(resolve => setTimeout(resolve, 1500));
      router.push("/teams");
    } catch (err) {
      setError("Authentication failed. Please try again.");
      console.error("Google login error:", err);
    } finally {
      setIsLoading(false);
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
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 014.582 9m0 0H9m11 11v-5h-.581m0 0a8.005 8.005 0 01-14.736-3m14.736 3a5.006 5.006 0 00-9.475-3.912m13.663 7.097a5.006 5.006 0 00-9.475 3.912M20.354 10.354a5.006 5.006 0 01-9.475-3.912m-3.122 6.242a5.006 5.006 0 00-9.475 3.912m9.475 3.912V16h-.581" />
                  </svg>
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.27h5.61c-.39 1.31-1.41 2.25-2.7 2.25-3.25 0-5.91-2.64-5.91-5.9s2.66-5.9 5.91-5.9c1.13 0 2.16.28 3.03.78l5.21-5.21C21.3 4.7 20.18 4 19 4c-4.52 0-8.19 3.66-8.19 8.19 0 1.24.13 2.45.38 3.58H6.27c-.45-1.1-.7-2.33-.7-3.66 0-2.76 1.99-5 4.5-5l-.42 2.07c-1.95.48-3.3 1.89-3.3 3.96 0 2.76 1.99 5 4.5 5l.42-2.07c1.38-.29 2.56-.82 3.39-1.47l2.2 2.2c-.86 1.03-1.59 2.18-2.03 3.42v2.06h3.64c.24-1.09.39-2.28.39-3.5z" />
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
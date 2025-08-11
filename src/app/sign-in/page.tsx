"use client";

import { useAuth } from "@/context/AuthContext";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { googleSignIn } from "../../../config/firebase";

export default function SignInPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) router.replace("/admin");
  }, [loading, user, router]);

  return (
    <div className="max-w-md mx-auto">
      <div className="neu p-6">
        <h1 className="text-xl font-semibold">Sign in</h1>
        <p className="text-sm muted-text mt-1">Use your Google account.</p>
        <button
          onClick={googleSignIn}
          className="mt-4 inline-flex items-center rounded-xl bg-primary text-primary-foreground px-4 py-2 font-medium active:scale-[.98]"
        >
          Continue with Google
        </button>
      </div>
    </div>
  );
}

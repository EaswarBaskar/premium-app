import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    // The publishable key is safe for browser use; the secret key is never exposed here.
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_PUBLISHABLE_KEY,
  },
};

export default nextConfig;

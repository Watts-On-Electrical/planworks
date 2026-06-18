/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // ESLint isn't configured yet; setting it up is a separate cleanup, so we
  // don't let it block Vercel builds for now. Revisit when we add tooling.
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Type errors now FAIL the build instead of shipping silently. The project
  // type-checks clean today, so this is a pure safety net: a future change that
  // breaks types gets caught here rather than reaching users.
  typescript: {
    ignoreBuildErrors: false,
  },
};

module.exports = nextConfig;

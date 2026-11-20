import type { NextConfig } from 'next';

const isGitHubPages = process.env.GITHUB_PAGES === 'true';

const nextConfig: NextConfig = {
  transpilePackages: ['@software-factory/shared'],
  ...(isGitHubPages
    ? {
        output: 'export',
        basePath: '/-software-factory',
        images: { unoptimized: true },
      }
    : {}),
  turbopack: {
    rules: {
      '*.css': {
        loaders: ['@tailwindcss/turbopack'],
        as: '*.css',
      },
    },
  },
};

export default nextConfig;

// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Memory optimization for low-RAM devices
config.transformer = {
  ...config.transformer,
  minifierConfig: {
    // Optimize for memory usage
    keep_fnames: false,
    mangle: {
      keep_fnames: false,
    },
    compress: {
      drop_console: true, // Remove console logs in production
      drop_debugger: true,
      pure_funcs: ['console.log', 'console.info', 'console.debug'],
    },
  },
};

// Optimize resolver for memory efficiency
config.resolver = {
  ...config.resolver,
  platforms: ['native', 'android', 'ios'],
  // Reduce memory usage by limiting asset extensions
  assetExts: [...config.resolver.assetExts.filter(ext => 
    ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'mp3', 'wav', 'mp4', 'mov', 'ttf', 'otf'].includes(ext)
  )],
};

// Memory optimization settings
config.maxWorkers = 2; // Limit workers to reduce memory usage
config.resetCache = false; // Don't reset cache unnecessarily

config.server = {
  ...config.server,
  enhanceMiddleware: (middleware) => {
    return (req, res, next) => {
      const url = new URL(req.url, 'http://localhost');
      if (url.pathname === '/_expo/loading') {
        const hasPlatform = url.searchParams.has('platform');
        const expoPlatformHeader = req.headers['expo-platform'];
        if (!hasPlatform && !expoPlatformHeader) {
          const agent = String(req.headers['user-agent'] || '').toLowerCase();
          const inferredPlatform = agent.includes('iphone') || agent.includes('ipad') || agent.includes('ios')
            ? 'ios'
            : 'android';
          url.searchParams.set('platform', inferredPlatform);
          res.writeHead(302, { Location: url.pathname + url.search });
          res.end();
          return;
        }
      }
      return middleware(req, res, next);
    };
  }
};

module.exports = config;

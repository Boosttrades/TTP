const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);
// Metro must bundle GLB files as assets so the city is available offline.
if (!config.resolver.assetExts.includes('glb')) {
  config.resolver.assetExts.push('glb');
}

module.exports = config;

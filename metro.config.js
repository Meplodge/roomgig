const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Add support for CommonJS modules in the new architecture
config.resolver.sourceExts = [...config.resolver.sourceExts, 'cjs'];

module.exports = config;

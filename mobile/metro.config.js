const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// The shared schemas package lives outside mobile/ — watch it so Metro bundles
// @plant-papa/schemas imports, and resolve its zod import to mobile's copy.
config.watchFolders = [...(config.watchFolders ?? []), path.resolve(__dirname, '../schemas')];
config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  zod: path.resolve(__dirname, 'node_modules/zod'),
};

module.exports = config;

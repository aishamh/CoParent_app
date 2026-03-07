const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const config = getDefaultConfig(__dirname);

// Allow importing from shared/ directory (parent project)
const sharedDir = path.resolve(__dirname, "../shared");
config.watchFolders = [sharedDir];
config.resolver.nodeModulesPaths = [
  path.resolve(__dirname, "node_modules"),
  path.resolve(__dirname, "../node_modules"),
];

module.exports = config;

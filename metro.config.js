const path = require('path');
const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

// Single lucide icons live outside the package "exports" map; resolve
// `lucide-react-native/icon/<name>` straight to its file (see app/components/icons.ts).
const LUCIDE_ICONS = path.join(__dirname, 'node_modules/lucide-react-native/dist/cjs/icons');

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */
const config = {
  resolver: {
    resolveRequest: (context, moduleName, platform) => {
      const icon = /^lucide-react-native\/icon\/([a-z0-9-]+)$/.exec(moduleName);
      if (icon) {
        return { type: 'sourceFile', filePath: path.join(LUCIDE_ICONS, `${icon[1]}.js`) };
      }
      return context.resolveRequest(context, moduleName, platform);
    },
  },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);

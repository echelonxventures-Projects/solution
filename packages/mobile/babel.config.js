module.exports = function (api) {
  api.cache(true)
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'module-resolver',
        {
          root: ['./'],
          extensions: ['.ios.ts', '.android.ts', '.ts', '.ios.tsx', '.android.tsx', '.tsx', '.js', '.jsx', '.json'],
          alias: {
            '@stores': './src/stores',
            '@contexts': './src/contexts',
            '@lib': './src/lib',
            '@screens': './src/screens',
            '@components': './src/components',
          },
        },
      ],
      'react-native-reanimated/plugin',
    ],
  }
}

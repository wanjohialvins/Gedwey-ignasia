const reanimatedPlugin = require('./node_modules/react-native-reanimated/plugin/index.js');
console.log('Reanimated Plugin Type:', typeof reanimatedPlugin);
console.log('Reanimated Plugin Keys:', Object.keys(reanimatedPlugin || {}));
console.log('Reanimated Plugin Value:', reanimatedPlugin);

try {
  const result = reanimatedPlugin();
  console.log('Plugin Function Result Type:', typeof result);
  console.log('Plugin Function Result Keys:', Object.keys(result || {}));
} catch (e) {
  console.error('Failed to run plugin function:', e);
}

console.log('\n--- Inspecting nativewind/babel ---');
try {
  const nativewindPlugin = require('nativewind/babel');
  console.log('Nativewind Plugin Type:', typeof nativewindPlugin);
  console.log('Nativewind Plugin Value:', nativewindPlugin);
  
  if (typeof nativewindPlugin === 'function') {
    const nwResult = nativewindPlugin({ cache: () => {} });
    console.log('Nativewind Function Result Type:', typeof nwResult);
    console.log('Nativewind Function Result Keys:', Object.keys(nwResult || {}));
    console.log('Nativewind Function Result Value:', nwResult);
  }
} catch (e) {
  console.error('Failed to inspect nativewind/babel:', e);
}


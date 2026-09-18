import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';

export default defineConfig([
  ...nextVitals,
  {
    rules: {
      // Existing interactive flows intentionally initialize browser capability state in effects.
      'react-hooks/set-state-in-effect': 'off',
      'react/no-unescaped-entities': 'off',
      '@next/next/no-img-element': 'off'
    }
  },
  globalIgnores(['.next/**', 'node_modules/**', '_preview/**']),
]);

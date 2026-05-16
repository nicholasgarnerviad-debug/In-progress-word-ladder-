import '@testing-library/jest-dom';
import 'fake-indexeddb/auto';

// Polyfill structuredClone for Node.js test environment
if (typeof structuredClone === 'undefined') {
  (global as any).structuredClone = (obj: any) => {
    return JSON.parse(JSON.stringify(obj));
  };
}

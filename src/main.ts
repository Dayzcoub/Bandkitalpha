import { createBandKitApp } from './app/App.js';

const root = document.getElementById('app');
if (!root) {
  throw new Error('BandKit root element was not found.');
}

createBandKitApp(root);

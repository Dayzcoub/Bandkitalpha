import { createBandKitApp } from './app/App.js';
import { initPlatformAdminConsole } from './modules/PlatformAdminConsole.js';
import { initPlatformAdminTrustDetails } from './modules/PlatformAdminTrustDetails.js';
import { initChatMessageControls } from './modules/ChatMessageControls.js';
import { initRealEntitiesPreview } from './modules/RealEntitiesPreview.js';

const root = document.getElementById('app');
if (!root) {
  throw new Error('BandKit root element was not found.');
}

createBandKitApp(root);
initPlatformAdminConsole(root);
initPlatformAdminTrustDetails(root);
initChatMessageControls(root);
initRealEntitiesPreview(root);

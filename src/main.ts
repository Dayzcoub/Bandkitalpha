import { createBandKitApp } from './app/App.js';
import { initPlatformAdminConsole } from './modules/PlatformAdminConsole.js';
import { initPlatformAdminReadOnlyDataBridge } from './modules/PlatformAdminReadOnlyDataBridge.js';
import { initPlatformAdminBillingReadOnlyBridge } from './modules/PlatformAdminBillingReadOnlyBridge.js';
import { initPlatformAdminContentReadOnlyBridge } from './modules/PlatformAdminContentReadOnlyBridge.js';
import { initPlatformAdminLocalizationReadOnlyBridge } from './modules/PlatformAdminLocalizationReadOnlyBridge.js';
import { initPlatformAdminNotificationsReadOnlyBridge } from './modules/PlatformAdminNotificationsReadOnlyBridge.js';
import { initPlatformAdminRolesReadOnlyBridge } from './modules/PlatformAdminRolesReadOnlyBridge.js';
import { initPlatformAdminSettingsReadOnlyBridge } from './modules/PlatformAdminSettingsReadOnlyBridge.js';
import { initChatMessageControls } from './modules/ChatMessageControls.js';
import { initChatEmptyStates } from './modules/ChatEmptyStates.js';
import { initRealEntitiesPreview } from './modules/RealEntitiesPreview.js';

type AppRootInitializer = (root: HTMLElement) => void;

const root = document.getElementById('app');
if (!root) {
  throw new Error('BandKit root element was not found.');
}

const platformAdminInitializers: AppRootInitializer[] = [
  initPlatformAdminConsole,
  initPlatformAdminReadOnlyDataBridge,
  initPlatformAdminBillingReadOnlyBridge,
  initPlatformAdminContentReadOnlyBridge,
  initPlatformAdminLocalizationReadOnlyBridge,
  initPlatformAdminNotificationsReadOnlyBridge,
  initPlatformAdminRolesReadOnlyBridge,
  initPlatformAdminSettingsReadOnlyBridge
];

createBandKitApp(root);
for (const initPlatformAdminModule of platformAdminInitializers) {
  initPlatformAdminModule(root);
}
initChatMessageControls(root);
initChatEmptyStates(root);
initRealEntitiesPreview(root);

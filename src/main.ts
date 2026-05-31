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
import { initRealEntitiesPreview } from './modules/RealEntitiesPreview.js';

const root = document.getElementById('app');
if (!root) {
  throw new Error('BandKit root element was not found.');
}

createBandKitApp(root);
initPlatformAdminConsole(root);
initPlatformAdminReadOnlyDataBridge(root);
initPlatformAdminBillingReadOnlyBridge(root);
initPlatformAdminContentReadOnlyBridge(root);
initPlatformAdminLocalizationReadOnlyBridge(root);
initPlatformAdminNotificationsReadOnlyBridge(root);
initPlatformAdminRolesReadOnlyBridge(root);
initPlatformAdminSettingsReadOnlyBridge(root);
initChatMessageControls(root);
initRealEntitiesPreview(root);

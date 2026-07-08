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
import { initChatPolicyDataset } from './modules/ChatPolicyDataset.js';
import { initChatComposerPlacement } from './modules/ChatComposerPlacement.js';
import { initRealEntitiesPreview } from './modules/RealEntitiesPreview.js';
import { initAuthClient, hydrateSessionState } from './modules/AuthClient.js';
import { initTwoFactor } from './modules/TwoFactor.js';
import { initRealEventCreate } from './modules/RealEventCreate.js';
import { initRealMemberAdd } from './modules/RealMemberAdd.js';
import { initRealProfessionsEditor } from './modules/RealProfessionsEditor.js';
import { initRealEventSlots } from './modules/RealEventSlots.js';
import { initRealEventEngagements } from './modules/RealEventEngagements.js';
import { initRealChat } from './modules/RealChat.js';

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

// Resolve the live session first so the very first render reflects real auth.
await hydrateSessionState();

createBandKitApp(root);
for (const initPlatformAdminModule of platformAdminInitializers) {
  initPlatformAdminModule(root);
}
initChatMessageControls(root);
initChatEmptyStates(root);
initChatPolicyDataset(root);
initChatComposerPlacement(root);
initRealEntitiesPreview(root);
initAuthClient(root);
initTwoFactor(root);
initRealEventCreate(root);
initRealMemberAdd(root);
initRealProfessionsEditor(root);
initRealEventSlots(root);
initRealEventEngagements(root);
initRealChat(root);

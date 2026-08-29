// FinTrack Subscription Module Entry Point
export { SubscriptionComponent } from './components/subscription.js';

export const closeUpgradeModal = () => {
  if (window.closeUpgradeModal) return window.closeUpgradeModal();
};

export const closeVIPModal = () => {
  if (window.closeVIPModal) return window.closeVIPModal();
};

export const switchVIPPaymentTab = (tabName) => {
  if (window.switchVIPPaymentTab) return window.switchVIPPaymentTab(tabName);
};

export const triggerVIPDemoPay = () => {
  if (window.triggerVIPDemoPay) return window.triggerVIPDemoPay();
};

export const handlePayVIPWithWallet = () => {
  if (window.handlePayVIPWithWallet) return window.handlePayVIPWithWallet();
};


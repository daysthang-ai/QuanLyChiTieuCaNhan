// FinTrack Subscription Module Entry Point
import { SubscriptionComponent, renderCurrentPlanBanner, scrollToPricingCards } from './components/subscription.js?v=20260907_01';

export { SubscriptionComponent, renderCurrentPlanBanner, scrollToPricingCards };

export const openUpgradeModal = (planId) => {
  if (window.fintrackSubscription?.openUpgradeModal) {
    return window.fintrackSubscription.openUpgradeModal(planId);
  }
  if (window.openUpgradeModal) {
    return window.openUpgradeModal(planId);
  }
};

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

export const demoSimulatePayment = () => {
  if (window.demoSimulatePayment) return window.demoSimulatePayment();
  if (window.triggerVIPDemoPay) return window.triggerVIPDemoPay();
};

export const handlePayVIPWithWallet = () => {
  if (window.handlePayVIPWithWallet) return window.handlePayVIPWithWallet();
};

// Global bindings for backward compatibility and inline onclick handlers
if (typeof window !== 'undefined') {
  window.renderCurrentPlanBanner = renderCurrentPlanBanner;
  window.scrollToPricingCards = scrollToPricingCards;
  window.openUpgradeModal = openUpgradeModal;
}



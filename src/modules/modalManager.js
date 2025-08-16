// Modal Manager Module
// Handles all modal functionality including alerts and confirmations

import * as DOM from './domElements.js';

// Initialize modal manager
export function initializeModalManager() {
    // No initialization needed for modals
}

// Show confirmation modal
export function showConfirm(message, onConfirm) {
    if (!DOM.confirmModal || !DOM.confirmMessage || !DOM.confirmYes || !DOM.confirmNo) {
        console.error('Modal elements not found');
        if (onConfirm) onConfirm();
        return;
    }
    
    DOM.confirmMessage.textContent = message;
    DOM.confirmModal.style.display = 'flex';
    
    // Simple event handling without cloning
    const handleConfirm = () => {
        DOM.confirmModal.style.display = 'none';
        if (onConfirm) onConfirm();
        // Remove event listeners
        DOM.confirmYes.removeEventListener('click', handleConfirm);
        DOM.confirmNo.removeEventListener('click', handleCancel);
    };
    
    const handleCancel = () => {
        DOM.confirmModal.style.display = 'none';
        // Remove event listeners
        DOM.confirmYes.removeEventListener('click', handleConfirm);
        DOM.confirmNo.removeEventListener('click', handleCancel);
    };
    
    // Add event listeners
    DOM.confirmYes.addEventListener('click', handleConfirm);
    DOM.confirmNo.addEventListener('click', handleCancel);
    
    // Close on overlay click
    const handleOverlayClick = (e) => {
        if (e.target === DOM.confirmModal) {
            DOM.confirmModal.style.display = 'none';
            // Remove event listeners
            DOM.confirmYes.removeEventListener('click', handleConfirm);
            DOM.confirmNo.removeEventListener('click', handleCancel);
            DOM.confirmModal.removeEventListener('click', handleOverlayClick);
        }
    };
    
    DOM.confirmModal.addEventListener('click', handleOverlayClick);
}

// Show alert modal
export function showAlert(message) {
    if (!DOM.alertModal || !DOM.alertMessage || !DOM.alertOk) {
        console.error('Alert modal elements not found');
        console.log('Alert message:', message);
        return;
    }
    
    DOM.alertMessage.textContent = message;
    DOM.alertModal.style.display = 'flex';
    
    // Simple approach - just add event listener without cloning
    const handleOkClick = () => {
        DOM.alertModal.style.display = 'none';
        DOM.alertOk.removeEventListener('click', handleOkClick);
    };
    
    DOM.alertOk.addEventListener('click', handleOkClick);
    
    // Close on overlay click
    const handleOverlayClick = (e) => {
        if (e.target === DOM.alertModal) {
            DOM.alertModal.style.display = 'none';
            DOM.alertModal.removeEventListener('click', handleOverlayClick);
        }
    };
    
    DOM.alertModal.addEventListener('click', handleOverlayClick);
}

// Custom confirmation modal function (legacy support)
export function confirmAction(message, callback) {
    showConfirm(message, callback);
} 
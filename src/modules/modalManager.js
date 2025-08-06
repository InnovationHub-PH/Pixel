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
    
    // Remove any existing event listeners
    const newConfirmYes = DOM.confirmYes.cloneNode(true);
    const newConfirmNo = DOM.confirmNo.cloneNode(true);
    DOM.confirmYes.parentNode.replaceChild(newConfirmYes, DOM.confirmYes);
    DOM.confirmNo.parentNode.replaceChild(newConfirmNo, DOM.confirmNo);
    
    // Add new event listeners
    newConfirmYes.onclick = function() {
        DOM.confirmModal.style.display = 'none';
        if (onConfirm) onConfirm();
    };
    
    newConfirmNo.onclick = function() {
        DOM.confirmModal.style.display = 'none';
    };
    
    // Close on overlay click
    DOM.confirmModal.addEventListener('click', (e) => {
        if (e.target === DOM.confirmModal) {
            DOM.confirmModal.style.display = 'none';
        }
    });
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
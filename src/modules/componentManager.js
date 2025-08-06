// Component Manager Module
// Handles component loading, placement, and management functionality

import * as DOM from './domElements.js';
import { getCanvasData, getCanvasDimensions, saveCanvasState, loadDataToCanvas } from './canvasManager.js';

// Component state
let placingComponent = null;
let componentPreviewPixels = [];

// Initialize component manager
export function initializeComponentManager() {
    setupComponentEventListeners();
    loadComponents();
    updateCounts();
}

// Setup component-related event listeners
function setupComponentEventListeners() {
    // Clear buttons
    DOM.clearComponentsBtn.addEventListener('click', () => {
        showConfirm('Clear all saved components?', clearAllComponents);
    });
}

// Load components from localStorage
export function loadComponents() {
    const components = JSON.parse(localStorage.getItem('pixelComponents') || '[]');
    renderComponentsList(components);
}

// Render components list
function renderComponentsList(components) {
    DOM.componentsList.innerHTML = '';
    
    if (components.length === 0) {
        DOM.componentsList.innerHTML = '<div class="saved-empty">No components saved yet</div>';
        return;
    }
    
    components.forEach((component, index) => {
        const item = document.createElement('div');
        item.className = 'saved-item';
        
        item.innerHTML = `
            <div class="saved-item-header">
                <span class="saved-item-name">${component.name}</span>
                <div class="saved-item-actions">
                    <button class="saved-item-place" onclick="placeComponent(${index})">PLACE</button>
                    <button class="saved-item-delete" onclick="deleteComponent(${index})">DEL</button>
                </div>
            </div>
            <div class="saved-item-info">
                <span>${component.width}×${component.height}</span>
                <span>${new Date(component.timestamp).toLocaleDateString()}</span>
            </div>
            <div class="saved-item-preview">
                ${createComponentPreview(component)}
            </div>
        `;
        
        DOM.componentsList.appendChild(item);
    });
}

// Create component preview
function createComponentPreview(component) {
    const canvas = document.createElement('canvas');
    canvas.className = 'component-preview-canvas';
    canvas.width = component.width * 2;
    canvas.height = component.height * 2;
    
    const ctx = canvas.getContext('2d');
    
    component.data.forEach((color, index) => {
        const x = index % component.width;
        const y = Math.floor(index / component.width);
        
        ctx.fillStyle = color || '#000000';
        ctx.fillRect(x * 2, y * 2, 2, 2);
    });
    
    return canvas.outerHTML;
}

// Place component
export function placeComponent(index) {
    const components = JSON.parse(localStorage.getItem('pixelComponents') || '[]');
    const component = components[index];
    
    if (!component) return;
    
    // Enter component placement mode
    placingComponent = component;
    showAlert(`Hover over canvas to preview "${component.name}" placement, then click to place.`);
}

// Delete component
export function deleteComponent(index) {
    const components = JSON.parse(localStorage.getItem('pixelComponents') || '[]');
    const component = components[index];
    
    showConfirm(`Delete component "${component.name}"?`, () => {
        components.splice(index, 1);
        localStorage.setItem('pixelComponents', JSON.stringify(components));
        loadComponents();
        updateCounts();
    });
}

// Clear all components
export function clearAllComponents() {
    localStorage.removeItem('pixelComponents');
    loadComponents();
    updateCounts();
}

// Show component preview
export function showComponentPreview(startIndex) {
    clearComponentPreview();
    
    if (!placingComponent) return;
    
    const { width: canvasWidth, height: canvasHeight } = getCanvasDimensions();
    const startX = startIndex % canvasWidth;
    const startY = Math.floor(startIndex / canvasWidth);
    
    placingComponent.data.forEach((color, pixelIndex) => {
        const compX = pixelIndex % placingComponent.width;
        const compY = Math.floor(pixelIndex / placingComponent.width);
        
        const canvasX = startX + compX;
        const canvasY = startY + compY;
        
        if (canvasX < canvasWidth && canvasY < canvasHeight && color !== '#000000') {
            const canvasPixelIndex = canvasY * canvasWidth + canvasX;
            const pixel = document.querySelector(`.pixel[data-index="${canvasPixelIndex}"]`);
            if (pixel) {
                pixel.classList.add('preview-pixel');
                componentPreviewPixels.push(pixel);
            }
        }
    });
}

// Clear component preview
export function clearComponentPreview() {
    componentPreviewPixels.forEach(pixel => {
        pixel.classList.remove('preview-pixel');
    });
    componentPreviewPixels = [];
}

// Handle component click (placement)
export function handleComponentClick(startIndex) {
    if (!placingComponent) return;
    
    const { width: canvasWidth, height: canvasHeight } = getCanvasDimensions();
    const startX = startIndex % canvasWidth;
    const startY = Math.floor(startIndex / canvasWidth);
    
    saveCanvasState();
    
    // Place component at clicked position
    placingComponent.data.forEach((color, pixelIndex) => {
        const compX = pixelIndex % placingComponent.width;
        const compY = Math.floor(pixelIndex / placingComponent.width);
        
        const canvasX = startX + compX;
        const canvasY = startY + compY;
        
        if (canvasX < canvasWidth && canvasY < canvasHeight && color !== '#000000') {
            const canvasPixelIndex = canvasY * canvasWidth + canvasX;
            const pixel = document.querySelector(`.pixel[data-index="${canvasPixelIndex}"]`);
            if (pixel) {
                pixel.style.backgroundColor = color;
            }
        }
    });
    
    if (window.updateExportCode) window.updateExportCode();
    showAlert(`Component "${placingComponent.name}" placed on canvas.`);
    
    // Exit placement mode
    placingComponent = null;
    clearComponentPreview();
}

// Update counts
export function updateCounts() {
    const components = JSON.parse(localStorage.getItem('pixelComponents') || '[]');
    const compositions = JSON.parse(localStorage.getItem('pixelCompositions') || '[]');
    const fonts = JSON.parse(localStorage.getItem('pixelFonts') || '{}');
    
    DOM.componentsTitle.textContent = `COMPONENTS (${components.length})`;
    DOM.compositionsTitle.textContent = `COMPOSITIONS (${compositions.length})`;
    DOM.fontsTitle.textContent = `FONTS (${Object.keys(fonts).length})`;
}

// Placeholder for modal functions
function showAlert(message) {
    if (window.showAlert) window.showAlert(message);
}

function showConfirm(message, onConfirm) {
    if (window.showConfirm) window.showConfirm(message, onConfirm);
} 
// Component Manager Module
// Handles component loading, placement, and management functionality

import * as DOM from './domElements.js';
import { getCanvasData, getCanvasDimensions, saveCanvasState, loadDataToCanvas } from './canvasManager.js';

// Component state
let placingComponent = null;
let componentPreviewPixels = [];
let placedComponents = [];
let isDragging = false;
let draggedComponent = null;
let dragOffset = { x: 0, y: 0 };

// Brush state
let brushComponent = null;
let isBrushMode = false;

// Move state
let movingComponent = null;
let movePreviewPixels = [];

// Store original canvas state for each placed component
let componentOriginalStates = new Map();

// Initialize component manager
export function initializeComponentManager() {
    setupComponentEventListeners();
    loadComponents();
    loadPlacedComponents();
    updateCounts();
}

// Setup component-related event listeners
function setupComponentEventListeners() {

    
    // Setup canvas event listeners for component placement
    setupCanvasEventListeners();
}

// Setup canvas event listeners for component placement and dragging
function setupCanvasEventListeners() {
    if (!DOM.pixelGrid) return;
    
    // Mouse move for preview and brush
    DOM.pixelGrid.addEventListener('mousemove', handleCanvasMouseMove);
    
    // Mouse leave to clear preview
    DOM.pixelGrid.addEventListener('mouseleave', clearAllPreviews);
    
    // Click to place component or finish move
    DOM.pixelGrid.addEventListener('click', handleCanvasClick);
    
    // Mouse down for starting move (only in move mode)
    DOM.pixelGrid.addEventListener('mousedown', handleCanvasMouseDown);
    
    // Mouse up for dragging
    document.addEventListener('mouseup', handleCanvasMouseUp);
    
    // Mouse move for dragging (document level)
    document.addEventListener('mousemove', handleDocumentMouseMove);
}

// Retry setup if canvas is not ready
export function retryCanvasSetup() {
    if (DOM.pixelGrid && !DOM.pixelGrid.hasAttribute('data-component-events-setup')) {
        setupCanvasEventListeners();
        DOM.pixelGrid.setAttribute('data-component-events-setup', 'true');
    }
}

// Handle canvas mouse move for component preview, brush, and move preview
function handleCanvasMouseMove(e) {
    if (placingComponent) {
        // Component placement preview
        const rect = DOM.pixelGrid.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const pixelSize = parseInt(getComputedStyle(DOM.pixelGrid.querySelector('.pixel')).width);
        const gridX = Math.floor(x / pixelSize);
        const gridY = Math.floor(y / pixelSize);
        
        showComponentPreview(gridY * getCanvasDimensions().width + gridX);
    } else if (isBrushMode && brushComponent) {
        // Brush mode - draw component as you move
        const rect = DOM.pixelGrid.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const pixelSize = parseInt(getComputedStyle(DOM.pixelGrid.querySelector('.pixel')).width);
        const gridX = Math.floor(x / pixelSize);
        const gridY = Math.floor(y / pixelSize);
        
        // Check if mouse button is pressed (drawing)
        if (e.buttons === 1) {
            drawComponentAsBrush(gridX, gridY);
        }
    } else if (movingComponent && isDragging) {
        // Move preview mode - show preview while dragging
        const rect = DOM.pixelGrid.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const pixelSize = parseInt(getComputedStyle(DOM.pixelGrid.querySelector('.pixel')).width);
        const gridX = Math.floor(x / pixelSize);
        const gridY = Math.floor(y / pixelSize);
        
        showMovePreview(gridX, gridY);
    }
}

// Handle document mouse move for dragging
function handleDocumentMouseMove(e) {
    if (isDragging && draggedComponent && window.currentTool === 'move') {
        updateDraggedComponentPosition(e.clientX, e.clientY);
    }
}

// Handle canvas click for component placement or move completion
function handleCanvasClick(e) {
    if (placingComponent) {
        // Place component
        const rect = DOM.pixelGrid.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const pixelSize = parseInt(getComputedStyle(DOM.pixelGrid.querySelector('.pixel')).width);
        const gridX = Math.floor(x / pixelSize);
        const gridY = Math.floor(y / pixelSize);
        
        placeComponentOnCanvas(gridX, gridY);
    } else if (movingComponent && isDragging && !movingComponent.justStarted) {
        // Complete move operation (only if not just started)
        const rect = DOM.pixelGrid.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const pixelSize = parseInt(getComputedStyle(DOM.pixelGrid.querySelector('.pixel')).width);
        const gridX = Math.floor(x / pixelSize);
        const gridY = Math.floor(y / pixelSize);
        
        completeMoveOperation(gridX, gridY);
    }
}

// Handle canvas mouse down for starting move (only in move mode)
function handleCanvasMouseDown(e) {
    if (placingComponent || window.currentTool !== 'move') return;
    
    const rect = DOM.pixelGrid.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const pixelSize = parseInt(getComputedStyle(DOM.pixelGrid.querySelector('.pixel')).width);
    const gridX = Math.floor(x / pixelSize);
    const gridY = Math.floor(y / pixelSize);
    
    const component = findComponentAtPosition(gridX, gridY);
    if (component) {
        startMoveOperation(component, e.clientX, e.clientY);
    }
}

// Handle canvas mouse up for dragging
function handleCanvasMouseUp() {
    // Don't stop dragging here - let it continue until click
}

// Start move operation
function startMoveOperation(component, clientX, clientY) {
    isDragging = true;
    movingComponent = component;
    movingComponent.justStarted = true; // Flag to prevent immediate completion
    
    const rect = DOM.pixelGrid.getBoundingClientRect();
    const pixelSize = parseInt(getComputedStyle(DOM.pixelGrid.querySelector('.pixel')).width);
    const gridX = Math.floor((clientX - rect.left) / pixelSize);
    const gridY = Math.floor((clientY - rect.top) / pixelSize);
    
    dragOffset.x = gridX - component.x;
    dragOffset.y = gridY - component.y;
    
    // Remove component from current position and restore background
    removeComponentAndRestoreBackground(component);
    
    // Remove from placed components list temporarily
    const componentIndex = placedComponents.findIndex(comp => comp.id === component.id);
    if (componentIndex !== -1) {
        placedComponents.splice(componentIndex, 1);
        // Update global reference for export system
        window.placedComponents = placedComponents;
        savePlacedComponents();
    }
    
    // Clear the flag after a short delay to allow the click event to pass
    setTimeout(() => {
        if (movingComponent) {
            movingComponent.justStarted = false;
        }
    }, 100);
}

// Show move preview
function showMovePreview(gridX, gridY) {
    if (!movingComponent) return;
    
    clearMovePreview();
    
    const { width: canvasWidth, height: canvasHeight } = getCanvasDimensions();
    
    // Check if component fits at this position
    if (gridX + movingComponent.width > canvasWidth || gridY + movingComponent.height > canvasHeight) {
        return; // Don't show preview if it doesn't fit
    }
    
    // Show blue glow for component dimensions
    for (let y = 0; y < movingComponent.height; y++) {
        for (let x = 0; x < movingComponent.width; x++) {
            const canvasX = gridX + x;
            const canvasY = gridY + y;
            
            if (canvasX < canvasWidth && canvasY < canvasHeight) {
                const canvasPixelIndex = canvasY * canvasWidth + canvasX;
                const pixel = document.querySelector(`.pixel[data-index="${canvasPixelIndex}"]`);
                if (pixel) {
                    pixel.classList.add('component-dimension-preview');
                    movePreviewPixels.push(pixel);
                }
            }
        }
    }
    
    // Show green glow for component design pixels
    movingComponent.data.forEach((color, pixelIndex) => {
        if (color && color !== '#000000') {
            const compX = pixelIndex % movingComponent.width;
            const compY = Math.floor(pixelIndex / movingComponent.width);
            
            const canvasX = gridX + compX;
            const canvasY = gridY + compY;
            
            if (canvasX < canvasWidth && canvasY < canvasHeight) {
                const canvasPixelIndex = canvasY * canvasWidth + canvasX;
                const pixel = document.querySelector(`.pixel[data-index="${canvasPixelIndex}"]`);
                if (pixel) {
                    pixel.classList.add('component-design-preview');
                    movePreviewPixels.push(pixel);
                }
            }
        }
    });
}

// Clear move preview
function clearMovePreview() {
    movePreviewPixels.forEach(pixel => {
        pixel.classList.remove('component-dimension-preview', 'component-design-preview');
    });
    movePreviewPixels = [];
}

// Complete move operation
function completeMoveOperation(gridX, gridY) {
    if (!movingComponent) return;
    
    const { width: canvasWidth, height: canvasHeight } = getCanvasDimensions();
    
    // Check if component fits at position
    if (gridX + movingComponent.width > canvasWidth || gridY + movingComponent.height > canvasHeight) {
        showAlert('Component does not fit at this position. Try placing it elsewhere.');
        // Restore component to original position
        restoreComponentToOriginalPosition();
        return;
    }
    
    // Update component position
    movingComponent.x = gridX;
    movingComponent.y = gridY;
    
    // Add back to placed components list
    placedComponents.push(movingComponent);
    // Update global reference for export system
    window.placedComponents = placedComponents;
    savePlacedComponents();
    
    // Place component pixels at new position
    placeComponentPixels(movingComponent);
    
    // Clear preview
    clearMovePreview();
    
    // Exit move mode
    isDragging = false;
    movingComponent = null;
    
    // Clean up any orphaned states
    cleanupOrphanedComponentStates();
    
    // Update export code
    if (window.updateExportCode) window.updateExportCode();
    
    // Component moved successfully - no notification needed
}

// Restore component to original position
function restoreComponentToOriginalPosition() {
    if (!movingComponent) return;
    
    // Restore component pixels
    placeComponentPixels(movingComponent);
    
    // Add back to placed components list
    placedComponents.push(movingComponent);
    // Update global reference for export system
    window.placedComponents = placedComponents;
    savePlacedComponents();
    
    // Clear preview
    clearMovePreview();
    
    // Exit move mode
    isDragging = false;
    movingComponent = null;
}

// Find component at specific position
function findComponentAtPosition(x, y) {
    // Clean up any orphaned component states first
    cleanupOrphanedComponentStates();
    
    return placedComponents.find(comp => 
        x >= comp.x && x < comp.x + comp.width &&
        y >= comp.y && y < comp.y + comp.height
    );
}

// Clean up orphaned component states that no longer have corresponding placed components
function cleanupOrphanedComponentStates() {
    const validComponentIds = new Set(placedComponents.map(comp => comp.id));
    
    // Remove states for components that no longer exist
    for (const [componentId, state] of componentOriginalStates.entries()) {
        if (!validComponentIds.has(componentId)) {
            componentOriginalStates.delete(componentId);
        }
    }
}

// Export function to manually clean up component states (for debugging)
export function cleanupComponentStates() {
    cleanupOrphanedComponentStates();
    console.log('Component states cleaned up. Current states:', componentOriginalStates.size);
}

// Completely reset the canvas and component system
export function resetCanvasAndComponents() {
    // Clear all placed components
    clearAllPlacedComponents();
    
    // Clear all previews
    clearAllPreviews();
    
    // Reset all state variables
    placingComponent = null;
    isDragging = false;
    movingComponent = null;
    brushComponent = null;
    isBrushMode = false;
    
    // Restore canvas border
    restoreCanvasBorder();
    
    // Clear component states
    componentOriginalStates.clear();
    
    // Clear global reference
    window.placedComponents = [];
    
    console.log('Canvas and components completely reset');
}

// Start dragging a component (legacy function - now handled by startMoveOperation)
function startDragging(component, clientX, clientY) {
    // This is now handled by startMoveOperation
}

// Stop dragging
function stopDragging() {
    if (draggedComponent) {
        removeDraggingEffect(draggedComponent);
        draggedComponent = null;
    }
    isDragging = false;
    dragOffset = { x: 0, y: 0 };
}

// Add dragging visual effect
function addDraggingEffect(component) {
    for (let y = 0; y < component.height; y++) {
        for (let x = 0; x < component.width; x++) {
            const canvasX = component.x + x;
            const canvasY = component.y + y;
            
            if (canvasX < getCanvasDimensions().width && canvasY < getCanvasDimensions().height) {
                const pixelIndex = canvasY * getCanvasDimensions().width + canvasX;
                const pixel = document.querySelector(`.pixel[data-index="${pixelIndex}"]`);
                if (pixel) {
                    pixel.classList.add('dragging');
                }
            }
        }
    }
}

// Remove dragging visual effect
function removeDraggingEffect(component) {
    for (let y = 0; y < component.height; y++) {
        for (let x = 0; x < component.width; x++) {
            const canvasX = component.x + x;
            const canvasY = component.y + y;
            
            if (canvasX < getCanvasDimensions().width && canvasY < getCanvasDimensions().height) {
                const pixelIndex = canvasY * getCanvasDimensions().width + canvasX;
                const pixel = document.querySelector(`.pixel[data-index="${pixelIndex}"]`);
                if (pixel) {
                    pixel.classList.remove('dragging');
                }
            }
        }
    }
}

// Update dragged component position (legacy function - now handled by move preview)
function updateDraggedComponentPosition(clientX, clientY) {
    // This is now handled by move preview system
}

// Move component to new position (legacy function - now handled by move preview)
function moveComponent(component, newX, newY) {
    // This is now handled by move preview system
}

// Store the original canvas state for a component area
function storeComponentOriginalState(component) {
    const { width: canvasWidth, height: canvasHeight } = getCanvasDimensions();
    const originalState = [];
    
    for (let y = 0; y < component.height; y++) {
        for (let x = 0; x < component.width; x++) {
            const canvasX = component.x + x;
            const canvasY = component.y + y;
            
            if (canvasX < canvasWidth && canvasY < canvasHeight) {
                const pixelIndex = canvasY * canvasWidth + canvasX;
                const pixel = document.querySelector(`.pixel[data-index="${pixelIndex}"]`);
                if (pixel) {
                    // Store the current pixel color (before component was placed)
                    originalState.push({
                        x: canvasX,
                        y: canvasY,
                        color: pixel.style.backgroundColor || '#000000'
                    });
                }
            }
        }
    }
    
    componentOriginalStates.set(component.id, originalState);
}

// Restore original canvas state in component area
function restoreOriginalCanvasState(component) {
    const originalState = componentOriginalStates.get(component.id);
    if (!originalState) return;
    
    originalState.forEach(pixelData => {
        const pixelIndex = pixelData.y * getCanvasDimensions().width + pixelData.x;
        const pixel = document.querySelector(`.pixel[data-index="${pixelIndex}"]`);
        if (pixel) {
            pixel.style.backgroundColor = pixelData.color;
        }
    });
}

// Remove component and restore background for move operation
function removeComponentAndRestoreBackground(component) {
    const { width: canvasWidth, height: canvasHeight } = getCanvasDimensions();
    
    for (let y = 0; y < component.height; y++) {
        for (let x = 0; x < component.width; x++) {
            const canvasX = component.x + x;
            const canvasY = component.y + y;
            
            if (canvasX < canvasWidth && canvasY < canvasHeight) {
                const pixelIndex = canvasY * canvasWidth + canvasX;
                const pixel = document.querySelector(`.pixel[data-index="${pixelIndex}"]`);
                if (pixel) {
                    // Check if this pixel was part of the component design
                    const componentPixelIndex = y * component.width + x;
                    const componentColor = component.data[componentPixelIndex];
                    
                    if (componentColor && componentColor !== '#000000') {
                        // This was a component pixel, restore to black (default background)
                        pixel.style.backgroundColor = '#000000';
                    }
                    // If it was black, leave it as is (it was already background)
                }
            }
        }
    }
    
    // Remove the component's original state since it's being moved
    componentOriginalStates.delete(component.id);
}

// Remove component pixels from canvas (only the component's design pixels, not the background)
function removeComponentPixels(component) {
    for (let y = 0; y < component.height; y++) {
        for (let x = 0; x < component.width; x++) {
            const canvasX = component.x + x;
            const canvasY = component.y + y;
            
            if (canvasX < getCanvasDimensions().width && canvasY < getCanvasDimensions().height) {
                const pixelIndex = canvasY * getCanvasDimensions().width + canvasX;
                const pixel = document.querySelector(`.pixel[data-index="${pixelIndex}"]`);
                if (pixel) {
                    // Only remove component pixels, not background
                    const componentPixelIndex = y * component.width + x;
                    const componentColor = component.data[componentPixelIndex];
                    if (componentColor && componentColor !== '#000000') {
                        // Restore original background color if we have it
                        const originalState = componentOriginalStates.get(component.id);
                        if (originalState) {
                            const originalPixel = originalState.find(p => p.x === canvasX && p.y === canvasY);
                            if (originalPixel) {
                                pixel.style.backgroundColor = originalPixel.color;
                            }
                        }
                    }
                }
            }
        }
    }
}

// Place component pixels on canvas
function placeComponentPixels(component) {
    for (let y = 0; y < component.height; y++) {
        for (let x = 0; x < component.width; x++) {
            const canvasX = component.x + x;
            const canvasY = component.y + y;
            
            if (canvasX < getCanvasDimensions().width && canvasY < getCanvasDimensions().height) {
                const pixelIndex = canvasY * getCanvasDimensions().width + canvasX;
                const pixel = document.querySelector(`.pixel[data-index="${pixelIndex}"]`);
                if (pixel) {
                    const componentPixelIndex = y * component.width + x;
                    const color = component.data[componentPixelIndex];
                    if (color && color !== '#000000') {
                        pixel.style.backgroundColor = color;
                    }
                }
            }
        }
    }
}

// Draw component as brush at specific position
function drawComponentAsBrush(x, y) {
    if (!brushComponent) return;
    
    const { width: canvasWidth, height: canvasHeight } = getCanvasDimensions();
    
    // Check if component fits at position
    if (x + brushComponent.width > canvasWidth || y + brushComponent.height > canvasHeight) {
        return; // Don't draw if it doesn't fit
    }
    
    // Draw component pixels directly (no state preservation needed for brush)
    for (let compY = 0; compY < brushComponent.height; compY++) {
        for (let compX = 0; compX < brushComponent.width; compX++) {
            const canvasX = x + compX;
            const canvasY = y + compY;
            
            if (canvasX < canvasWidth && canvasY < canvasHeight) {
                const pixelIndex = canvasY * canvasWidth + canvasX;
                const pixel = document.querySelector(`.pixel[data-index="${pixelIndex}"]`);
                if (pixel) {
                    const componentPixelIndex = compY * brushComponent.width + compX;
                    const color = brushComponent.data[componentPixelIndex];
                    if (color && color !== '#000000') {
                        pixel.style.backgroundColor = color;
                    }
                }
            }
        }
    }
    
    // Update export code
    if (window.updateExportCode) window.updateExportCode();
}

// Clear all previews
function clearAllPreviews() {
    clearComponentPreview();
    clearMovePreview();
}

// Load components from localStorage
export function loadComponents() {
    console.log('loadComponents called');
    
    if (!DOM.componentsList) {
        console.error('DOM.componentsList not found, components cannot be loaded');
        return;
    }
    
    const components = JSON.parse(localStorage.getItem('pixelComponents') || '[]');
    console.log('Components loaded from localStorage:', components);
    
    renderComponentsList(components);
}

// Load placed components from localStorage
function loadPlacedComponents() {
    placedComponents = JSON.parse(localStorage.getItem('placedComponents') || '[]');
    // Make placedComponents globally accessible for export system
    window.placedComponents = placedComponents;
    // Restore placed components on canvas
    placedComponents.forEach(component => {
        placeComponentPixels(component);
    });
}

// Save placed components to localStorage
function savePlacedComponents() {
    localStorage.setItem('placedComponents', JSON.stringify(placedComponents));
    // Update global reference for export system
    window.placedComponents = placedComponents;
}

// Render components list
function renderComponentsList(components) {
    if (!DOM.componentsList) {
        console.error('Components list element not found');
        return;
    }
    
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
                    <button class="saved-item-brush" onclick="enableComponentBrush(${index})">BRUSH</button>
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
    // Create a container for the pixel grid
    const container = document.createElement('div');
    container.className = 'component-preview-grid';
    
    // Calculate exact dimensions: 3px per pixel, no gaps
    const gridWidth = component.width * 3;
    const gridHeight = component.height * 3;
    
    container.style.cssText = `
        display: grid;
        grid-template-columns: repeat(${component.width}, 3px);
        grid-template-rows: repeat(${component.height}, 3px);
        gap: 0px;
        width: ${Math.min(gridWidth, 120)}px;
        height: ${Math.min(gridHeight, 60)}px;
        background: #000000;
        border: 1px solid #666666;
        padding: 0px;
        box-sizing: border-box;
    `;
    
    // Create each pixel as a div
    component.data.forEach((color, index) => {
        const pixel = document.createElement('div');
        pixel.className = 'component-preview-pixel';
        
        // Only show non-black pixels (the actual design)
        if (color && color !== '#000000' && color !== '') {
            pixel.style.backgroundColor = color;
            pixel.style.border = 'none';
        } else {
            // Empty pixels remain transparent/black
            pixel.style.backgroundColor = 'transparent';
            pixel.style.border = 'none';
        }
        
        container.appendChild(pixel);
    });
    
    return container.outerHTML;
}

// Remove blue border and restore green border
function restoreCanvasBorder() {
    if (DOM.pixelGrid) {
        DOM.pixelGrid.classList.remove('component-placement-mode');
    }
}

// Place component
export function placeComponent(index) {
    const components = JSON.parse(localStorage.getItem('pixelComponents') || '[]');
    const component = components[index];
    
    if (!component) return;
    
    // Exit brush mode if active
    if (isBrushMode) {
        exitBrushMode();
    }
    
    // Exit move mode if active
    if (movingComponent) {
        restoreComponentToOriginalPosition();
    }
    
    // Deselect any currently active tools
    if (window.deselectAllTools) {
        window.deselectAllTools();
    }
    
    // Change canvas border to blue for component placement mode
    if (DOM.pixelGrid) {
        DOM.pixelGrid.classList.add('component-placement-mode');
    }
    
    // Enter component placement mode
    placingComponent = component;
}

// Enable component brush mode
export function enableComponentBrush(index) {
    const components = JSON.parse(localStorage.getItem('pixelComponents') || '[]');
    const component = components[index];
    
    if (!component) return;
    
    // Exit placement mode if active
    if (placingComponent) {
        placingComponent = null;
        clearComponentPreview();
        
        // Remove blue border and restore green border
        restoreCanvasBorder();
    }
    
    // Exit move mode if active
    if (movingComponent) {
        restoreComponentToOriginalPosition();
    }
    
    // Enter brush mode
    brushComponent = component;
    isBrushMode = true;
    
    // Switch to draw tool for brush functionality
    if (window.setActiveTool) {
        window.setActiveTool('draw');
    }
    
    showAlert(`Brush mode enabled for "${component.name}". Hold mouse button and move to draw.`);
}

// Exit brush mode
export function exitBrushMode() {
    isBrushMode = false;
    brushComponent = null;
    showAlert('Brush mode disabled.');
}

// Place component on canvas at specific position
function placeComponentOnCanvas(x, y) {
    if (!placingComponent) return;
    
    const { width: canvasWidth, height: canvasHeight } = getCanvasDimensions();
    
    // Check if component fits at position
    if (x + placingComponent.width > canvasWidth || y + placingComponent.height > canvasHeight) {
        showAlert('Component does not fit at this position. Try placing it elsewhere.');
        return;
    }
    
    saveCanvasState();
    
    // Store the original canvas state before placing the component
    const tempId = storeOriginalCanvasStateBeforePlacement(x, y, placingComponent);
    
    // Create placed component object
    const placedComponent = {
        ...placingComponent,
        x: x,
        y: y,
        id: Date.now() + Math.random()
    };
    
    // Update the stored original state with the actual component ID
    const originalState = componentOriginalStates.get(tempId);
    if (originalState) {
        componentOriginalStates.set(placedComponent.id, originalState);
        componentOriginalStates.delete(tempId);
    }
    
    // Add to placed components list
    placedComponents.push(placedComponent);
    // Update global reference for export system
    window.placedComponents = placedComponents;
    savePlacedComponents();
    
    // Place pixels on canvas
    placeComponentPixels(placedComponent);
    
    // Update export code
    if (window.updateExportCode) window.updateExportCode();
    
    // Exit placement mode
    placingComponent = null;
    clearComponentPreview();
    
    // Remove blue border and restore green border
    restoreCanvasBorder();
}

// Store original canvas state before placing a component
function storeOriginalCanvasStateBeforePlacement(x, y, component) {
    const { width: canvasWidth, height: canvasHeight } = getCanvasDimensions();
    const originalState = [];
    
    for (let compY = 0; compY < component.height; compY++) {
        for (let compX = 0; compX < component.width; compX++) {
            const canvasX = x + compX;
            const canvasY = y + compY;
            
            if (canvasX < canvasWidth && canvasY < canvasHeight) {
                const pixelIndex = canvasY * canvasWidth + canvasX;
                const pixel = document.querySelector(`.pixel[data-index="${pixelIndex}"]`);
                if (pixel) {
                    originalState.push({
                        x: canvasX,
                        y: canvasY,
                        color: pixel.style.backgroundColor || '#000000'
                    });
                }
            }
        }
    }
    
    // Store with a temporary ID that will be replaced when the component is created
    const tempId = `temp_${Date.now()}`;
    componentOriginalStates.set(tempId, originalState);
    
    // Return the temp ID so we can update it later
    return tempId;
}

// Delete component
export function deleteComponent(index) {
    const components = JSON.parse(localStorage.getItem('pixelComponents') || '[]');
    const component = components[index];
    
    if (!component) {
        console.error('Component not found at index:', index);
        return;
    }
    
    showConfirm(`Delete component "${component.name}"?`, () => {
        // Remove the specific component
        components.splice(index, 1);
        localStorage.setItem('pixelComponents', JSON.stringify(components));
        
        // Update the UI without re-rendering everything
        updateComponentListAfterDelete(index);
        updateCounts();
    });
}

// Update component list after deletion without full re-render
function updateComponentListAfterDelete(deletedIndex) {
    const componentsList = document.getElementById('componentsList');
    if (!componentsList) {
        console.error('Components list element not found, falling back to full reload');
        loadComponents();
        return;
    }
    
    // Find and remove the specific component item
    const componentItems = componentsList.querySelectorAll('.saved-item');
    if (componentItems[deletedIndex]) {
        componentItems[deletedIndex].remove();
    } else {
        console.warn('Component item not found at index:', deletedIndex, 'falling back to full reload');
        loadComponents();
        return;
    }
    
    // If no components left, show empty message
    if (componentsList.children.length === 0) {
        componentsList.innerHTML = '<div class="saved-empty">No components saved yet</div>';
    }
}

// Remove placed component from canvas
export function removePlacedComponent(componentId) {
    const componentIndex = placedComponents.findIndex(comp => comp.id === componentId);
    if (componentIndex === -1) return;
    
    const component = placedComponents[componentIndex];
    
    // Restore original canvas state
    restoreOriginalCanvasState(component);
    
    // Remove from placed components list
    placedComponents.splice(componentIndex, 1);
    // Update global reference for export system
    window.placedComponents = placedComponents;
    savePlacedComponents();
    
    // Clean up stored original state
    componentOriginalStates.delete(componentId);
    
    // Update export code
    if (window.updateExportCode) window.updateExportCode();
}

// Clear all components
export function clearAllComponents() {
    localStorage.removeItem('pixelComponents');
    loadComponents();
    updateCounts();
}

// Clear all placed components
export function clearAllPlacedComponents() {
    // Restore original canvas state for all placed components
    placedComponents.forEach(component => {
        restoreOriginalCanvasState(component);
    });
    
    // Clear placed components
    placedComponents = [];
    // Clear global reference
    window.placedComponents = [];
    savePlacedComponents();
    
    // Clear stored original states
    componentOriginalStates.clear();
    
    // Note: updateExportCode is now called from clearCanvas after this function completes
}

// Show component preview with enhanced effects
export function showComponentPreview(startIndex) {
    clearComponentPreview();
    
    if (!placingComponent) return;
    
    const { width: canvasWidth, height: canvasHeight } = getCanvasDimensions();
    const startX = startIndex % canvasWidth;
    const startY = Math.floor(startIndex / canvasWidth);
    
    // Check if component fits at this position
    if (startX + placingComponent.width > canvasWidth || startY + placingComponent.height > canvasHeight) {
        return; // Don't show preview if it doesn't fit
    }
    
    // Show blue glow for component dimensions
    for (let y = 0; y < placingComponent.height; y++) {
        for (let x = 0; x < placingComponent.width; x++) {
            const canvasX = startX + x;
            const canvasY = startY + y;
            
            if (canvasX < canvasWidth && canvasY < canvasHeight) {
                const canvasPixelIndex = canvasY * canvasWidth + canvasX;
                const pixel = document.querySelector(`.pixel[data-index="${canvasPixelIndex}"]`);
                if (pixel) {
                    pixel.classList.add('component-dimension-preview');
                    componentPreviewPixels.push(pixel);
                }
            }
        }
    }
    
    // Show green glow for component design pixels
    placingComponent.data.forEach((color, pixelIndex) => {
        if (color && color !== '#000000') {
        const compX = pixelIndex % placingComponent.width;
        const compY = Math.floor(pixelIndex / placingComponent.width);
        
        const canvasX = startX + compX;
        const canvasY = startY + compY;
        
            if (canvasX < canvasWidth && canvasY < canvasHeight) {
            const canvasPixelIndex = canvasY * canvasWidth + canvasX;
            const pixel = document.querySelector(`.pixel[data-index="${canvasPixelIndex}"]`);
            if (pixel) {
                    pixel.classList.add('component-design-preview');
                componentPreviewPixels.push(pixel);
                }
            }
        }
    });
}

// Clear component preview
export function clearComponentPreview() {
    componentPreviewPixels.forEach(pixel => {
        pixel.classList.remove('component-dimension-preview', 'component-design-preview');
    });
    componentPreviewPixels = [];
}

// Handle component click (placement) - legacy function for backward compatibility
export function handleComponentClick(startIndex) {
    if (!placingComponent) return;
    
    const { width: canvasWidth, height: canvasHeight } = getCanvasDimensions();
    const startX = startIndex % canvasWidth;
    const startY = Math.floor(startIndex / canvasWidth);
    
    placeComponentOnCanvas(startX, startY);
}

// Update counts
export function updateCounts() {
    const components = JSON.parse(localStorage.getItem('pixelComponents') || '[]');
    const compositions = JSON.parse(localStorage.getItem('pixelCompositions') || '[]');
    const fonts = JSON.parse(localStorage.getItem('pixelFonts') || '{}');
    
    DOM.componentsTitle.textContent = `🧩`;
    DOM.compositionsTitle.textContent = `🎨`;
    DOM.fontsTitle.textContent = `🔤`;
}

// Placeholder for modal functions
function showAlert(message) {
    if (window.showAlert) window.showAlert(message);
}

function showConfirm(message, onConfirm) {
    if (window.showConfirm) window.showConfirm(message, onConfirm);
} 
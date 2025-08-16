// Tool Manager Module
// Handles tool switching, brush controls, and tool-specific functionality

import * as DOM from './domElements.js';

// Tool state
let currentTool = 'draw';
let currentColor = '#00ff00';
let currentBrushSize = 1;
let currentBrushShape = 'square';

// Initialize tool manager
export function initializeToolManager() {
    setupToolEventListeners();
    updateToolControls();
    updateColorControlsVisibility();
}

// Setup tool-related event listeners
function setupToolEventListeners() {
    // Tool buttons
    DOM.toolButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            // Remove active from all tool buttons
            DOM.toolButtons.forEach(b => b.classList.remove('active'));
            // Add active to clicked button
            e.target.classList.add('active');
            currentTool = e.target.dataset.tool;
            
            // Update global currentTool
            window.currentTool = currentTool;
            
            console.log('Tool switched to:', currentTool);
            
            // Show/hide tool-specific controls
            updateToolControls();
            
            // Show/hide color controls based on tool
            updateColorControlsVisibility();
            
            // Exit typing mode when switching tools
            if (currentTool !== 'type') {
                exitTypingMode();
            }
            
            // Don't exit font edit mode when switching tools
            // This allows users to switch tools while editing a character
            
            // Clear brush preview when switching tools
            if (window.clearBrushPreview) {
                window.clearBrushPreview();
            }
        });
    });

    // Shape buttons
    DOM.shapeButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            DOM.shapeButtons.forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            currentBrushShape = e.target.dataset.shape;
            updateBrushProperties();
        });
    });

    // Color picker
    DOM.colorPicker.addEventListener('change', (e) => {
        currentColor = e.target.value;
        updateColorDisplay();
        updateBrushProperties();
    });

    // Brush size slider
    DOM.brushSize.addEventListener('input', (e) => {
        currentBrushSize = parseInt(e.target.value);
        DOM.brushSizeValue.textContent = currentBrushSize;
        updateBrushProperties();
    });

    // Clear button
    DOM.clearBtn.addEventListener('click', () => {
        showConfirm('Clear the entire canvas?', () => {
            if (window.saveCanvasState) window.saveCanvasState();
            if (window.clearCanvas) window.clearCanvas();
        });
    });
}

// Update brush properties in canvas manager
function updateBrushProperties() {
    if (window.setCanvasBrushProperties) {
        window.setCanvasBrushProperties(currentColor, currentBrushSize, currentBrushShape);
    }
}

// Set active tool
export function setActiveTool(tool) {
    currentTool = tool;
    window.currentTool = tool;
    
    console.log('setActiveTool called:', tool);
    
    // Update tool buttons
    DOM.toolButtons.forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.tool === tool) {
            btn.classList.add('active');
        }
    });
    
    // Show/hide type tool controls
    updateToolControls();
    updateColorControlsVisibility();
    
    // Don't exit font edit mode when switching tools programmatically
    // This allows users to switch tools while editing a character
}

// Deselect all tools (for component placement mode)
export function deselectAllTools() {
    currentTool = null;
    window.currentTool = null;
    
    console.log('All tools deselected');
    
    // Remove active class from all tool buttons
    DOM.toolButtons.forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Hide all tool-specific controls
    updateToolControls();
    updateColorControlsVisibility();
}

// Update tool-specific controls
export function updateToolControls() {
    if (currentTool === 'type') {
        DOM.typeToolGroup.style.display = 'flex';
        DOM.brushShapeGroup.style.display = 'none';
        DOM.sizeGroup.style.display = 'none';
    } else if (currentTool === null) {
        // No tool selected (component placement mode)
        DOM.typeToolGroup.style.display = 'none';
        DOM.brushShapeGroup.style.display = 'none';
        DOM.sizeGroup.style.display = 'none';
    } else {
        DOM.typeToolGroup.style.display = 'none';
        DOM.brushShapeGroup.style.display = 'flex';
        DOM.sizeGroup.style.display = 'flex';
    }
}

// Update color controls visibility
export function updateColorControlsVisibility() {
    const colorControls = document.querySelector('.color-controls');
    if (currentTool === 'draw') {
        colorControls.style.display = 'flex';
    } else {
        colorControls.style.display = 'none';
    }
}

// Update color display
export function updateColorDisplay() {
    DOM.colorDisplay.textContent = currentColor.toUpperCase();
}

// Get current tool
export function getCurrentTool() {
    return currentTool;
}

// Get current brush properties
export function getBrushProperties() {
    return {
        color: currentColor,
        size: currentBrushSize,
        shape: currentBrushShape
    };
}

// Set brush properties
export function setBrushProperties(color, size, shape) {
    currentColor = color;
    currentBrushSize = size;
    currentBrushShape = shape;
    
    // Update UI
    DOM.colorPicker.value = color;
    DOM.brushSize.value = size;
    DOM.brushSizeValue.textContent = size;
    
    // Update shape buttons
    DOM.shapeButtons.forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.shape === shape) {
            btn.classList.add('active');
        }
    });
    
    updateColorDisplay();
    updateBrushProperties();
}

// Exit typing mode
function exitTypingMode() {
    if (window.exitTypingMode) window.exitTypingMode();
}

// Placeholder for modal functions
function showConfirm(message, onConfirm) {
    if (window.showConfirm) window.showConfirm(message, onConfirm);
} 
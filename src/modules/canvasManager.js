// Canvas Manager Module
// Handles canvas operations, grid creation, and drawing functionality

import * as DOM from './domElements.js';

// Canvas state
let canvasWidth = 16;
let canvasHeight = 16;
let isDrawing = false;
let currentColor = '#00ff00';
let currentBrushSize = 1;
let currentBrushShape = 'square';

// Canvas history for undo/redo
let canvasHistory = [];
let historyIndex = -1;
const MAX_HISTORY = 50;

// Initialize canvas
export function initializeCanvas(width = 16, height = 16) {
    canvasWidth = width;
    canvasHeight = height;
    createGrid();
    updateDimensions();
    saveCanvasState();
}

// Create pixel grid
export function createGrid() {
    DOM.pixelGrid.innerHTML = '';
    DOM.pixelGrid.style.gridTemplateColumns = `repeat(${canvasWidth}, 1fr)`;
    
    // Calculate pixel size based on available space
    const maxSize = Math.min(400 / canvasWidth, 400 / canvasHeight);
    const pixelSize = Math.max(8, Math.min(32, maxSize));
    
    for (let i = 0; i < canvasWidth * canvasHeight; i++) {
        const pixel = document.createElement('div');
        pixel.className = 'pixel';
        pixel.style.width = `${pixelSize}px`;
        pixel.style.height = `${pixelSize}px`;
        pixel.dataset.index = i;
        
        // Mouse events
        pixel.addEventListener('mousedown', (e) => startDrawing(e, i));
        pixel.addEventListener('mouseenter', (e) => continueDrawing(e, i));
        pixel.addEventListener('mouseup', stopDrawing);
        
        // Click event for type tool
        pixel.addEventListener('click', (e) => {
            if (window.currentTool === 'type') {
                handleTypeClick(i);
            } else if (window.placingComponent) {
                handleComponentClick(i);
            }
        });
        
        // Mouse enter event for type tool preview
        pixel.addEventListener('mouseenter', (e) => {
            console.log('Pixel mouseenter:', { index: i, currentTool: window.currentTool });
            if (window.currentTool === 'type') {
                console.log('Calling showTextPreview for index:', i);
                showTextPreview(i);
            } else if (window.placingComponent) {
                showComponentPreview(i);
            }
        });
        
        // Mouse leave event for type tool preview
        pixel.addEventListener('mouseleave', (e) => {
            console.log('Pixel mouseleave:', { index: i, currentTool: window.currentTool });
            if (window.currentTool === 'type') {
                console.log('Calling clearTypingPreview');
                clearTypingPreview();
            } else if (window.placingComponent) {
                clearComponentPreview();
            }
        });
        
        DOM.pixelGrid.appendChild(pixel);
    }
    
    // Prevent context menu
    DOM.pixelGrid.addEventListener('contextmenu', (e) => e.preventDefault());
    
    // Document mouse events for drawing
    document.addEventListener('mouseup', stopDrawing);
}

// Update canvas dimensions display
export function updateDimensions() {
    DOM.currentDimensions.textContent = `${canvasWidth} x ${canvasHeight}`;
}

// Apply new dimensions
export function applyDimensions() {
    const newWidth = parseInt(DOM.widthInput.value);
    const newHeight = parseInt(DOM.heightInput.value);
    
    if (newWidth >= 1 && newWidth <= 256 && newHeight >= 1 && newHeight <= 256) {
        saveCanvasState();
        canvasWidth = newWidth;
        canvasHeight = newHeight;
        updateDimensions();
        createGrid();
        if (window.updateExportCode) window.updateExportCode();
    } else {
        showAlert('Canvas dimensions must be between 1 and 256 pixels.');
    }
}

// Drawing functions
function startDrawing(e, index) {
    if (window.currentTool === 'type') return;
    
    e.preventDefault();
    isDrawing = true;
    
    // Save state before making changes
    saveCanvasState();
    
    drawAtPosition(index);
}

function continueDrawing(e, index) {
    if (!isDrawing || window.currentTool === 'type') return;
    
    e.preventDefault();
    drawAtPosition(index);
}

function stopDrawing() {
    if (isDrawing) {
        isDrawing = false;
        if (window.updateExportCode) window.updateExportCode();
    }
}

function drawAtPosition(index) {
    const pixels = document.querySelectorAll('.pixel');
    drawBrush(pixels, index);
}

function drawPixel(pixel) {
    if (window.currentTool === 'draw') {
        pixel.style.backgroundColor = currentColor;
    } else if (window.currentTool === 'erase') {
        pixel.style.backgroundColor = '#000000';
    } else if (window.currentTool === 'fill') {
        floodFill(parseInt(pixel.dataset.index));
    }
}

function drawBrush(pixels, centerIndex) {
    const centerX = centerIndex % canvasWidth;
    const centerY = Math.floor(centerIndex / canvasWidth);
    const radius = Math.floor(currentBrushSize / 2);
    
    for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
            const x = centerX + dx;
            const y = centerY + dy;
            
            if (x >= 0 && x < canvasWidth && y >= 0 && y < canvasHeight) {
                let inBrush = false;
                
                if (currentBrushShape === 'square') {
                    inBrush = true;
                } else if (currentBrushShape === 'circle') {
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    inBrush = distance <= radius;
                }
                
                if (inBrush) {
                    const pixelIndex = y * canvasWidth + x;
                    drawPixel(pixels[pixelIndex]);
                }
            }
        }
    }
}

function floodFill(startIndex) {
    const pixels = Array.from(document.querySelectorAll('.pixel'));
    const startColor = pixels[startIndex].style.backgroundColor || '#000000';
    
    // Convert colors to comparable format
    const targetColor = rgbToHex(startColor);
    const replacementColor = currentColor;
    
    if (targetColor === replacementColor) return;
    
    const stack = [startIndex];
    const visited = new Set();
    
    while (stack.length > 0) {
        const index = stack.pop();
        
        if (visited.has(index)) continue;
        visited.add(index);
        
        const pixel = pixels[index];
        const pixelColor = rgbToHex(pixel.style.backgroundColor || '#000000');
        
        if (pixelColor !== targetColor) continue;
        
        pixel.style.backgroundColor = replacementColor;
        
        // Add neighbors
        const x = index % canvasWidth;
        const y = Math.floor(index / canvasWidth);
        
        // Up
        if (y > 0) stack.push((y - 1) * canvasWidth + x);
        // Down
        if (y < canvasHeight - 1) stack.push((y + 1) * canvasWidth + x);
        // Left
        if (x > 0) stack.push(y * canvasWidth + (x - 1));
        // Right
        if (x < canvasWidth - 1) stack.push(y * canvasWidth + (x + 1));
    }
}

// Helper function to convert RGB to hex
function rgbToHex(rgb) {
    if (rgb === '' || rgb === 'rgb(0, 0, 0)' || rgb === '#000000') return '#000000';
    
    const result = rgb.match(/\d+/g);
    if (!result || result.length < 3) return rgb;
    
    const r = parseInt(result[0]);
    const g = parseInt(result[1]);
    const b = parseInt(result[2]);
    
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

// Clear canvas
export function clearCanvas() {
    const pixels = document.querySelectorAll('.pixel');
    pixels.forEach(pixel => {
        pixel.style.backgroundColor = '#000000';
    });
    if (window.updateExportCode) window.updateExportCode();
}

// Load canvas from pixel data
export function loadCanvasFromData(pixelData) {
    const pixels = document.querySelectorAll('.pixel');
    pixels.forEach((pixel, index) => {
        const row = Math.floor(index / canvasWidth);
        const col = index % canvasWidth;
        if (pixelData[row] && pixelData[row][col]) {
            pixel.style.backgroundColor = pixelData[row][col];
        } else {
            pixel.style.backgroundColor = '#000000';
        }
    });
}

// Load data to canvas with dimensions
export function loadDataToCanvas(pixelData, width, height) {
    console.log('loadDataToCanvas called:', { pixelData, width, height });
    
    // Clear canvas first
    clearCanvas();
    
    // Resize canvas if needed
    if (width !== canvasWidth || height !== canvasHeight) {
        console.log('Resizing canvas from', canvasWidth, 'x', canvasHeight, 'to', width, 'x', height);
        canvasWidth = width;
        canvasHeight = height;
        updateDimensions();
        createGrid();
    }
    
    // Load pixel data
    const pixels = document.querySelectorAll('.pixel');
    console.log('Found pixels:', pixels.length, 'expected:', width * height);
    
    pixelData.forEach((color, index) => {
        if (index < pixels.length) {
            pixels[index].style.backgroundColor = color || '#000000';
        }
    });
    
    console.log('Finished loading pixel data');
    
    if (window.updateExportCode) window.updateExportCode();
}

// Canvas history management
export function saveCanvasState() {
    // Remove any states after current index (when we're in the middle of history)
    canvasHistory = canvasHistory.slice(0, historyIndex + 1);
    
    // Get current canvas state
    const pixels = document.querySelectorAll('.pixel');
    const state = Array.from(pixels).map(pixel => pixel.style.backgroundColor || '#000000');
    
    // Add new state
    canvasHistory.push(state);
    historyIndex++;
    
    // Limit history size
    if (canvasHistory.length > MAX_HISTORY) {
        canvasHistory.shift();
        historyIndex--;
    }
}

export function restoreCanvasState(state) {
    const pixels = document.querySelectorAll('.pixel');
    pixels.forEach((pixel, index) => {
        if (state[index]) {
            pixel.style.backgroundColor = state[index];
        }
    });
}

export function undo() {
    if (historyIndex > 0) {
        historyIndex--;
        restoreCanvasState(canvasHistory[historyIndex]);
        if (window.updateExportCode) window.updateExportCode();
    }
}

export function redo() {
    if (historyIndex < canvasHistory.length - 1) {
        historyIndex++;
        restoreCanvasState(canvasHistory[historyIndex]);
        if (window.updateExportCode) window.updateExportCode();
    }
}

// Get current canvas data
export function getCanvasData() {
    const pixels = document.querySelectorAll('.pixel');
    return Array.from(pixels).map(pixel => pixel.style.backgroundColor || '#000000');
}

// Get canvas dimensions
export function getCanvasDimensions() {
    return { width: canvasWidth, height: canvasHeight };
}

// Set brush properties
export function setBrushProperties(color, size, shape) {
    currentColor = color;
    currentBrushSize = size;
    currentBrushShape = shape;
}

// Placeholder functions for type tool (to be implemented in typeManager)
function handleTypeClick(index) {
    // This will be implemented in typeManager
    if (window.handleTypeClick) window.handleTypeClick(index);
}

function showTextPreview(index) {
    // This will be implemented in typeManager
    if (window.showTextPreview) window.showTextPreview(index);
}

function clearTypingPreview() {
    // This will be implemented in typeManager
    if (window.clearTypingPreview) window.clearTypingPreview();
}

function showComponentPreview(index) {
    // This will be implemented in componentManager
    if (window.showComponentPreview) window.showComponentPreview(index);
}

function clearComponentPreview() {
    // This will be implemented in componentManager
    if (window.clearComponentPreview) window.clearComponentPreview();
}

function handleComponentClick(index) {
    // This will be implemented in componentManager
    if (window.handleComponentClick) window.handleComponentClick(index);
}

// Placeholder for modal functions
function showAlert(message) {
    if (window.showAlert) window.showAlert(message);
} 
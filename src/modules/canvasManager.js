// Canvas Manager Module
// Handles canvas operations, grid creation, and drawing functionality

import * as DOM from './domElements.js';

// Canvas state
let canvasWidth = 14;
let canvasHeight = 14;
let isDrawing = false;
let isErasing = false;
let isResizing = false;
let resizeHandle = null;
let lastUsedResizeAnchor = null; // Store the last used resize anchor
let resizeStartDimensions = { width: 14, height: 14 };
let resizeStartMouse = { x: 0, y: 0 };
// Remove local currentColor - use global one from main.js
// let currentColor = '#00ff00';
let currentBrushSize = 1;
let currentBrushShape = 'square';

// Reference line state for font editing
let referenceLines = {
    baseline: { y: 12, isVisible: false, isDragging: false },
    vertical: { x: 8, isVisible: false, isDragging: false }
};
let isDraggingReferenceLine = false;
let draggedLineType = null;

// Canvas history for undo/redo
let canvasHistory = [];
let historyIndex = -1;
const MAX_HISTORY = 50;

// Initialize canvas
export function initializeCanvas(width = 14, height = 14) {
    canvasWidth = width;
    canvasHeight = height;
    createGrid();
    updateDimensions();
    saveCanvasState();
}

// Create pixel grid
export function createGrid() {
    // Preserve reference lines container if it exists
    const referenceContainer = document.querySelector('.reference-lines-container');
    console.log('createGrid: Reference container before clearing:', referenceContainer);
    
    DOM.pixelGrid.innerHTML = '';
    console.log('createGrid: Grid cleared, reference container should be preserved');
    DOM.pixelGrid.style.gridTemplateColumns = `repeat(${canvasWidth}, 1fr)`;
    
    // Calculate pixel size based on available space
    // Ensure consistent sizing by using integer division and clamping
    const maxSize = Math.min(400 / canvasWidth, 400 / canvasHeight);
    const pixelSize = Math.max(8, Math.min(32, Math.floor(maxSize)));
    
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
            if (window.currentTool === 'type') {
                showTextPreview(i);
            } else if (window.currentTool === 'draw') {
                showBrushPreview(i);
            }
        });
        
        // Mouse leave event for type tool preview
        pixel.addEventListener('mouseleave', (e) => {
            if (window.currentTool === 'type') {
                clearTypingPreview();
            } else if (window.currentTool === 'draw') {
                clearBrushPreview();
            }
        });
        
        DOM.pixelGrid.appendChild(pixel);
    }
    
    // Add resize handles
    addResizeHandles();
    
    // Initialize width input with arrow key and mouse wheel support
    initializeWidthInput();
    
    // Initialize quick size selectors
    initializeQuickSizeSelectors();
    
    // Prevent context menu
    DOM.pixelGrid.addEventListener('contextmenu', (e) => e.preventDefault());
    
    // Document mouse events for drawing
    document.addEventListener('mouseup', stopDrawing);
    
    // Restore reference lines container if it existed before
    if (referenceContainer) {
        DOM.pixelGrid.appendChild(referenceContainer);
        console.log('Reference lines container restored after grid recreation');
        console.log('createGrid: Container restored, checking if visible:', referenceContainer.style.display);
    } else {
        console.log('createGrid: No reference container to restore');
    }
}

// Update canvas dimensions display
export function updateDimensions() {
    // Update resize handle positions if they exist
    updateResizeHandlePositions();
    
    // Update quick size selectors to show current dimensions
    updateQuickSizeSelectors();
}

// Update resize handle positions after canvas changes
function updateResizeHandlePositions() {
    const handles = document.querySelectorAll('.canvas-resize-handle');
    handles.forEach(handle => {
        // Handles are positioned absolutely relative to the pixel grid
        // They should automatically adjust with the grid size
    });
}

// Reference line management functions
export function showReferenceLines() {
    console.log('showReferenceLines called');
    console.log('Current reference line state:', referenceLines);
    
    referenceLines.baseline.isVisible = true;
    referenceLines.vertical.isVisible = true;
    
    console.log('Reference lines set to visible, calling drawReferenceLines...');
    
    // Try to draw immediately
    if (tryDrawReferenceLines()) {
        console.log('Reference lines drawn successfully on first try');
    } else {
        console.log('Canvas not ready, retrying in 100ms...');
        // Retry after a short delay if canvas isn't ready
        setTimeout(() => {
            if (tryDrawReferenceLines()) {
                console.log('Reference lines drawn successfully on retry');
            } else {
                console.log('Failed to draw reference lines after retry');
            }
        }, 100);
    }
    
    console.log('showReferenceLines completed');
}

// Try to draw reference lines, return true if successful
function tryDrawReferenceLines() {
    // Check if canvas is ready
    const firstPixel = DOM.pixelGrid?.querySelector('.pixel');
    if (!firstPixel) {
        console.log('Canvas not ready yet');
        return false;
    }
    
    const pixelSize = parseInt(getComputedStyle(firstPixel).width);
    if (!pixelSize || pixelSize === 0) {
        console.log('Invalid pixel size');
        return false;
    }
    
    // Canvas is ready, draw the lines
    drawReferenceLines();
    return true;
}

export function hideReferenceLines() {
    referenceLines.baseline.isVisible = false;
    referenceLines.vertical.isVisible = false;
    clearReferenceLines();
}

export function setBaselinePosition(y) {
    // Store the original position without clamping - let the drawing function handle bounds
    referenceLines.baseline.y = y;
    if (referenceLines.baseline.isVisible) {
        drawReferenceLines();
    }
    
    // Save position to current font if in font edit mode
    if (window.getSaveState && window.getSaveState().isFontEditMode) {
        const saveState = window.getSaveState();
        if (saveFontReferenceLinePositions) {
            saveFontReferenceLinePositions(saveState.currentEditingFont, referenceLines.baseline.y, referenceLines.vertical.x);
        }
    }
}

export function setVerticalPosition(x) {
    // Store the original position without clamping - let the drawing function handle bounds
    referenceLines.vertical.x = x;
    if (referenceLines.vertical.isVisible) {
        drawReferenceLines();
    }
    
    // Save position to current font if in font edit mode
    if (window.getSaveState && window.getSaveState().isFontEditMode) {
        const saveState = window.getSaveState();
        if (saveFontReferenceLinePositions) {
            saveFontReferenceLinePositions(saveState.currentEditingFont, referenceLines.baseline.y, referenceLines.vertical.x);
        }
    }
}

export function getReferenceLinePositions() {
    return {
        baseline: referenceLines.baseline.y,
        vertical: referenceLines.vertical.x
    };
}

// Test function to debug reference line state
export function debugReferenceLines() {
    console.log('=== REFERENCE LINES DEBUG ===');
    console.log('Reference line state:', referenceLines);
    console.log('Canvas dimensions:', { width: canvasWidth, height: canvasHeight });
    
    const referenceContainer = document.querySelector('.reference-lines-container');
    console.log('Reference container in DOM:', referenceContainer);
    
    if (referenceContainer) {
        console.log('Container children:', referenceContainer.children.length);
        console.log('Container styles:', {
            display: referenceContainer.style.display,
            visibility: referenceContainer.style.visibility,
            opacity: referenceContainer.style.opacity
        });
    }
    
    const baselineLine = document.querySelector('.baseline-line');
    const verticalLine = document.querySelector('.vertical-line');
    console.log('Individual lines:', { baseline: baselineLine, vertical: verticalLine });
    console.log('=== END DEBUG ===');
}

// Draw reference lines on the canvas
function drawReferenceLines() {
    console.log('drawReferenceLines: Called with visibility:', { 
        baseline: referenceLines.baseline.isVisible, 
        vertical: referenceLines.vertical.isVisible 
    });
    
    if (!referenceLines.baseline.isVisible && !referenceLines.vertical.isVisible) return;
    
    console.log('drawReferenceLines: About to clear existing lines');
    clearReferenceLines();
    
    // Safely get pixel size - check if canvas is ready
    const firstPixel = DOM.pixelGrid.querySelector('.pixel');
    if (!firstPixel) {
        console.log('Canvas not ready yet, cannot draw reference lines');
        return;
    }
    
    const pixelSize = parseInt(getComputedStyle(firstPixel).width);
    if (!pixelSize || pixelSize === 0) {
        console.log('Invalid pixel size, cannot draw reference lines');
        return;
    }
    
    console.log('Drawing reference lines with pixel size:', pixelSize);
    console.log('Canvas dimensions during drawing:', { width: canvasWidth, height: canvasHeight });
    console.log('Reference line positions during drawing:', { 
        baseline: referenceLines.baseline.y, 
        vertical: referenceLines.vertical.x 
    });
    
    // Create reference line container if it doesn't exist
    let referenceContainer = document.querySelector('.reference-lines-container');
    if (!referenceContainer) {
        referenceContainer = document.createElement('div');
        referenceContainer.className = 'reference-lines-container';
        referenceContainer.style.position = 'absolute';
        referenceContainer.style.top = '0';
        referenceContainer.style.left = '0';
        referenceContainer.style.width = '100%';
        referenceContainer.style.height = '100%';
        referenceContainer.style.pointerEvents = 'none';
        referenceContainer.style.zIndex = '1000';
        DOM.pixelGrid.appendChild(referenceContainer);
    }
    
    // Draw horizontal baseline
    if (referenceLines.baseline.isVisible) {
        const baseline = document.createElement('div');
        baseline.className = 'reference-line baseline-line';
        baseline.style.position = 'absolute';
        baseline.style.left = '0';
        
        // Handle out-of-bounds baseline position
        let baselineY = referenceLines.baseline.y;
        if (baselineY < 0) {
            baselineY = 0;
            baseline.style.opacity = '0.4'; // Dimmed to indicate out-of-bounds
        } else if (baselineY >= canvasHeight) {
            baselineY = canvasHeight - 1;
            baseline.style.opacity = '0.4'; // Dimmed to indicate out-of-bounds
        } else {
            baseline.style.opacity = '0.8'; // Normal opacity
        }
        
        baseline.style.top = `${baselineY * pixelSize}px`;
        baseline.style.width = '100%';
        baseline.style.height = '2px';
        baseline.style.backgroundColor = '#ff0000';
        baseline.style.boxShadow = '0 0 4px rgba(255, 0, 0, 0.5)';
        
        console.log('Baseline calculated position:', baselineY * pixelSize, 'px (y:', baselineY, '× pixelSize:', pixelSize, ')');
        
        referenceContainer.appendChild(baseline);
        console.log('Baseline drawn at y:', baselineY, '(original:', referenceLines.baseline.y, ')');
    }
    
    // Draw vertical reference line
    if (referenceLines.vertical.isVisible) {
        const verticalLine = document.createElement('div');
        verticalLine.className = 'reference-line vertical-line';
        verticalLine.style.position = 'absolute';
        
        // Handle out-of-bounds vertical position
        let verticalX = referenceLines.vertical.x;
        if (verticalX < 0) {
            verticalX = 0;
            verticalLine.style.opacity = '0.4'; // Dimmed to indicate out-of-bounds
        } else if (verticalX >= canvasWidth) {
            verticalX = canvasWidth - 1;
            verticalLine.style.opacity = '0.4'; // Dimmed to indicate out-of-bounds
        } else {
            verticalLine.style.opacity = '0.8'; // Normal opacity
        }
        
        verticalLine.style.left = `${verticalX * pixelSize}px`;
        verticalLine.style.top = '0';
        verticalLine.style.width = '2px';
        verticalLine.style.height = '100%';
        verticalLine.style.backgroundColor = '#0000ff';
        verticalLine.style.boxShadow = '0 0 4px rgba(0, 0, 255, 0.5)';
        
        console.log('Vertical line calculated position:', verticalX * pixelSize, 'px (x:', verticalX, '× pixelSize:', pixelSize, ')');
        
        referenceContainer.appendChild(verticalLine);
        console.log('Vertical line drawn at x:', verticalX, '(original:', referenceLines.vertical.x, ')');
    }
    
    // Create single handle at the intersection of both lines
    if (referenceLines.baseline.isVisible && referenceLines.vertical.isVisible) {
        const intersectionHandle = document.createElement('div');
        intersectionHandle.className = 'reference-line-handle intersection-handle';
        intersectionHandle.style.position = 'absolute';
        // Use the adjusted positions for the intersection handle
        let intersectionX = referenceLines.vertical.x;
        let intersectionY = referenceLines.baseline.y;
        
        // Clamp to canvas bounds for intersection handle
        intersectionX = Math.max(0, Math.min(canvasWidth - 1, intersectionX));
        intersectionY = Math.max(0, Math.min(canvasHeight - 1, intersectionY));
        
        intersectionHandle.style.left = `${(intersectionX * pixelSize) - 6}px`;
        intersectionHandle.style.top = `${(intersectionY * pixelSize) - 6}px`;
        intersectionHandle.style.width = '12px';
        intersectionHandle.style.height = '12px';
        intersectionHandle.style.backgroundColor = '#800080'; // Purple to indicate it controls both lines
        intersectionHandle.style.border = '2px solid #ffffff';
        intersectionHandle.style.borderRadius = '2px';
        intersectionHandle.style.cursor = 'move';
        intersectionHandle.style.zIndex = '1001';
        intersectionHandle.style.pointerEvents = 'auto';
        intersectionHandle.style.boxShadow = '0 0 6px rgba(128, 0, 128, 0.7)';
        
        // Add drag event listeners for the intersection handle
        intersectionHandle.addEventListener('mousedown', (e) => startDraggingReferenceLine(e, 'intersection'));
        
        referenceContainer.appendChild(intersectionHandle);
        console.log('Intersection handle created at:', intersectionX, intersectionY, '(original:', referenceLines.vertical.x, referenceLines.baseline.y, ')');
    }
}

// Clear reference lines from the canvas
function clearReferenceLines() {
    const referenceContainer = document.querySelector('.reference-lines-container');
    if (referenceContainer) {
        console.log('clearReferenceLines: Removing reference container');
        referenceContainer.remove();
    } else {
        console.log('clearReferenceLines: No reference container found to clear');
    }
}

// Start dragging reference line
function startDraggingReferenceLine(e, lineType) {
    e.preventDefault();
    e.stopPropagation();
    
    isDraggingReferenceLine = true;
    draggedLineType = lineType;
    
    if (lineType === 'intersection') {
        // When dragging the intersection handle, both lines are being dragged
        referenceLines.baseline.isDragging = true;
        referenceLines.vertical.isDragging = true;
    } else {
        referenceLines[lineType].isDragging = true;
    }
    
    // Add drag event listeners
    document.addEventListener('mousemove', handleReferenceLineDrag);
    document.addEventListener('mouseup', stopDraggingReferenceLine);
}

// Handle reference line dragging
function handleReferenceLineDrag(e) {
    if (!isDraggingReferenceLine || !draggedLineType) return;
    
    const pixelSize = parseInt(getComputedStyle(DOM.pixelGrid.querySelector('.pixel')).width);
    const rect = DOM.pixelGrid.getBoundingClientRect();
    
    if (draggedLineType === 'baseline') {
        const newY = Math.round((e.clientY - rect.top) / pixelSize);
        setBaselinePosition(newY);
    } else if (draggedLineType === 'vertical') {
        const newX = Math.round((e.clientX - rect.left) / pixelSize);
        setVerticalPosition(newX);
    } else if (draggedLineType === 'intersection') {
        const newX = Math.round((e.clientX - rect.left) / pixelSize);
        const newY = Math.round((e.clientY - rect.top) / pixelSize);
        setBaselinePosition(newY);
        setVerticalPosition(newX);
    }
}

// Stop dragging reference line
function stopDraggingReferenceLine() {
    if (draggedLineType === 'intersection') {
        // When stopping drag on intersection handle, stop dragging for both lines
        referenceLines.baseline.isDragging = false;
        referenceLines.vertical.isDragging = false;
    } else if (draggedLineType) {
        referenceLines[draggedLineType].isDragging = false;
    }
    
    isDraggingReferenceLine = false;
    draggedLineType = null;
    
    // Remove drag event listeners
    document.removeEventListener('mousemove', handleReferenceLineDrag);
    document.removeEventListener('mouseup', stopDraggingReferenceLine);
}

// Show resize preview with moving green border and grid preview
function showResizePreview(newWidth, newHeight) {
    // Clear any existing preview
    clearResizePreview();
    
    if (newWidth === canvasWidth && newHeight === canvasHeight) {
        return; // No change, no preview needed
    }
    
    // Create preview container
    const previewContainer = document.createElement('div');
    previewContainer.className = 'resize-preview-container';
    previewContainer.style.position = 'absolute';
    previewContainer.style.pointerEvents = 'none';
    previewContainer.style.zIndex = '999';

    
    // Calculate preview position and size
    // Use the stored pixel size from when resize started for consistent positioning
    const currentPixelSize = window.resizeStartPixelSize || parseInt(getComputedStyle(DOM.pixelGrid.querySelector('.pixel')).width);
    
    // Calculate what the new pixel size would be based on the new dimensions
    // This calculation happens once and is stored for the preview
    // Use the same integer division logic as createGrid for consistency
    const maxSize = Math.min(400 / newWidth, 400 / newHeight);
    const newPixelSize = Math.max(8, Math.min(32, Math.floor(maxSize)));
    
    let previewLeft, previewTop, previewWidth, previewHeight;
    
    // Calculate preview position based on resize handle direction
    // This ensures the preview appears in the correct location for each handle
    
    switch (resizeHandle) {
        case 'top-left':
            // Preview expands to the left and up, so position it at the new top-left
            previewLeft = (canvasWidth - newWidth) * currentPixelSize;
            previewTop = (canvasHeight - newHeight) * currentPixelSize;
            break;
        case 'top-right':
            // Preview expands to the right and up, so position it at the current top-left
            previewLeft = 0;
            previewTop = (canvasHeight - newHeight) * currentPixelSize;
            break;
        case 'bottom-left':
            // Preview expands to the left and down, so position it at the new left edge
            previewLeft = (canvasWidth - newWidth) * currentPixelSize;
            previewTop = 0;
            break;
        case 'bottom-right':
            // Preview expands to the right and down, so position it at the current top-left
            previewLeft = 0;
            previewTop = 0;
            break;
    }
    
    // For perfect grid alignment, the preview must be exactly sized to match the grid
    // This ensures the preview squares align perfectly with the actual canvas pixels
    previewWidth = newWidth * currentPixelSize;
    previewHeight = newHeight * currentPixelSize;
    
    // Apply preview container styles
    previewContainer.style.left = `${previewLeft}px`;
    previewContainer.style.top = `${previewTop}px`;
    previewContainer.style.width = `${previewWidth}px`;
    previewContainer.style.height = `${previewHeight}px`;
    
    // Create preview border - only show when shrinking (cropping) the canvas
    if (newWidth < canvasWidth || newHeight < canvasHeight) {
        const previewBorder = document.createElement('div');
        previewBorder.className = 'resize-preview-border';
        previewBorder.style.position = 'absolute';
        previewBorder.style.border = '2px solid #00ff00';
        previewBorder.style.top = '0';
        previewBorder.style.left = '0';
        previewBorder.style.width = '100%';
        previewBorder.style.height = '100%';
        
        // Add border to container
        previewContainer.appendChild(previewBorder);
        
        // For shrinking, also show grid lines to indicate the cropping area
        createGridPreview(previewContainer, newWidth, newHeight, currentPixelSize);
    }
    
    // Create grid preview for additional squares (only when expanding)
    if (newWidth > canvasWidth || newHeight > canvasHeight) {
        createGridPreview(previewContainer, newWidth, newHeight, currentPixelSize);
    }
    
    // Add to pixel grid
    DOM.pixelGrid.appendChild(previewContainer);
    
    // Store reference for cleanup
    window.currentResizePreview = previewContainer;
}

// Create grid preview showing additional squares
function createGridPreview(container, newWidth, newHeight, pixelSize) {
    // Create grid lines for the preview area
    const gridContainer = document.createElement('div');
    gridContainer.className = 'resize-grid-preview';
    gridContainer.style.position = 'absolute';
    gridContainer.style.top = '0';
    gridContainer.style.left = '0';
    gridContainer.style.width = '100%';
    gridContainer.style.height = '100%';
    gridContainer.style.pointerEvents = 'none';
    
    // Create vertical grid lines for the entire preview area
    // Use the current pixel size to match existing canvas grid
    for (let x = 0; x <= newWidth; x++) {
        const line = document.createElement('div');
        line.className = 'grid-line grid-line-vertical';
        line.style.position = 'absolute';
        line.style.left = `${x * pixelSize}px`;
        line.style.top = '0';
        line.style.width = '1px';
        line.style.height = '100%';
        line.style.backgroundColor = '#333333';
        line.style.opacity = '0.6';
        gridContainer.appendChild(line);
    }
    
    // Create horizontal grid lines for the entire preview area
    // Use the current pixel size to match existing canvas grid
    for (let y = 0; y <= newHeight; y++) {
        const line = document.createElement('div');
        line.className = 'grid-line grid-line-horizontal';
        line.style.position = 'absolute';
        line.style.left = '0';
        line.style.top = `${y * pixelSize}px`;
        line.style.width = '100%';
        line.style.height = '1px';
        line.style.backgroundColor = '#333333';
        line.style.opacity = '0.6';
        gridContainer.appendChild(line);
    }
    
    // Create individual pixel preview squares for the new area
    // Use the current pixel size to match existing canvas squares
    createPixelPreviewSquares(gridContainer, newWidth, newHeight, pixelSize);
    
    // Add grid container to preview
    container.appendChild(gridContainer);
}

// Create individual pixel preview squares
function createPixelPreviewSquares(container, newWidth, newHeight, pixelSize) {
    // Show preview squares for the new areas based on resize handle direction
    // This gives users a complete preview of how the expanded canvas will look
    // Use the current pixel size to match existing canvas squares exactly
    
    // Only apply multi-directional logic when EXPANDING the canvas
    if (newWidth > canvasWidth || newHeight > canvasHeight) {
        // Handle each resize direction separately for accurate preview positioning
        switch (resizeHandle) {
            case 'top-left':
                createTopLeftPreviewSquares(container, newWidth, newHeight, pixelSize);
                break;
            case 'top-right':
                createTopRightPreviewSquares(container, newWidth, newHeight, pixelSize);
                break;
            case 'bottom-left':
                createBottomLeftPreviewSquares(container, newWidth, newHeight, pixelSize);
                break;
            case 'bottom-right':
                createBottomRightPreviewSquares(container, newWidth, newHeight, pixelSize);
                break;
        }
    } else {
        // For shrinking (cropping), show just two green lines representing the new canvas edges
        // This makes it look like the green canvas border is moving inward
        
        // Right edge line (vertical)
        const rightEdgeLine = document.createElement('div');
        rightEdgeLine.className = 'preview-edge-line';
        rightEdgeLine.style.position = 'absolute';
        rightEdgeLine.style.left = `${newWidth * pixelSize}px`;
        rightEdgeLine.style.top = '0px';
        rightEdgeLine.style.width = '2px';
        rightEdgeLine.style.height = `${newHeight * pixelSize}px`;
        rightEdgeLine.style.backgroundColor = '#00ff00';
        container.appendChild(rightEdgeLine);
        
        // Bottom edge line (horizontal)
        const bottomEdgeLine = document.createElement('div');
        bottomEdgeLine.className = 'preview-edge-line';
        bottomEdgeLine.style.position = 'absolute';
        bottomEdgeLine.style.left = '0px';
        bottomEdgeLine.style.top = `${newHeight * pixelSize}px`;
        bottomEdgeLine.style.width = `${newWidth * pixelSize}px`;
        bottomEdgeLine.style.height = '2px';
        bottomEdgeLine.style.backgroundColor = '#00ff00';
        container.appendChild(bottomEdgeLine);
    }
}

// Create preview squares for top-left resize (expanding left and up)
function createTopLeftPreviewSquares(container, newWidth, newHeight, pixelSize) {
    // For top-left, we need to show squares for the areas that are new (left and up expansion)
    // The preview container is positioned to cover the entire new canvas area
    
    // Calculate how much we're expanding in each direction
    const leftExpansion = newWidth - canvasWidth;  // Fixed: was backwards
    const upExpansion = newHeight - canvasHeight;  // Fixed: was backwards
    
    // Show squares for left expansion (new columns on the left)
    for (let y = 0; y < newHeight; y++) {
        for (let x = 0; x < leftExpansion; x++) {
            const pixelSquare = document.createElement('div');
            pixelSquare.className = 'preview-pixel-square';
            pixelSquare.style.position = 'absolute';
            pixelSquare.style.left = `${x * pixelSize}px`;
            pixelSquare.style.top = `${y * pixelSize}px`;
            pixelSquare.style.width = `${pixelSize}px`;
            pixelSquare.style.height = `${pixelSize}px`;
            pixelSquare.style.backgroundColor = 'rgba(100, 0, 0, 0.4)';
            pixelSquare.style.border = '1px solid rgba(255, 0, 0, 0.3)';
            pixelSquare.style.boxSizing = 'border-box';
            container.appendChild(pixelSquare);
        }
    }
    
    // Show squares for up expansion (new rows on top)
    for (let y = 0; y < upExpansion; y++) {
        for (let x = 0; x < newWidth; x++) {
            const pixelSquare = document.createElement('div');
            pixelSquare.className = 'preview-pixel-square';
            pixelSquare.style.position = 'absolute';
            pixelSquare.style.left = `${x * pixelSize}px`;
            pixelSquare.style.top = `${y * pixelSize}px`;
            pixelSquare.style.width = `${pixelSize}px`;
            pixelSquare.style.height = `${pixelSize}px`;
            pixelSquare.style.backgroundColor = 'rgba(0, 0, 100, 0.4)';
            pixelSquare.style.border = '1px solid rgba(0, 0, 255, 0.3)';
            pixelSquare.style.boxSizing = 'border-box';
            container.appendChild(pixelSquare);
        }
    }
    
    // Show squares for diagonal expansion (overlap area)
    for (let y = 0; y < upExpansion; y++) {
        for (let x = 0; x < leftExpansion; x++) {
            const pixelSquare = document.createElement('div');
            pixelSquare.className = 'preview-pixel-square';
            pixelSquare.style.position = 'absolute';
            pixelSquare.style.left = `${x * pixelSize}px`;
            pixelSquare.style.top = `${y * pixelSize}px`;
            pixelSquare.style.width = `${pixelSize}px`;
            pixelSquare.style.height = `${pixelSize}px`;
            pixelSquare.style.backgroundColor = 'rgba(0, 150, 255, 0.4)';
            pixelSquare.style.border = '1px solid rgba(0, 200, 255, 0.3)';
            pixelSquare.style.boxSizing = 'border-box';
            container.appendChild(pixelSquare);
        }
    }
}

// Create preview squares for top-right resize (expanding right and up)
function createTopRightPreviewSquares(container, newWidth, newHeight, pixelSize) {
    // For top-right, we need to show squares for the areas that are new (right and up expansion)
    
    // Calculate how much we're expanding in each direction
    const rightExpansion = newWidth - canvasWidth;
    const upExpansion = newHeight - canvasHeight;  // Fixed: was backwards
    
    // Show squares for right expansion (new columns on the right)
    for (let y = 0; y < newHeight; y++) {
        for (let x = 0; x < rightExpansion; x++) {
            const pixelSquare = document.createElement('div');
            pixelSquare.className = 'preview-pixel-square';
            pixelSquare.style.position = 'absolute';
            pixelSquare.style.left = `${(canvasWidth + x) * pixelSize}px`;
            pixelSquare.style.top = `${y * pixelSize}px`;
            pixelSquare.style.width = `${pixelSize}px`;
            pixelSquare.style.height = `${pixelSize}px`;
            pixelSquare.style.backgroundColor = 'rgba(100, 0, 0, 0.4)';
            pixelSquare.style.border = '1px solid rgba(255, 0, 0, 0.3)';
            pixelSquare.style.boxSizing = 'border-box';
            container.appendChild(pixelSquare);
        }
    }
    
    // Show squares for up expansion (new rows on top)
    for (let y = 0; y < upExpansion; y++) {
        for (let x = 0; x < newWidth; x++) {
            const pixelSquare = document.createElement('div');
            pixelSquare.className = 'preview-pixel-square';
            pixelSquare.style.position = 'absolute';
            pixelSquare.style.left = `${x * pixelSize}px`;
            pixelSquare.style.top = `${y * pixelSize}px`;
            pixelSquare.style.width = `${pixelSize}px`;
            pixelSquare.style.height = `${pixelSize}px`;
            pixelSquare.style.backgroundColor = 'rgba(0, 0, 100, 0.4)';
            pixelSquare.style.border = '1px solid rgba(0, 0, 255, 0.3)';
            pixelSquare.style.boxSizing = 'border-box';
            container.appendChild(pixelSquare);
        }
    }
    
    // Show squares for diagonal expansion (overlap area)
    for (let y = 0; y < upExpansion; y++) {
        for (let x = 0; x < rightExpansion; x++) {
            const pixelSquare = document.createElement('div');
            pixelSquare.className = 'preview-pixel-square';
            pixelSquare.style.position = 'absolute';
            pixelSquare.style.left = `${(canvasWidth + x) * pixelSize}px`;
            pixelSquare.style.top = `${y * pixelSize}px`;
            pixelSquare.style.width = `${pixelSize}px`;
            pixelSquare.style.height = `${pixelSize}px`;
            pixelSquare.style.backgroundColor = 'rgba(0, 150, 255, 0.4)';
            pixelSquare.style.border = '1px solid rgba(0, 200, 255, 0.3)';
            pixelSquare.style.boxSizing = 'border-box';
            container.appendChild(pixelSquare);
        }
    }
}

// Create preview squares for bottom-left resize (expanding left and down)
function createBottomLeftPreviewSquares(container, newWidth, newHeight, pixelSize) {
    // For bottom-left, we need to show squares for the areas that are new (left and down expansion)
    
    // Calculate how much we're expanding in each direction
    const leftExpansion = newWidth - canvasWidth;  // Fixed: was backwards
    const downExpansion = newHeight - canvasHeight;
    
    // Show squares for left expansion (new columns on the left)
    for (let y = 0; y < newHeight; y++) {
        for (let x = 0; x < leftExpansion; x++) {
            const pixelSquare = document.createElement('div');
            pixelSquare.className = 'preview-pixel-square';
            pixelSquare.style.position = 'absolute';
            pixelSquare.style.left = `${x * pixelSize}px`;
            pixelSquare.style.top = `${y * pixelSize}px`;
            pixelSquare.style.width = `${pixelSize}px`;
            pixelSquare.style.height = `${pixelSize}px`;
            pixelSquare.style.backgroundColor = 'rgba(100, 0, 0, 0.4)';
            pixelSquare.style.border = '1px solid rgba(255, 0, 0, 0.3)';
            pixelSquare.style.boxSizing = 'border-box';
            container.appendChild(pixelSquare);
        }
    }
    
    // Show squares for down expansion (new rows on bottom)
    for (let y = 0; y < downExpansion; y++) {
        for (let x = 0; x < newWidth; x++) {
            const pixelSquare = document.createElement('div');
            pixelSquare.className = 'preview-pixel-square';
            pixelSquare.style.position = 'absolute';
            pixelSquare.style.left = `${x * pixelSize}px`;
            pixelSquare.style.top = `${(canvasHeight + y) * pixelSize}px`;
            pixelSquare.style.width = `${pixelSize}px`;
            pixelSquare.style.height = `${pixelSize}px`;
            pixelSquare.style.backgroundColor = 'rgba(0, 0, 100, 0.4)';
            pixelSquare.style.border = '1px solid rgba(0, 0, 255, 0.3)';
            pixelSquare.style.boxSizing = 'border-box';
            container.appendChild(pixelSquare);
        }
    }
    
    // Show squares for diagonal expansion (overlap area)
    for (let y = 0; y < downExpansion; y++) {
        for (let x = 0; x < leftExpansion; x++) {
            const pixelSquare = document.createElement('div');
            pixelSquare.className = 'preview-pixel-square';
            pixelSquare.style.position = 'absolute';
            pixelSquare.style.left = `${x * pixelSize}px`;
            pixelSquare.style.top = `${(canvasHeight + y) * pixelSize}px`;
            pixelSquare.style.width = `${pixelSize}px`;
            pixelSquare.style.height = `${pixelSize}px`;
            pixelSquare.style.backgroundColor = 'rgba(0, 150, 255, 0.4)';
            pixelSquare.style.border = '1px solid rgba(0, 200, 255, 0.3)';
            pixelSquare.style.boxSizing = 'border-box';
            container.appendChild(pixelSquare);
        }
    }
}

// Create preview squares for bottom-right resize (expanding right and down)
function createBottomRightPreviewSquares(container, newWidth, newHeight, pixelSize) {
    // For bottom-right, we need to show squares for the areas that are new (right and down expansion)
    
    // Calculate how much we're expanding in each direction
    const rightExpansion = newWidth - canvasWidth;
    const downExpansion = newHeight - canvasHeight;
    
    // Show squares for right expansion (new columns on the right)
    for (let y = 0; y < newHeight; y++) {
        for (let x = 0; x < rightExpansion; x++) {
            const pixelSquare = document.createElement('div');
            pixelSquare.className = 'preview-pixel-square';
            pixelSquare.style.position = 'absolute';
            pixelSquare.style.left = `${(canvasWidth + x) * pixelSize}px`;
            pixelSquare.style.top = `${y * pixelSize}px`;
            pixelSquare.style.width = `${pixelSize}px`;
            pixelSquare.style.height = `${pixelSize}px`;
            pixelSquare.style.backgroundColor = 'rgba(100, 0, 0, 0.4)';
            pixelSquare.style.border = '1px solid rgba(255, 0, 0, 0.3)';
            pixelSquare.style.boxSizing = 'border-box';
            container.appendChild(pixelSquare);
        }
    }
    
    // Show squares for down expansion (new rows on bottom)
    for (let y = 0; y < downExpansion; y++) {
        for (let x = 0; x < newWidth; x++) {
            const pixelSquare = document.createElement('div');
            pixelSquare.className = 'preview-pixel-square';
            pixelSquare.style.position = 'absolute';
            pixelSquare.style.left = `${x * pixelSize}px`;
            pixelSquare.style.top = `${(canvasHeight + y) * pixelSize}px`;
            pixelSquare.style.width = `${pixelSize}px`;
            pixelSquare.style.height = `${pixelSize}px`;
            pixelSquare.style.backgroundColor = 'rgba(0, 0, 100, 0.4)';
            pixelSquare.style.border = '1px solid rgba(0, 0, 255, 0.3)';
            pixelSquare.style.boxSizing = 'border-box';
            container.appendChild(pixelSquare);
        }
    }
    
    // Show squares for diagonal expansion (overlap area)
    for (let y = 0; y < downExpansion; y++) {
        for (let x = 0; x < rightExpansion; x++) {
            const pixelSquare = document.createElement('div');
            pixelSquare.className = 'preview-pixel-square';
            pixelSquare.style.position = 'absolute';
            pixelSquare.style.left = `${(canvasWidth + x) * pixelSize}px`;
            pixelSquare.style.top = `${(canvasHeight + y) * pixelSize}px`;
            pixelSquare.style.width = `${pixelSize}px`;
            pixelSquare.style.height = `${pixelSize}px`;
            pixelSquare.style.backgroundColor = 'rgba(0, 150, 255, 0.4)';
            pixelSquare.style.border = '1px solid rgba(0, 200, 255, 0.3)';
            pixelSquare.style.boxSizing = 'border-box';
            container.appendChild(pixelSquare);
        }
    }
}

// Clear resize preview
function clearResizePreview() {
    if (window.currentResizePreview) {
        window.currentResizePreview.remove();
        window.currentResizePreview = null;
    }
}

// Apply new dimensions
export function applyDimensions() {
    let newWidth = parseInt(DOM.widthInput.value);
    let newHeight = parseInt(DOM.heightInput.value);
    
    // Validate dimensions
    if (newWidth >= 1 && newWidth <= 480 && newHeight >= 1 && newHeight <= 480) {
        saveCanvasState();
        canvasWidth = newWidth;
        canvasHeight = newHeight;
        updateDimensions();
        createGrid();
        
        // Reference lines container is preserved during grid recreation, so no need to redraw
        // The lines will automatically adjust to the new canvas dimensions
        
        if (window.updateExportCode) window.updateExportCode();
    } else {
        showAlert('Canvas dimensions must be between 1 and 480 pixels.');
    }
}

// Initialize width input with arrow key and mouse wheel support for any increment
export function initializeWidthInput() {
    if (DOM.widthInput) {
        // Handle arrow key presses (up/down arrows) - completely override default behavior
        DOM.widthInput.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
                e.preventDefault();
                e.stopPropagation();
                e.stopImmediatePropagation();
                
                const currentValue = parseInt(DOM.widthInput.value) || 16;
                let newValue;
                
                if (e.key === 'ArrowUp') {
                    newValue = Math.min(480, currentValue + 1);
                } else {
                    newValue = Math.max(1, currentValue - 1);
                }
                
                DOM.widthInput.value = newValue;
                
                return false;
            }
        }, true); // Use capture phase to intercept before default behavior
        
        // Handle mouse wheel events - completely override default behavior
        DOM.widthInput.addEventListener('wheel', (e) => {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
            
            const currentValue = parseInt(DOM.widthInput.value) || 16;
            let newValue;
            
            if (e.deltaY < 0) {
                // Scroll up - increase width
                newValue = Math.min(480, currentValue + 1);
            } else {
                // Scroll down - decrease width
                newValue = Math.max(1, currentValue - 1);
            }
            
            DOM.widthInput.value = newValue;
            
            return false;
        }, true); // Use capture phase to intercept before default behavior
        
        // Handle input event to ensure value is within bounds
        DOM.widthInput.addEventListener('input', (e) => {
            const value = parseInt(e.target.value) || 16;
            const clampedValue = Math.min(480, Math.max(1, value));
            
            // Only update if the value actually changed
            if (clampedValue !== value) {
                e.target.value = clampedValue;
            }
        });
        
        // Handle change event to ensure value is within bounds
        DOM.widthInput.addEventListener('change', (e) => {
            let value = parseInt(e.target.value) || 16;
            
            // Clamp to valid range
            value = Math.min(480, Math.max(1, value));
            
            e.target.value = value;
        });
    }
}

// Initialize quick size selectors
function initializeQuickSizeSelectors() {
    // Initialize quick width selector
    if (DOM.quickWidthSelector) {
        DOM.quickWidthSelector.addEventListener('change', (e) => {
            const selectedWidth = parseInt(e.target.value);
            if (selectedWidth && selectedWidth >= 1 && selectedWidth <= 480) {
                console.log('Quick width selected:', selectedWidth);
                
                // Set the width to the selected value
                if (DOM.widthInput) DOM.widthInput.value = selectedWidth;
                
                // Automatically apply the new dimensions
                console.log('Applying new dimensions automatically...');
                applyDimensions();
                
                // Visual feedback - briefly highlight the apply button
                if (DOM.applyDimensionsBtn) {
                    DOM.applyDimensionsBtn.classList.add('applied');
                    setTimeout(() => {
                        DOM.applyDimensionsBtn.classList.remove('applied');
                    }, 500);
                }
                
                // Don't reset selector - keep showing the selected value
                // This helps users see what preset they're using
            } else if (e.target.value === '') {
                // Manual input selected - do nothing, let user type
                console.log('Manual width input selected');
            } else {
                console.warn('Invalid width selected:', e.target.value);
                // Reset to current value
                e.target.value = '';
            }
        });
    }
    
    // Initialize quick height selector
    if (DOM.quickHeightSelector) {
        DOM.quickHeightSelector.addEventListener('change', (e) => {
            const selectedHeight = parseInt(e.target.value);
            if (selectedHeight && selectedHeight >= 1 && selectedHeight <= 480) {
                console.log('Quick height selected:', selectedHeight);
                
                // Set the height to the selected value
                if (DOM.heightInput) DOM.heightInput.value = selectedHeight;
                
                // Automatically apply the new dimensions
                console.log('Applying new dimensions automatically...');
                applyDimensions();
                
                // Visual feedback - briefly highlight the apply button
                if (DOM.applyDimensionsBtn) {
                    DOM.applyDimensionsBtn.classList.add('applied');
                    setTimeout(() => {
                        DOM.applyDimensionsBtn.classList.remove('applied');
                    }, 500);
                }
                
                // Don't reset selector - keep showing the selected value
                // This helps users see what preset they're using
            } else if (e.target.value === '') {
                // Manual input selected - do nothing, let user type
                console.log('Manual height input selected');
            } else {
                console.warn('Invalid height selected:', e.target.value);
                // Reset to current value
                e.target.value = '';
            }
        });
    }
}

// Drawing functions
function startDrawing(e, index) {
    if (window.currentTool === 'type') return;
    
    e.preventDefault();
    isDrawing = true;
    
    // Clear brush preview when starting to draw
    if (window.currentTool === 'draw') {
        clearBrushPreview();
    }
    
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
        // Use global currentColor from main.js
        const color = window.currentColor || '#ffffff';
        pixel.style.backgroundColor = color;
        // Hide any ghost pixel at this position
        hideGhostPixelAtPosition(pixel);
    } else if (window.currentTool === 'erase') {
        pixel.style.backgroundColor = '#000000';
        // Hide any ghost pixel at this position
        hideGhostPixelAtPosition(pixel);
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

// Brush preview functions
function showBrushPreview(centerIndex) {
    if (window.currentTool !== 'draw') return;
    
    clearBrushPreview();
    
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
                    const pixel = document.querySelector(`.pixel[data-index="${pixelIndex}"]`);
                    if (pixel) {
                        pixel.classList.add('brush-preview');
                    }
                }
            }
        }
    }
}

export function clearBrushPreview() {
    const previewPixels = document.querySelectorAll('.pixel.brush-preview');
    previewPixels.forEach(pixel => {
        pixel.classList.remove('brush-preview');
    });
}

// Hide ghost pixel at a specific position
export function hideGhostPixelAtPosition(pixel) {
    if (!pixel) return;
    
    // Get the pixel's position relative to the canvas
    const rect = pixel.getBoundingClientRect();
    const pixelGrid = document.querySelector('.pixel-grid');
    if (!pixelGrid) return;
    
    const gridRect = pixelGrid.getBoundingClientRect();
    const x = rect.left - gridRect.left;
    const y = rect.top - gridRect.top;
    
    // Find and hide any ghost pixel at this exact position
    const ghostPixels = document.querySelectorAll('.ghost-pixel');
    ghostPixels.forEach(ghostPixel => {
        const ghostRect = ghostPixel.getBoundingClientRect();
        const ghostX = ghostRect.left - gridRect.left;
        const ghostY = ghostRect.top - gridRect.top;
        
        // If ghost pixel is at the same position, hide it
        if (Math.abs(ghostX - x) < 2 && Math.abs(ghostY - y) < 2) {
            ghostPixel.style.display = 'none';
        }
    });
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
        
        // Hide any ghost pixel at this position
        hideGhostPixelAtPosition(pixel);
        
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

// Clear canvas without clearing reference lines
export function clearCanvasWithoutReferenceLines() {
    console.log('clearCanvasWithoutReferenceLines called - starting canvas clear operation');
    
    const pixels = document.querySelectorAll('.pixel');
    pixels.forEach(pixel => {
        pixel.style.backgroundColor = '#000000';
    });
    
    console.log('Canvas pixels cleared to black');
    
    // Clear component states to prevent ghost components
    if (window.clearAllPlacedComponents) {
        console.log('Calling clearAllPlacedComponents');
        window.clearAllPlacedComponents();
    }
    
    // Always ensure global component reference is cleared
    window.placedComponents = [];
    console.log('Global placedComponents reference cleared');
    
    // NOTE: Reference lines are NOT cleared here - they are preserved
    
    // Clear ghost preview when clearing canvas
    if (window.clearGhostPreview) {
        window.clearGhostPreview();
    }
    
    // Update export code after everything is cleared
    if (window.updateExportCode) {
        console.log('Calling updateExportCode');
        window.updateExportCode();
    }
    
    console.log('Canvas clear operation completed (reference lines preserved)');
}

// Clear canvas (original function that clears everything including reference lines)
export function clearCanvas() {
    console.log('clearCanvas called - starting canvas clear operation');
    
    const pixels = document.querySelectorAll('.pixel');
    pixels.forEach(pixel => {
        pixel.style.backgroundColor = '#000000';
    });
    
    console.log('Canvas pixels cleared to black');
    
    // Clear component states to prevent ghost components
    if (window.clearAllPlacedComponents) {
        console.log('Calling clearAllPlacedComponents');
        window.clearAllPlacedComponents();
    }
    
    // Always ensure global component reference is cleared
    window.placedComponents = [];
    console.log('Global placedComponents reference cleared');
    
    // Clear reference lines when clearing canvas
    clearReferenceLines();
    
    // Clear ghost preview when clearing canvas
    if (window.clearGhostPreview) {
        window.clearGhostPreview();
    }
    
    // Update export code after everything is cleared
    if (window.updateExportCode) {
        console.log('Calling updateExportCode');
        window.updateExportCode();
    }
    
    console.log('Canvas clear operation completed');
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
    
    // Preserve reference lines container if it exists
    const referenceContainer = document.querySelector('.reference-lines-container');
    console.log('loadDataToCanvas: Preserving reference container:', referenceContainer);
    
    // Clear canvas first (but don't clear reference lines)
    clearCanvasWithoutReferenceLines();
    
    // Resize canvas if needed
    if (width !== canvasWidth || height !== canvasHeight) {
        console.log('Resizing canvas from', canvasWidth, 'x', canvasHeight, 'to', width, 'x', height);
        
        // Allow any valid dimensions
        let adjustedWidth = width;
        let adjustedHeight = height;
        
        // Clamp to valid range
        adjustedWidth = Math.min(480, Math.max(1, adjustedWidth));
        adjustedHeight = Math.min(480, Math.max(1, adjustedHeight));
        
        canvasWidth = adjustedWidth;
        canvasHeight = adjustedHeight;
        updateDimensions();
        createGrid();
        
        // Restore reference lines container after grid recreation
        if (referenceContainer) {
            DOM.pixelGrid.appendChild(referenceContainer);
            console.log('loadDataToCanvas: Reference container restored after grid recreation');
        }
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
    console.log('=== GET CANVAS DATA DEBUG START ===');
    
    const pixels = document.querySelectorAll('.pixel');
    console.log('Found pixels in DOM:', pixels.length);
    
    const baseCanvasData = Array.from(pixels).map(pixel => pixel.style.backgroundColor || '#000000');
    console.log('Base canvas data extracted:', {
        length: baseCanvasData.length,
        firstFewColors: baseCanvasData.slice(0, 10),
        lastFewColors: baseCanvasData.slice(-10)
    });
    
    // Debug: Check what colors are actually in the DOM
    const nonBlackPixels = baseCanvasData.filter(color => color !== '#000000' && color !== 'rgb(0, 0, 0)' && color !== '');
    console.log('getCanvasData: Found non-black pixels:', nonBlackPixels.length, 'colors:', nonBlackPixels.slice(0, 5));
    
    // Debug logging
    console.log('getCanvasData called:', {
        hasPlacedComponents: window.placedComponents && window.placedComponents.length > 0,
        placedComponentsCount: window.placedComponents ? window.placedComponents.length : 0,
        baseCanvasDataLength: baseCanvasData.length
    });
    
    // If there are placed components, we need to merge them with the base canvas
    if (window.placedComponents && window.placedComponents.length > 0) {
        console.log('Merging with placed components...');
        const mergedData = mergeCanvasWithComponents(baseCanvasData);
        console.log('Returning merged data with components');
        console.log('=== GET CANVAS DATA DEBUG END ===');
        return mergedData;
    }
    
    // Ensure we return clean canvas data when no components are present
    console.log('Returning clean base canvas data');
    console.log('=== GET CANVAS DATA DEBUG END ===');
    return baseCanvasData;
}

// Merge base canvas data with placed components
function mergeCanvasWithComponents(baseCanvasData) {
    const { width: canvasWidth, height: canvasHeight } = getCanvasDimensions();
    const mergedData = [...baseCanvasData];
    
    // Get placed components from the global scope
    const placedComponents = window.placedComponents || [];
    
    // Apply each placed component to the merged data
    placedComponents.forEach(component => {
        if (component && component.data && component.x !== undefined && component.y !== undefined) {
            for (let y = 0; y < component.height; y++) {
                for (let x = 0; x < component.width; x++) {
                    const componentPixelIndex = y * component.width + x;
                    const componentColor = component.data[componentPixelIndex];
                    
                    if (componentColor && componentColor !== '#000000') {
                        const canvasX = component.x + x;
                        const canvasY = component.y + y;
                        
                        if (canvasX < canvasWidth && canvasY < canvasHeight) {
                            const canvasPixelIndex = canvasY * canvasWidth + canvasX;
                            mergedData[canvasPixelIndex] = componentColor;
                        }
                    }
                }
            }
        }
    });
    
    return mergedData;
}

// Get canvas dimensions
export function getCanvasDimensions() {
    return { width: canvasWidth, height: canvasHeight };
}

// Set brush properties
export function setBrushProperties(color, size, shape) {
    // Update global currentColor for other modules to access
    if (window.currentColor !== undefined) {
        window.currentColor = color;
    }
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

// Add resize handles to canvas corners
function addResizeHandles() {
    // Remove existing handles first
    const existingHandles = document.querySelectorAll('.canvas-resize-handle');
    existingHandles.forEach(handle => handle.remove());
    
    // Create resize handles for each corner
    const corners = [
        { position: 'top-left', cursor: 'nw-resize' },
        { position: 'top-right', cursor: 'ne-resize' },
        { position: 'bottom-left', cursor: 'sw-resize' },
        { position: 'bottom-right', cursor: 'se-resize' }
    ];
    
    corners.forEach(corner => {
        const handle = document.createElement('div');
        handle.className = `canvas-resize-handle canvas-resize-${corner.position}`;
        handle.dataset.position = corner.position;
        handle.style.cursor = corner.cursor;
        
        // Add event listeners
        handle.addEventListener('mousedown', (e) => startResize(e, corner.position));
        
        DOM.pixelGrid.appendChild(handle);
    });
}

// Start canvas resize operation
function startResize(e, position) {
    console.log('=== startResize DEBUG START ===');
    console.log('startResize called:', { position, e: e.type });
    
    e.preventDefault();
    e.stopPropagation();
    
    isResizing = true;
    resizeHandle = position;
    lastUsedResizeAnchor = position; // Store the anchor for later use
    console.log('Resize state set:');
    console.log('  isResizing:', isResizing);
    console.log('  resizeHandle:', resizeHandle);
    console.log('  lastUsedResizeAnchor:', lastUsedResizeAnchor);
    
    resizeStartDimensions = { width: canvasWidth, height: canvasHeight };
    resizeStartMouse = { x: e.clientX, y: e.clientY };
    
    // Calculate and store the current pixel size before resizing starts
    // This will be used for all preview calculations during the resize operation
    const currentPixelSize = parseInt(getComputedStyle(DOM.pixelGrid.querySelector('.pixel')).width);
    window.resizeStartPixelSize = currentPixelSize;
    
    // Save current canvas state before resizing
    saveCanvasState();
    
    // Add resize event listeners
    console.log('startResize: Adding event listeners');
    document.addEventListener('mousemove', handleResize);
    document.addEventListener('mouseup', stopResize);
    
    // Add mouse leave listener to clear preview if mouse goes outside canvas
    DOM.pixelGrid.addEventListener('mouseleave', clearResizePreview);
    
    // Add resizing class to canvas
    DOM.pixelGrid.classList.add('resizing');
    
    // Clear any existing preview
    clearResizePreview();
    
    console.log('=== startResize DEBUG END ===');
    console.log('Final resize state:');
    console.log('  isResizing:', isResizing);
    console.log('  resizeHandle:', resizeHandle);
    console.log('  lastUsedResizeAnchor:', lastUsedResizeAnchor);
}

// Handle resize operation
function handleResize(e) {
    if (!isResizing) {
        console.log('handleResize: Not resizing, returning early');
        return;
    }
    
    const deltaX = e.clientX - resizeStartMouse.x;
    const deltaY = e.clientY - resizeStartMouse.y;
    
    // Calculate new dimensions based on handle position
    let newWidth = resizeStartDimensions.width;
    let newHeight = resizeStartDimensions.height;
    
    // Use the stored pixel size from when resize started for consistent calculations
    const pixelSize = window.resizeStartPixelSize || parseInt(getComputedStyle(DOM.pixelGrid.querySelector('.pixel')).width);
    const deltaCols = Math.round(deltaX / pixelSize);
    const deltaRows = Math.round(deltaY / pixelSize);
    
    switch (resizeHandle) {
        case 'top-left':
            newWidth = Math.max(1, resizeStartDimensions.width - deltaCols);
            newHeight = Math.max(1, resizeStartDimensions.height - deltaRows);
            break;
        case 'top-right':
            newWidth = Math.max(1, resizeStartDimensions.width + deltaCols);
            newHeight = Math.max(1, resizeStartDimensions.height - deltaRows);
            break;
        case 'bottom-left':
            newWidth = Math.max(1, resizeStartDimensions.width - deltaCols);
            newHeight = Math.max(1, resizeStartDimensions.height + deltaRows);
            break;
        case 'bottom-right':
            newWidth = Math.max(1, resizeStartDimensions.width + deltaCols);
            newHeight = Math.max(1, resizeStartDimensions.height + deltaRows);
            break;
    }
    
    // Limit dimensions - width and height can be any valid size
    newWidth = Math.min(480, Math.max(1, newWidth));
    newHeight = Math.min(480, Math.max(1, newHeight));
    
    // Update size input fields to show current preview dimensions
    if (DOM.widthInput && DOM.heightInput) {
        DOM.widthInput.value = newWidth;
        DOM.heightInput.value = newHeight;
    }
    
    // Show resize preview
    showResizePreview(newWidth, newHeight);
}

// Stop resize operation
function stopResize(e) {
    console.log('stopResize called:', { isResizing, resizeHandle, e: e.type });
    
    if (!isResizing) {
        console.log('stopResize: Not resizing, returning early');
        return;
    }
    
    // Calculate final dimensions
    const deltaX = e.clientX - resizeStartMouse.x;
    const deltaY = e.clientY - resizeStartMouse.y;
    
    let newWidth = resizeStartDimensions.width;
    let newHeight = resizeStartDimensions.height;
    
    // Use the stored pixel size from when resize started for consistent calculations
    const pixelSize = window.resizeStartPixelSize || parseInt(getComputedStyle(DOM.pixelGrid.querySelector('.pixel')).width);
    const deltaCols = Math.round(deltaX / pixelSize);
    const deltaRows = Math.round(deltaY / pixelSize);
    
    switch (resizeHandle) {
        case 'top-left':
            newWidth = Math.max(1, resizeStartDimensions.width - deltaCols);
            newHeight = Math.max(1, resizeStartDimensions.height - deltaRows);
            break;
        case 'top-right':
            newWidth = Math.max(1, resizeStartDimensions.width + deltaCols);
            newHeight = Math.max(1, resizeStartDimensions.height - deltaRows);
            break;
        case 'bottom-left':
            newWidth = Math.max(1, resizeStartDimensions.width - deltaCols);
            newHeight = Math.max(1, resizeStartDimensions.height + deltaRows);
            break;
        case 'bottom-right':
            newWidth = Math.max(1, resizeStartDimensions.width + deltaCols);
            newHeight = Math.max(1, resizeStartDimensions.height + deltaRows);
            break;
    }
    
    // Limit dimensions - width and height can be any valid size
    newWidth = Math.min(480, Math.max(1, newWidth));
    newHeight = Math.min(480, Math.max(1, newHeight));
    
    // Update size input fields to show current preview dimensions
    if (DOM.widthInput && DOM.heightInput) {
        DOM.widthInput.value = newWidth;
        DOM.heightInput.value = newHeight;
    }
    
    // Apply resize if dimensions changed
    if (newWidth !== canvasWidth || newHeight !== canvasHeight) {
        resizeCanvas(newWidth, newHeight);
    }
    
    // Clean up
    console.log('stopResize: Cleaning up resize state');
    console.log('Before cleanup:');
    console.log('  isResizing:', isResizing);
    console.log('  resizeHandle:', resizeHandle);
    console.log('  lastUsedResizeAnchor:', lastUsedResizeAnchor);
    
    isResizing = false;
    resizeHandle = null;
    
    console.log('After cleanup:');
    console.log('  isResizing:', isResizing);
    console.log('  resizeHandle:', resizeHandle);
    console.log('  lastUsedResizeAnchor:', lastUsedResizeAnchor);
    console.log('  Note: lastUsedResizeAnchor preserved for save operations');
    
    DOM.pixelGrid.classList.remove('resizing');
    
    // Clear stored pixel size
    delete window.resizeStartPixelSize;
    
    // Clear resize preview
    clearResizePreview();
    
    // Remove event listeners
    console.log('stopResize: Removing event listeners');
    document.removeEventListener('mousemove', handleResize);
    document.removeEventListener('mouseup', stopResize);
    DOM.pixelGrid.removeEventListener('mouseleave', clearResizePreview);
}

// Resize canvas while preserving artwork
function resizeCanvas(newWidth, newHeight) {
    // Store current canvas data
    const currentCanvasData = getCanvasData();
    const oldWidth = canvasWidth;
    const oldHeight = canvasHeight;
    
    console.log('resizeCanvas: Starting resize from', oldWidth, 'x', oldHeight, 'to', newWidth, 'x', newHeight);
    
    // Update dimensions
    canvasWidth = newWidth;
    canvasHeight = newHeight;
    
    console.log('resizeCanvas: About to call createGrid()');
    // Recreate grid
    createGrid();
    
    // Clear any resize preview that might still be showing
    clearResizePreview();
    
    // Reference lines container is preserved during grid recreation, so no need to redraw
    // The lines will automatically adjust to the new canvas dimensions
    
    // Restore artwork based on resize anchor
    const newCanvasData = new Array(newWidth * newHeight).fill('#000000');
    
    // Calculate source and destination ranges based on resize anchor
    let sourceStartX, sourceStartY, sourceEndX, sourceEndY;
    let destStartX, destStartY;
    
    if (newWidth > oldWidth || newHeight > oldHeight) {
        // EXPANDING the canvas - preserve existing content and position it correctly
        switch (resizeHandle) {
            case 'top-left':
                // Existing content goes to bottom-right of new canvas
                sourceStartX = 0;
                sourceStartY = 0;
                sourceEndX = oldWidth;
                sourceEndY = oldHeight;
                // Destination: bottom-right of new canvas
                destStartX = newWidth - oldWidth;
                destStartY = newHeight - oldHeight;
                break;
                
            case 'top-right':
                // Existing content goes to bottom-left of new canvas
                sourceStartX = 0;
                sourceStartY = 0;
                sourceEndX = oldWidth;
                sourceEndY = oldHeight;
                // Destination: bottom-left of new canvas
                destStartX = 0;
                destStartY = newHeight - oldHeight;
                break;
                
            case 'bottom-left':
                // Existing content goes to top-right of new canvas
                sourceStartX = 0;
                sourceStartY = 0;
                sourceEndX = oldWidth;
                sourceEndY = oldHeight;
                // Destination: top-right of new canvas
                destStartX = newWidth - oldWidth;
                destStartY = 0;
                break;
                
            case 'bottom-right':
                // Existing content goes to top-left of new canvas (default behavior)
                sourceStartX = 0;
                sourceStartY = 0;
                sourceEndX = oldWidth;
                sourceEndY = oldHeight;
                // Destination: top-left of new canvas
                destStartX = 0;
                destStartY = 0;
                break;
                
            default:
                // Fallback to default behavior
                sourceStartX = 0;
                sourceStartY = 0;
                sourceEndX = oldWidth;
                sourceEndY = oldHeight;
                destStartX = 0;
                destStartY = 0;
        }
    } else {
        // SHRINKING the canvas - crop existing content based on anchor
        switch (resizeHandle) {
            case 'top-left':
                // Source: bottom-right portion of old canvas
                sourceStartX = Math.max(0, oldWidth - newWidth);
                sourceStartY = Math.max(0, oldHeight - newHeight);
                sourceEndX = oldWidth;
                sourceEndY = oldHeight;
                // Destination: top-left of new canvas
                destStartX = 0;
                destStartY = 0;
                break;
                
            case 'top-right':
                // Source: bottom-left portion of old canvas
                sourceStartX = 0;
                sourceStartY = Math.max(0, oldHeight - newHeight);
                sourceEndX = Math.min(oldWidth, newWidth);
                sourceEndY = oldHeight;
                // Destination: top-left of new canvas
                destStartX = 0;
                destStartY = 0;
                break;
                
            case 'bottom-left':
                // Source: top-right portion of old canvas
                sourceStartX = Math.max(0, oldWidth - newWidth);
                sourceStartY = 0;
                sourceEndX = oldWidth;
                sourceEndY = Math.min(oldHeight, newHeight);
                // Destination: top-left of new canvas
                destStartX = 0;
                destStartY = 0;
                break;
                
            case 'bottom-right':
                // Source: top-left portion of old canvas (default behavior)
                sourceStartX = 0;
                sourceStartY = 0;
                sourceEndX = Math.min(oldWidth, newWidth);
                sourceEndY = Math.min(oldHeight, newHeight);
                // Destination: top-left of new canvas
                destStartX = 0;
                destStartY = 0;
                break;
                
            default:
                // Fallback to default behavior
                sourceStartX = 0;
                sourceStartY = 0;
                sourceEndX = Math.min(oldWidth, newWidth);
                sourceEndY = Math.min(oldHeight, newHeight);
                destStartX = 0;
                destStartY = 0;
        }
    }
    
    // Copy pixels from source area to destination area
    for (let y = 0; y < (sourceEndY - sourceStartY); y++) {
        for (let x = 0; x < (sourceEndX - sourceStartX); x++) {
            const sourceX = sourceStartX + x;
            const sourceY = sourceStartY + y;
            const destX = destStartX + x;
            const destY = destStartY + y;
            
            // Ensure we're within bounds
            if (sourceX < oldWidth && sourceY < oldHeight && destX < newWidth && destY < newHeight) {
                const oldIndex = sourceY * oldWidth + sourceX;
                const newIndex = destY * newWidth + destX;
                
                if (oldIndex < currentCanvasData.length) {
                    newCanvasData[newIndex] = currentCanvasData[oldIndex];
                }
            }
        }
    }
    
    // Apply restored data to new grid
    const pixels = document.querySelectorAll('.pixel');
    newCanvasData.forEach((color, index) => {
        if (pixels[index]) {
            pixels[index].style.backgroundColor = color;
        }
    });
    
    // Handle component repositioning if canvas was cropped
    if (window.placedComponents && window.placedComponents.length > 0) {
        handleComponentRepositioning(oldWidth, oldHeight, newWidth, newHeight, resizeHandle);
    }
    
    // Handle reference line repositioning to maintain their relative position to the drawing
    if (referenceLines.baseline.isVisible || referenceLines.vertical.isVisible) {
        console.log('Repositioning reference lines after canvas resize...');
        console.log('Old dimensions:', oldWidth, 'x', oldHeight, 'New dimensions:', newWidth, 'x', newHeight);
        console.log('Resize handle:', resizeHandle);
        
        // Calculate how much the drawing content moved
        let contentOffsetX = 0;
        let contentOffsetY = 0;
        
        if (newWidth > oldWidth || newHeight > oldHeight) {
            // EXPANDING the canvas
            switch (resizeHandle) {
                case 'top-left':
                    contentOffsetX = newWidth - oldWidth;
                    contentOffsetY = newHeight - oldHeight;
                    break;
                case 'top-right':
                    contentOffsetX = 0;
                    contentOffsetY = newHeight - oldHeight;
                    break;
                case 'bottom-left':
                    contentOffsetX = newWidth - oldWidth;
                    contentOffsetY = 0;
                    break;
                case 'bottom-right':
                    contentOffsetX = 0;
                    contentOffsetY = 0;
                    break;
            }
        } else {
            // SHRINKING the canvas
            switch (resizeHandle) {
                case 'top-left':
                    contentOffsetX = -(oldWidth - newWidth);
                    contentOffsetY = -(oldHeight - newHeight);
                    break;
                case 'top-right':
                    contentOffsetX = 0;
                    contentOffsetY = -(oldHeight - newHeight);
                    break;
                case 'bottom-left':
                    contentOffsetX = -(oldWidth - newWidth);
                    contentOffsetY = 0;
                    break;
                case 'bottom-right':
                    contentOffsetX = 0;
                    contentOffsetY = 0;
                    break;
            }
        }
        
        console.log('Content offset:', { contentOffsetX, contentOffsetY });
        
        // Reposition reference lines to maintain their relative position to the drawing
        if (referenceLines.baseline.isVisible) {
            const oldBaselineY = referenceLines.baseline.y;
            const newBaselineY = Math.max(0, Math.min(newHeight - 1, oldBaselineY + contentOffsetY));
            console.log('Repositioning baseline from', oldBaselineY, 'to', newBaselineY);
            referenceLines.baseline.y = newBaselineY;
        }
        
        if (referenceLines.vertical.isVisible) {
            const oldVerticalX = referenceLines.vertical.x;
            const newVerticalX = Math.max(0, Math.min(newWidth - 1, oldVerticalX + contentOffsetX));
            console.log('Repositioning vertical line from', oldVerticalX, 'to', newVerticalX);
            referenceLines.vertical.x = newVerticalX;
        }
        
        // Redraw reference lines with new positions
        console.log('Redrawing reference lines with new positions...');
        console.log('Final reference line positions:', {
            baseline: referenceLines.baseline.y,
            vertical: referenceLines.vertical.x
        });
        console.log('Canvas dimensions after resize:', canvasWidth, 'x', canvasHeight);
        drawReferenceLines();
        
        // Save the updated reference line positions to font storage if in font edit mode
        if (window.getSaveState && window.getSaveState().isFontEditMode) {
            const saveState = window.getSaveState();
            if (window.saveFontReferenceLinePositions) {
                console.log('Saving updated reference line positions to font storage...');
                window.saveFontReferenceLinePositions(saveState.currentEditingFont, referenceLines.baseline.y, referenceLines.vertical.x);
            }
        }
    }
    
    // Update export code
    if (window.updateExportCode) window.updateExportCode();
}

// Handle component repositioning after canvas resize
function handleComponentRepositioning(oldWidth, oldHeight, newWidth, newHeight, resizeHandle) {
    const placedComponents = window.placedComponents || [];
    
    placedComponents.forEach(component => {
        // Calculate new component position based on resize anchor
        let newX = component.x;
        let newY = component.y;
        
        switch (resizeHandle) {
            case 'top-left':
                // Components move down and right when expanding from top-left
                if (newWidth > oldWidth) {
                    newX = component.x + (newWidth - oldWidth);
                }
                if (newHeight > oldHeight) {
                    newY = component.y + (newHeight - oldHeight);
                }
                break;
                
            case 'top-right':
                // Components move down when expanding from top-right
                if (newHeight > oldHeight) {
                    newY = component.y + (newHeight - oldHeight);
                }
                // X position stays the same
                break;
                
            case 'bottom-left':
                // Components move right when expanding from bottom-left
                if (newWidth > oldWidth) {
                    newX = component.x + (newWidth - oldWidth);
                }
                // Y position stays the same
                break;
                
            case 'bottom-right':
                // Components stay in the same position (default behavior)
                break;
        }
        
        // Check if component is still within bounds after repositioning
        if (newX + component.width > newWidth || newY + component.height > newHeight) {
            // Component is outside new canvas bounds, remove it
            const componentIndex = placedComponents.findIndex(comp => comp.id === component.id);
            if (componentIndex !== -1) {
                placedComponents.splice(componentIndex, 1);
                // Clean up component state
                if (window.componentOriginalStates) {
                    window.componentOriginalStates.delete(component.id);
                }
            }
        } else {
            // Update component position and redraw it
            component.x = newX;
            component.y = newY;
            if (window.placeComponentPixels) {
                window.placeComponentPixels(component);
            }
        }
    });
    
    // Update global reference
    window.placedComponents = placedComponents;
}

// Placeholder for modal functions
function showAlert(message) {
    if (window.showAlert) window.showAlert(message);
}

// Update quick size selectors to show current dimensions
export function updateQuickSizeSelectors() {
    if (DOM.quickWidthSelector && DOM.quickHeightSelector) {
        // Find the closest width preset
        const currentWidth = canvasWidth;
        const widthOptions = Array.from(DOM.quickWidthSelector.options);
        let closestWidthOption = null;
        let minWidthDiff = Infinity;
        
        widthOptions.forEach(option => {
            if (option.value) {
                const diff = Math.abs(parseInt(option.value) - currentWidth);
                if (diff < minWidthDiff) {
                    minWidthDiff = diff;
                    closestWidthOption = option;
                }
            }
        });
        
        // Find the closest height preset
        const currentHeight = canvasHeight;
        const heightOptions = Array.from(DOM.quickHeightSelector.options);
        let closestHeightOption = null;
        let minHeightDiff = Infinity;
        
        heightOptions.forEach(option => {
            if (option.value) {
                const diff = Math.abs(parseInt(option.value) - currentHeight);
                if (diff < minHeightDiff) {
                    minHeightDiff = diff;
                    closestHeightOption = option;
                }
            }
        });
        
        // Update the selectors to show current dimensions
        if (closestWidthOption) {
            DOM.quickWidthSelector.value = closestWidthOption.value;
        }
        if (closestHeightOption) {
            DOM.quickHeightSelector.value = closestHeightOption.value;
        }
    }
}

// Get current resize anchor
export function getCurrentResizeAnchor() {
    console.log('getCurrentResizeAnchor called:');
    console.log('  lastUsedResizeAnchor:', lastUsedResizeAnchor);
    console.log('  resizeHandle:', resizeHandle);
    console.log('  returning:', lastUsedResizeAnchor || resizeHandle);
    return lastUsedResizeAnchor || resizeHandle;
}

// Placeholder for modal functions
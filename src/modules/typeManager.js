// Type Manager Module
// Handles type tool functionality including text typing and font character editing

import * as DOM from './domElements.js';
import { getCanvasDimensions, saveCanvasState } from './canvasManager.js';

// Type tool state
let selectedFont = null;
let typingMode = false;
let typingPreviewPixels = [];
let cursorPixels = []; // Array to track cursor pixels
let textCursorPosition = null;
let isTextCursorVisible = false;
let isCursorInTypingMode = false; // Track if cursor is clicked and ready for typing
let fontEditMode = null;

// Initialize type manager
export function initializeTypeManager() {
    setupTypeEventListeners();
    loadFonts();
}

// Setup type tool event listeners
function setupTypeEventListeners() {
    console.log('setupTypeEventListeners called');
    
    // Font selector change
    DOM.fontSelector.addEventListener('change', (e) => {
        console.log('Font selector changed:', e.target.value);
        selectFont(e.target.value);
    });
    
    // Text input change
    DOM.typeTextInput.addEventListener('input', (e) => {
        console.log('Text input changed:', e.target.value);
        updateTypingPreview();
    });
    
    // Spacing slider change
    DOM.typeSpacingSlider.addEventListener('input', (e) => {
        const spacing = e.target.value;
        DOM.typeSpacingValue.textContent = spacing;
        updateTypingPreview();
    });
    
    // Keyboard event for typing on canvas
    document.addEventListener('keydown', (e) => {
        if (window.getCurrentTool() !== 'type' || !selectedFont || !isCursorInTypingMode) return;
        
        // Prevent default behavior for typing keys
        if (e.key.length === 1 || e.key === 'Backspace' || e.key === 'Enter') {
            e.preventDefault();
        }
        
        // Handle backspace
        if (e.key === 'Backspace') {
            // Remove last character from canvas
            if (textCursorPosition !== null) {
                const spacing = parseInt(DOM.typeSpacingSlider.value) || 0;
                const characterWidth = 14;
                textCursorPosition -= characterWidth + spacing;
                
                // Clear the last character area
                clearCharacterArea(textCursorPosition);
                
                // Update cursor position on canvas
                showTextCursor(textCursorPosition);
            }
            return;
        }
        
        // Handle enter key
        if (e.key === 'Enter') {
            // Move cursor down to next line and back to start position
            if (textCursorPosition !== null) {
                const { width: canvasWidth } = getCanvasDimensions();
                const currentY = Math.floor(textCursorPosition / canvasWidth);
                
                // Get font height for line spacing
                const fonts = JSON.parse(localStorage.getItem('smolui_fonts') || '[]');
                const fontData = fonts.find(f => f.name === selectedFont);
                const fontHeight = fontData && fontData.characters['A'] ? fontData.characters['A'].length : 16;
                
                // Find the start position of the current line (first character position)
                const startX = findLineStartPosition(textCursorPosition);
                
                // Move down by font height + 1 pixel spacing
                const newY = currentY + fontHeight + 1;
                const newIndex = newY * canvasWidth + startX;
                
                // Update cursor position
                textCursorPosition = newIndex;
                showTextCursor(newIndex);
            }
            return;
        }
        
        // Handle arrow keys for cursor movement
        if (e.key === 'ArrowLeft' || e.key === 'ArrowRight' || e.key === 'ArrowUp' || e.key === 'ArrowDown') {
            e.preventDefault();
            if (textCursorPosition !== null) {
                const { width: canvasWidth, height: canvasHeight } = getCanvasDimensions();
                const currentX = textCursorPosition % canvasWidth;
                const currentY = Math.floor(textCursorPosition / canvasWidth);
                
                let newX = currentX;
                let newY = currentY;
                
                switch (e.key) {
                    case 'ArrowLeft':
                        newX = Math.max(0, currentX - 1);
                        break;
                    case 'ArrowRight':
                        newX = Math.min(canvasWidth - 1, currentX + 1);
                        break;
                    case 'ArrowUp':
                        newY = Math.max(0, currentY - 1);
                        break;
                    case 'ArrowDown':
                        newY = Math.min(canvasHeight - 1, currentY + 1);
                        break;
                }
                
                const newIndex = newY * canvasWidth + newX;
                textCursorPosition = newIndex;
                showTextCursor(newIndex);
            }
            return;
        }
        
        // Handle escape key to exit typing mode
        if (e.key === 'Escape') {
            hideTextCursor();
            isCursorInTypingMode = false;
            return;
        }
        
        // Handle printable characters
        if (e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
            // Place character directly on canvas
            if (textCursorPosition !== null) {
                placeCharacterOnCanvas(e.key, textCursorPosition);
                
                // Move cursor position forward
                const spacing = parseInt(DOM.typeSpacingSlider.value) || 0;
                const characterWidth = 14;
                textCursorPosition += characterWidth + spacing;
                
                // Update cursor position on canvas
                showTextCursor(textCursorPosition);
            }
        }
    });
    
    // Click outside canvas to exit typing mode
    document.addEventListener('click', (e) => {
        if (isCursorInTypingMode && window.getCurrentTool() === 'type') {
            const canvas = document.querySelector('.canvas-wrapper');
            if (canvas && !canvas.contains(e.target)) {
                console.log('Click outside canvas detected, exiting typing mode');
                hideTextCursor();
                isCursorInTypingMode = false;
            }
        }
    });

    // Create font button
    DOM.createFontBtn.addEventListener('click', createFont);
}

// Load fonts from localStorage
function loadFonts() {
    console.log('typeManager loadFonts called');
    const fonts = JSON.parse(localStorage.getItem('smolui_fonts') || '[]');
    console.log('typeManager fonts loaded:', fonts);
    updateFontSelector(fonts);
    renderFontsList(fonts);
}

// Update font selector
function updateFontSelector(fonts) {
    DOM.fontSelector.innerHTML = '<option value="">SELECT FONT</option>';
    fonts.forEach(font => {
        const option = document.createElement('option');
        option.value = font.name;
        option.textContent = font.name.toUpperCase();
        DOM.fontSelector.appendChild(option);
    });
}

// Render fonts list
function renderFontsList(fonts) {
    DOM.fontsList.innerHTML = '';
    
    if (fonts.length === 0) {
        DOM.fontsList.innerHTML = '<div class="saved-empty">No fonts created yet</div>';
        return;
    }
    
    fonts.forEach((font, index) => {
        const fontItem = document.createElement('div');
        fontItem.className = 'font-item';
        
        const header = document.createElement('div');
        header.className = 'font-item-header';
        
        const nameSpan = document.createElement('span');
        nameSpan.className = 'font-item-name';
        nameSpan.textContent = font.name.toUpperCase();
        header.appendChild(nameSpan);
        
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'font-item-delete';
        deleteBtn.textContent = 'DELETE';
        deleteBtn.onclick = (e) => {
            e.stopPropagation();
            deleteFont(font.name);
        };
        
        const editBtn = document.createElement('button');
        editBtn.className = 'font-item-edit';
        editBtn.textContent = fontEditMode === font.name ? 'EXIT EDIT' : 'EDIT';
        editBtn.onclick = (e) => {
            e.stopPropagation();
            toggleFontEditMode(font.name);
        };
        
        const buttonGroup = document.createElement('div');
        buttonGroup.className = 'font-item-buttons';
        buttonGroup.appendChild(editBtn);
        buttonGroup.appendChild(deleteBtn);

        header.appendChild(buttonGroup);

        const charactersDiv = document.createElement('div');
        charactersDiv.className = 'font-characters';
        
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=[]{}|;\':",./<>?';
        characters.split('').forEach(character => {
            const hasData = font.characters && font.characters[character] && 
                           font.characters[character].some(row => 
                               row.some(pixel => pixel !== '#000000')
                           );
            const char = document.createElement('div');
            char.className = `font-character${hasData ? ' has-data' : ''}`;
            char.textContent = character;
            char.onclick = () => editCharacter(font.name, character);
            charactersDiv.appendChild(char);
        });
        
        // Add edit mode indicator
        if (fontEditMode === font.name) {
            fontItem.classList.add('font-editing');
        }

        fontItem.appendChild(header);
        fontItem.appendChild(charactersDiv);
        DOM.fontsList.appendChild(fontItem);
    });
}

// Select font
function selectFont(fontName) {
    console.log('typeManager selectFont called:', { fontName, type: typeof fontName });
    selectedFont = fontName;
    
    if (fontName) {
        DOM.typeStatus.textContent = `FONT: ${fontName.toUpperCase()} - READY TO TYPE`;
        DOM.typeTextInput.disabled = false;
    } else {
        DOM.typeStatus.textContent = 'SELECT FONT TO START TYPING';
        DOM.typeTextInput.disabled = true;
        exitTypingMode();
    }
}

// Create font
function createFont() {
    const fontName = DOM.fontNameInput.value.trim();
    if (!fontName) {
        if (window.showAlert) window.showAlert('Please enter a font name.');
        return;
    }
    
    const fonts = JSON.parse(localStorage.getItem('smolui_fonts') || '[]');
    const existingFont = fonts.find(font => font.name === fontName);
    
    if (existingFont) {
        if (window.showConfirm) {
            window.showConfirm(`Font "${fontName}" already exists. Overwrite?`, () => {
                const fontIndex = fonts.findIndex(font => font.name === fontName);
                fonts[fontIndex] = {
                    name: fontName,
                    characters: {},
                    createdAt: new Date().toISOString()
                };
                localStorage.setItem('smolui_fonts', JSON.stringify(fonts));
                DOM.fontNameInput.value = '';
                loadFonts();
                if (window.updateCounts) window.updateCounts();
            });
        }
    } else {
        fonts.push({
            name: fontName,
            characters: {},
            createdAt: new Date().toISOString()
        });
        localStorage.setItem('smolui_fonts', JSON.stringify(fonts));
        DOM.fontNameInput.value = '';
        loadFonts();
        if (window.updateCounts) window.updateCounts();
    }
}

// Delete font
function deleteFont(fontName) {
    if (window.showConfirm) {
        window.showConfirm(`Delete font "${fontName}"?`, () => {
            const fonts = JSON.parse(localStorage.getItem('smolui_fonts') || '[]');
            const updatedFonts = fonts.filter(font => font.name !== fontName);
            localStorage.setItem('smolui_fonts', JSON.stringify(updatedFonts));
            loadFonts();
            if (window.updateCounts) window.updateCounts();
        });
    }
}

// Toggle font edit mode
function toggleFontEditMode(fontName) {
    if (fontEditMode === fontName) {
        // Exit edit mode
        fontEditMode = null;
    } else {
        // Enter edit mode
        fontEditMode = fontName;
    }
    loadFonts();
}

// Edit character
function editCharacter(fontName, character) {
    console.log('editCharacter called:', { fontName, character });
    
    // Always enter font edit mode when editing a character
    if (window.enterFontEditMode) {
        console.log('Calling enterFontEditMode...');
        window.enterFontEditMode(fontName, character);
        console.log('enterFontEditMode completed');
    } else {
        console.error('enterFontEditMode function not available');
    }
    
    // Load character data to canvas
    const fonts = JSON.parse(localStorage.getItem('smolui_fonts') || '[]');
    const font = fonts.find(f => f.name === fontName);
    if (font && font.characters && font.characters[character]) {
        console.log('Loading character data to canvas...');
        // Load character data to canvas
        const characterData = font.characters[character] || [];
        loadCanvasFromData(characterData);
        console.log('Character data loaded to canvas');
        
        // Set canvas name to font name and character
        DOM.canvasName.value = `${fontName}_${character}`;
        console.log('Canvas name set to:', DOM.canvasName.value);
    } else {
        console.log('No character data found for:', { fontName, character });
    }
    
    // Check if reference lines are visible after everything
    setTimeout(() => {
        const container = document.querySelector('.reference-lines-container');
        const baseline = document.querySelector('.baseline-line');
        const vertical = document.querySelector('.vertical-line');
        const handle = document.querySelector('.intersection-handle');
        
        console.log('Reference line check after editCharacter:', {
            container: !!container,
            baseline: !!baseline,
            vertical: !!vertical,
            handle: !!handle
        });
        
        if (!container) {
            console.warn('Reference lines container not found after editCharacter!');
        }
    }, 100);
}

// Load canvas from data
function loadCanvasFromData(pixelData) {
    const pixels = document.querySelectorAll('.pixel');
    
    pixelData.forEach((row, y) => {
        row.forEach((color, x) => {
            if (y < getCanvasDimensions().height && x < getCanvasDimensions().width) {
                const index = y * getCanvasDimensions().width + x;
                if (pixels[index]) {
                    pixels[index].style.backgroundColor = color;
                }
            }
        });
    });
    
    if (window.updateExportCode) window.updateExportCode();
}

// Handle type tool click
export function handleTypeClick(index) {
    console.log('handleTypeClick called:', { index, selectedFont, currentTool: window.getCurrentTool() });
    
    if (!selectedFont || window.getCurrentTool() !== 'type') {
        console.log('handleTypeClick: conditions not met');
        return;
    }
    
    const text = DOM.typeTextInput.value.trim();
    if (!text) {
        // Enter typing mode - place cursor and allow keyboard input
        isCursorInTypingMode = true;
        showTextCursor(index);
        // Don't focus the text input - let keyboard work directly
        return;
    }
    
    console.log('handleTypeClick: proceeding with text placement', { text, selectedFont, index });
    typeTextAtPosition(text, index);
}

// Type text at position
function typeTextAtPosition(text, startIndex) {
    const fonts = JSON.parse(localStorage.getItem('smolui_fonts') || '[]');
    const fontData = fonts.find(f => f.name === selectedFont);
    
    if (!fontData) return;
    
    const { width: canvasWidth, height: canvasHeight } = getCanvasDimensions();
    const startX = startIndex % canvasWidth;
    const startY = Math.floor(startIndex / canvasWidth);
    let currentX = startX;
    
    // Get spacing from slider
    const spacing = parseInt(DOM.typeSpacingSlider.value) || 0;
    const characterWidth = 16; // Each character is 16x16
    const spaceWidth = 8; // Space character width
    
    for (const char of text) {
        if (char === ' ') {
            currentX += spaceWidth + spacing; // Space width + spacing
            continue;
        }
        
        const charData = fontData.characters[char];
        if (!charData) continue;
        
        // Draw character
        charData.forEach((row, y) => {
            row.forEach((color, x) => {
                const pixelX = currentX + x;
                const pixelY = startY + y;
                
                if (pixelX < canvasWidth && pixelY < canvasHeight && color !== '#000000') {
                    const pixelIndex = pixelY * canvasWidth + pixelX;
                    const pixel = document.querySelector(`.pixel[data-index="${pixelIndex}"]`);
                    if (pixel) {
                        pixel.style.backgroundColor = color;
                    }
                }
            });
        });
        
        currentX += characterWidth + spacing; // Character width + spacing
    }
    
    if (window.updateExportCode) window.updateExportCode();
}

// Update typing preview
function updateTypingPreview() {
    console.log('updateTypingPreview called');
    // This function is called when text input changes
    // The actual preview is handled by showTextPreview on hover
}

// Show text preview
export function showTextPreview(startIndex) {
    console.log('showTextPreview called:', { startIndex, selectedFont, currentTool: window.getCurrentTool() });
    
    if (!selectedFont || window.getCurrentTool() !== 'type') {
        console.log('showTextPreview: conditions not met', { selectedFont, currentTool: window.getCurrentTool() });
        return;
    }
    
    // If in typing mode, completely ignore mouse movement
    if (isCursorInTypingMode) {
        console.log('showTextPreview: ignoring mouse movement in typing mode');
        return;
    }
    
    const text = DOM.typeTextInput.value.trim();
    
    clearTypingPreview();
    
    if (!text) {
        // Show blinking cursor when no text is entered and not in typing mode
        showTextCursor(startIndex);
        return;
    }
    
    console.log('showTextPreview: proceeding with preview', { text, selectedFont });
    
    const fonts = JSON.parse(localStorage.getItem('smolui_fonts') || '[]');
    const fontData = fonts.find(f => f.name === selectedFont);
    
    if (!fontData) {
        console.log('showTextPreview: font data not found', { selectedFont, fonts });
        return;
    }
    
    const { width: canvasWidth, height: canvasHeight } = getCanvasDimensions();
    const startX = startIndex % canvasWidth;
    const startY = Math.floor(startIndex / canvasWidth);
    let currentX = startX;
    
    // Get spacing from slider
    const spacing = parseInt(DOM.typeSpacingSlider.value) || 0;
    const characterWidth = 14; // Each character is 14x14
    const spaceWidth = 8; // Space character width
    
    for (const char of text) {
        if (char === ' ') {
            currentX += spaceWidth + spacing; // Space width + spacing
            continue;
        }
        
        const charData = fontData.characters[char];
        if (!charData) {
            console.log('showTextPreview: character data not found', { char, fontData });
            continue;
        }
        
        // Preview character
        charData.forEach((row, y) => {
            row.forEach((color, x) => {
                const pixelX = currentX + x;
                const pixelY = startY + y;
                
                if (pixelX < canvasWidth && pixelY < canvasHeight && color !== '#000000') {
                    const pixelIndex = pixelY * canvasWidth + pixelX;
                    const pixel = document.querySelector(`.pixel[data-index="${pixelIndex}"]`);
                    if (pixel) {
                        // Don't change the background color permanently, just add preview class
                        pixel.classList.add('typing-preview-pixel');
                        typingPreviewPixels.push(pixel);
                    }
                }
            });
        });
        
        currentX += characterWidth + spacing; // Character width + spacing
    }
    
    console.log('showTextPreview: preview complete', { previewPixels: typingPreviewPixels.length });
}

// Clear typing preview
export function clearTypingPreview() {
    typingPreviewPixels.forEach(pixel => {
        pixel.classList.remove('typing-preview-pixel');
    });
    typingPreviewPixels = [];
    
    // Only hide cursor if not in typing mode
    if (!isCursorInTypingMode) {
        hideTextCursor();
    }
}

// Exit typing mode
export function exitTypingMode() {
    typingMode = false;
    clearTypingPreview();
    hideTextCursor();
    isCursorInTypingMode = false;
    window.currentEditingChar = null;
}

// Show text cursor at position
function showTextCursor(index) {
    if (!selectedFont || window.getCurrentTool() !== 'type') return;
    
    const { width: canvasWidth, height: canvasHeight } = getCanvasDimensions();
    const x = index % canvasWidth;
    const y = Math.floor(index / canvasWidth);
    
    if (x >= canvasWidth || y >= canvasHeight) return;
    
    // Clear previous cursor pixels
    clearCursorPixels();
    
    // Get font height (default 14 pixels)
    const fonts = JSON.parse(localStorage.getItem('smolui_fonts') || '[]');
    const fontData = fonts.find(f => f.name === selectedFont);
    const fontHeight = fontData && fontData.characters['A'] ? fontData.characters['A'].length : 14;
    
    // Highlight vertical stack of pixels matching font height
    for (let row = 0; row < fontHeight; row++) {
        const pixelX = x;
        const pixelY = y + row;
        
        if (pixelX < canvasWidth && pixelY < canvasHeight) {
            const pixelIndex = pixelY * canvasWidth + pixelX;
            const pixel = document.querySelector(`.pixel[data-index="${pixelIndex}"]`);
            if (pixel) {
                pixel.classList.add('cursor-pixel');
                cursorPixels.push(pixel);
            }
        }
    }
    
    textCursorPosition = index;
    isTextCursorVisible = true;
}

// Hide text cursor
function hideTextCursor() {
    console.log('hideTextCursor called, clearing cursor pixels');
    clearCursorPixels();
    textCursorPosition = null;
    isTextCursorVisible = false;
}

// Clear cursor pixels
function clearCursorPixels() {
    cursorPixels.forEach(pixel => {
        pixel.classList.remove('cursor-pixel');
    });
    cursorPixels = [];
}

// Place character directly on canvas
function placeCharacterOnCanvas(char, startIndex) {
    const fonts = JSON.parse(localStorage.getItem('smolui_fonts') || '[]');
    const fontData = fonts.find(f => f.name === selectedFont);
    
    if (!fontData || !fontData.characters[char]) return;
    
    const { width: canvasWidth, height: canvasHeight } = getCanvasDimensions();
    const startX = startIndex % canvasWidth;
    const startY = Math.floor(startIndex / canvasWidth);
    
    const charData = fontData.characters[char];
    
    // Draw character directly on canvas
    charData.forEach((row, y) => {
        row.forEach((color, x) => {
            const pixelX = startX + x;
            const pixelY = startY + y;
            
            if (pixelX < canvasWidth && pixelY < canvasHeight && color !== '#000000') {
                const pixelIndex = pixelY * canvasWidth + pixelX;
                const pixel = document.querySelector(`.pixel[data-index="${pixelIndex}"]`);
                if (pixel) {
                    pixel.style.backgroundColor = color;
                }
            }
        });
    });
}

// Clear character area
function clearCharacterArea(startIndex) {
    const { width: canvasWidth, height: canvasHeight } = getCanvasDimensions();
    const startX = startIndex % canvasWidth;
    const startY = Math.floor(startIndex / canvasWidth);
    
    // Clear 16x16 area
    for (let y = 0; y < 16; y++) {
        for (let x = 0; x < 16; x++) {
            const pixelX = startX + x;
            const pixelY = startY + y;
            
            if (pixelX < canvasWidth && pixelY < canvasHeight) {
                const pixelIndex = pixelY * canvasWidth + pixelX;
                const pixel = document.querySelector(`.pixel[data-index="${pixelIndex}"]`);
                if (pixel) {
                    pixel.style.backgroundColor = '#000000';
                }
            }
        }
    }
}

// Find the start position of the current line (first character position)
function findLineStartPosition(currentPosition) {
    const { width: canvasWidth } = getCanvasDimensions();
    const currentY = Math.floor(currentPosition / canvasWidth);
    
    // Start from the leftmost position of the current line
    const lineStartIndex = currentY * canvasWidth;
    
    // Find the first non-black pixel in this line (first character)
    for (let x = 0; x < canvasWidth; x++) {
        const pixelIndex = lineStartIndex + x;
        const pixel = document.querySelector(`.pixel[data-index="${pixelIndex}"]`);
        if (pixel && pixel.style.backgroundColor !== 'rgb(0, 0, 0)' && pixel.style.backgroundColor !== '#000000') {
            return x; // Found the first character position
        }
    }
    
    // If no characters found, return the original X position
    return currentPosition % canvasWidth;
}

// Update counts
export function updateCounts() {
    const fonts = JSON.parse(localStorage.getItem('smolui_fonts') || '[]');
    DOM.fontsTitle.textContent = `🔤`;
}

// Placeholder for modal functions
function showConfirm(message, onConfirm) {
    if (window.showConfirm) window.showConfirm(message, onConfirm);
} 
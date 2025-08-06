// Save Manager Module
// Handles dual-state save functionality: normal mode with dropdown and font edit mode

import * as DOM from './domElements.js';
import { getCanvasData, getCanvasDimensions, saveCanvasState } from './canvasManager.js';

// Save state
let isFontEditMode = false;
let currentEditingFont = null;
let currentEditingCharacter = null;

// Initialize save manager
export function initializeSaveManager() {
    setupSaveEventListeners();
    updateSaveButtonState();
}

// Setup save-related event listeners
function setupSaveEventListeners() {
    // Save button click
    DOM.saveBtn.addEventListener('click', handleSaveButtonClick);
    
    // Save options
    DOM.saveAsComponent.addEventListener('click', () => saveAsComponent());
    DOM.saveAsComposition.addEventListener('click', () => saveAsComposition());
    
    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
        if (!DOM.saveBtn.contains(e.target) && !DOM.saveOptions.contains(e.target)) {
            hideSaveDropdown();
        }
    });
}

// Handle save button click
function handleSaveButtonClick() {
    const canvasName = DOM.canvasName.value.trim();
    
    // Check if this is a font character naming convention: {fontName}_{character}
    const fontCharMatch = canvasName.match(/^(.+)_(.+)$/);
    
    if (fontCharMatch) {
        // This is a font character - save to font
        const fontName = fontCharMatch[1];
        const character = fontCharMatch[2];
        saveCharacterToFont(fontName, character);
    } else if (isFontEditMode) {
        // In font edit mode - save to current editing font
        saveCharacter();
    } else {
        // Normal mode - show dropdown
        toggleSaveDropdown();
    }
}

// Toggle save dropdown
function toggleSaveDropdown() {
    const isVisible = DOM.saveOptions.style.display === 'block';
    if (isVisible) {
        hideSaveDropdown();
    } else {
        showSaveDropdown();
    }
}

// Show save dropdown
function showSaveDropdown() {
    DOM.saveOptions.style.display = 'block';
    DOM.saveBtn.classList.add('active');
}

// Hide save dropdown
function hideSaveDropdown() {
    DOM.saveOptions.style.display = 'none';
    DOM.saveBtn.classList.remove('active');
}

// Save as component
function saveAsComponent() {
    const name = DOM.canvasName.value.trim();
    if (!name) {
        if (window.showAlert) window.showAlert('Please enter a name for your design');
        return;
    }
    
    const pixelData = getCanvasData();
    
    // Check if canvas is empty
    const isEmpty = pixelData.every(color => color === '#000000' || color === '');
    if (isEmpty) {
        if (window.showAlert) window.showAlert('Cannot save an empty canvas.');
        return;
    }
    
    const { width, height } = getCanvasDimensions();
    const component = {
        name: name,
        width: width,
        height: height,
        data: pixelData,
        timestamp: Date.now()
    };
    
    const components = JSON.parse(localStorage.getItem('pixelComponents') || '[]');
    
    // Check for duplicate names
    const existingIndex = components.findIndex(comp => comp.name === name);
    if (existingIndex !== -1) {
        if (window.showConfirm) {
            window.showConfirm(`Component "${name}" already exists. Overwrite?`, () => {
                components[existingIndex] = component;
                localStorage.setItem('pixelComponents', JSON.stringify(components));
                DOM.canvasName.value = '';
                hideSaveDropdown();
                if (window.loadComponents) window.loadComponents();
                if (window.updateCounts) window.updateCounts();
                if (window.showAlert) window.showAlert('Component updated successfully!');
            });
        }
    } else {
        components.push(component);
        localStorage.setItem('pixelComponents', JSON.stringify(components));
        DOM.canvasName.value = '';
        hideSaveDropdown();
        if (window.loadComponents) window.loadComponents();
        if (window.updateCounts) window.updateCounts();
        if (window.showAlert) window.showAlert('Component saved successfully!');
    }
}

// Save as composition
function saveAsComposition() {
    const name = DOM.canvasName.value.trim();
    if (!name) {
        if (window.showAlert) window.showAlert('Please enter a name for your design');
        return;
    }
    
    const pixelData = getCanvasData();
    
    // Check if canvas is empty
    const isEmpty = pixelData.every(color => color === '#000000' || color === '');
    if (isEmpty) {
        if (window.showAlert) window.showAlert('Cannot save an empty canvas.');
        return;
    }
    
    const { width, height } = getCanvasDimensions();
    const composition = {
        name: name,
        width: width,
        height: height,
        data: pixelData,
        timestamp: Date.now()
    };
    
    const compositions = JSON.parse(localStorage.getItem('pixelCompositions') || '[]');
    
    // Check for duplicate names
    const existingIndex = compositions.findIndex(comp => comp.name === name);
    if (existingIndex !== -1) {
        if (window.showConfirm) {
            window.showConfirm(`Composition "${name}" already exists. Overwrite?`, () => {
                compositions[existingIndex] = composition;
                localStorage.setItem('pixelCompositions', JSON.stringify(compositions));
                DOM.canvasName.value = '';
                hideSaveDropdown();
                if (window.updateCounts) window.updateCounts();
                if (window.showAlert) window.showAlert('Composition updated successfully!');
            });
        }
    } else {
        compositions.push(composition);
        localStorage.setItem('pixelCompositions', JSON.stringify(compositions));
        DOM.canvasName.value = '';
        hideSaveDropdown();
        if (window.updateCounts) window.updateCounts();
        if (window.showAlert) window.showAlert('Composition saved successfully!');
    }
}

// Save character to font (when using font naming convention)
function saveCharacterToFont(fontName, character) {
    const pixelData = getCanvasData();
    
    console.log('saveCharacterToFont:', { fontName, character, pixelData });
    
    // Check if canvas is empty
    const isEmpty = pixelData.every(color => color === '#000000' || color === '');
    if (isEmpty) {
        if (window.showAlert) window.showAlert('Cannot save an empty character.');
        return;
    }
    
    // Convert 1D array to 2D array for font storage
    const { width, height } = getCanvasDimensions();
    const characterData = [];
    
    for (let y = 0; y < height; y++) {
        const row = [];
        for (let x = 0; x < width; x++) {
            const index = y * width + x;
            row.push(pixelData[index] || '#000000');
        }
        characterData.push(row);
    }
    
    console.log('Saving character data:', { characterData, width, height });
    
    // Save to font using the correct storage key
    const fonts = JSON.parse(localStorage.getItem('smolui_fonts') || '[]');
    
    console.log('Current fonts from storage:', fonts);
    
    // Find the font by name
    const fontIndex = fonts.findIndex(font => font.name === fontName);
    if (fontIndex === -1) {
        if (window.showAlert) window.showAlert(`Font "${fontName}" not found.`);
        return;
    }
    
    // Initialize characters object if it doesn't exist
    if (!fonts[fontIndex].characters) {
        fonts[fontIndex].characters = {};
    }
    
    // Save the character data
    fonts[fontIndex].characters[character] = characterData;
    localStorage.setItem('smolui_fonts', JSON.stringify(fonts));
    
    console.log('Saved fonts to storage:', fonts);
    
    if (window.showAlert) window.showAlert(`Character "${character}" saved to font "${fontName}"!`);
    
    // Force reload fonts from storage to ensure fresh data
    if (window.loadFontsFromStorage) {
        window.loadFontsFromStorage();
    }
    
    // Update font display to show the character now has data
    if (window.updateFontsList) window.updateFontsList();
    if (window.updateCounts) window.updateCounts();
    
    // Clear canvas name after successful save
    DOM.canvasName.value = '';
}

// Save character to font
function saveCharacter() {
    if (!currentEditingFont || !currentEditingCharacter) {
        if (window.showAlert) window.showAlert('No font or character selected for editing.');
        return;
    }
    
    const pixelData = getCanvasData();
    
    // Check if canvas is empty
    const isEmpty = pixelData.every(color => color === '#000000' || color === '');
    if (isEmpty) {
        if (window.showAlert) window.showAlert('Cannot save an empty character.');
        return;
    }
    
    // Convert 1D array to 2D array for font storage
    const { width, height } = getCanvasDimensions();
    const characterData = [];
    
    for (let y = 0; y < height; y++) {
        const row = [];
        for (let x = 0; x < width; x++) {
            const index = y * width + x;
            row.push(pixelData[index] || '#000000');
        }
        characterData.push(row);
    }
    
    // Save to font using the correct storage key
    const fonts = JSON.parse(localStorage.getItem('smolui_fonts') || '[]');
    
    // Find the font by name
    const fontIndex = fonts.findIndex(font => font.name === currentEditingFont);
    if (fontIndex === -1) {
        if (window.showAlert) window.showAlert(`Font "${currentEditingFont}" not found.`);
        return;
    }
    
    // Initialize characters object if it doesn't exist
    if (!fonts[fontIndex].characters) {
        fonts[fontIndex].characters = {};
    }
    
    // Save the character data
    fonts[fontIndex].characters[currentEditingCharacter] = characterData;
    localStorage.setItem('smolui_fonts', JSON.stringify(fonts));
    
    if (window.showAlert) window.showAlert(`Character "${currentEditingCharacter}" saved to font "${currentEditingFont}"!`);
    
    // Update font display
    if (window.updateFontsList) window.updateFontsList();
    if (window.updateCounts) window.updateCounts();
}

// Enter font edit mode
export function enterFontEditMode(fontName, character) {
    console.log('Entering font edit mode:', { fontName, character });
    
    isFontEditMode = true;
    currentEditingFont = fontName;
    currentEditingCharacter = character;
    
    // Update canvas name
    DOM.canvasName.value = `${fontName}_${character}`;
    
    // Ensure canvas is 16x16 for font editing
    if (window.applyDimensions) {
        // Set dimension inputs to 16x16
        if (DOM.widthInput) DOM.widthInput.value = '16';
        if (DOM.heightInput) DOM.heightInput.value = '16';
        // Apply the dimensions
        window.applyDimensions();
    }
    
    // Update save button
    updateSaveButtonState();
}

// Exit font edit mode
export function exitFontEditMode() {
    console.log('Exiting font edit mode');
    
    isFontEditMode = false;
    currentEditingFont = null;
    currentEditingCharacter = null;
    
    // Clear canvas name
    DOM.canvasName.value = '';
    
    // Update save button
    updateSaveButtonState();
    
    // Hide dropdown if visible
    hideSaveDropdown();
}

// Update save button state
export function updateSaveButtonState() {
    console.log('Updating save button state:', { isFontEditMode, currentEditingFont, currentEditingCharacter });
    
    if (isFontEditMode) {
        DOM.saveBtn.textContent = 'SAVE CHARACTER';
        DOM.saveBtn.classList.add('font-edit-mode');
        console.log('Save button set to SAVE CHARACTER mode');
    } else {
        DOM.saveBtn.textContent = 'SAVE AS';
        DOM.saveBtn.classList.remove('font-edit-mode');
        console.log('Save button set to SAVE AS mode');
    }
}

// Get current save state
export function getSaveState() {
    return {
        isFontEditMode,
        currentEditingFont,
        currentEditingCharacter
    };
} 
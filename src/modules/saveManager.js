// Save Manager Module
// Handles dual-state save functionality: normal mode with dropdown and font edit mode

import * as DOM from './domElements.js';
import { getCanvasData, getCanvasDimensions, saveCanvasState } from './canvasManager.js';
import { updateFontCharactersDimensions, updateCharacterWidth, updateFontCharactersHeight, saveFontsToStorage, getFontsArray } from './fontManager.js';

// Save state
let isFontEditMode = false;
let currentEditingFont = null;
let currentEditingCharacter = null;
let previousCharacterData = null; // Store previous character for ghost preview

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
    console.log('=== SAVE BUTTON CLICK DEBUG START ===');
    console.log('Save button clicked!');
    
    const canvasName = DOM.canvasName.value.trim();
    console.log('Canvas name:', canvasName);
    
    // Check if we're in font edit mode FIRST (this takes priority)
    if (isFontEditMode) {
        console.log('In font edit mode - calling saveCharacter()');
        // In font edit mode - save to current editing font
        saveCharacter();
        console.log('saveCharacter() completed');
        return;
    }
    
    console.log('Not in font edit mode, checking naming convention...');
    // Check if this is a font character naming convention: {fontName}_{character}
    const fontCharMatch = canvasName.match(/^(.+)_(.+)$/);
    
    if (fontCharMatch) {
        console.log('Font character naming convention detected:', fontCharMatch);
        // This is a font character - save to font
        const fontName = fontCharMatch[1];
        const character = fontCharMatch[2];
        console.log('Calling saveCharacterToFont with:', { fontName, character });
        saveCharacterToFont(fontName, character);
    } else {
        console.log('Normal mode - showing dropdown');
        // Normal mode - show dropdown
        toggleSaveDropdown();
    }
    
    console.log('=== SAVE BUTTON CLICK DEBUG END ===');
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
                
                // Refresh the compositions list
                if (window.loadCompositions) window.loadCompositions();
            });
        }
    } else {
        compositions.push(composition);
        localStorage.setItem('pixelCompositions', JSON.stringify(compositions));
        DOM.canvasName.value = '';
        hideSaveDropdown();
        if (window.updateCounts) window.updateCounts();
        if (window.showAlert) window.showAlert('Composition saved successfully!');
        
        // Refresh the compositions list
        if (window.loadCompositions) window.loadCompositions();
    }
}

// Save character to font (when using font naming convention)
function saveCharacterToFont(fontName, character) {
    const pixelData = getCanvasData();
    
    console.log('saveCharacterToFont:', { fontName, character, pixelData });
    
    // Check if canvas is empty - handle both hex and rgb formats
    const isEmpty = pixelData.every(color => 
        color === '#000000' || 
        color === 'rgb(0, 0, 0)' || 
        color === '' || 
        color === 'transparent'
    );
    
    console.log('saveCharacterToFont: Empty check - pixelData length:', pixelData.length);
    console.log('saveCharacterToFont: Empty check - non-black pixels found:', pixelData.filter(c => 
        c !== '#000000' && c !== 'rgb(0, 0, 0)' && c !== '' && c !== 'transparent'
    ).length);
    
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
    const fonts = getFontsArray(); // Use shared fonts array instead of local copy
    
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
    
    // Update font dimensions based on new logic:
    // - Width: Individual per character
    // - Height: Universal across all characters in the font
    
    // Update this character's width individually
    updateCharacterWidth(fontName, character, width);
    
    // Update height universally for all characters in the font
    // Use default bottom anchor since we don't have resize context here
    updateFontCharactersHeight(fontName, height, 'bottom');
    
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
    console.log('=== SAVE CHARACTER DEBUG START ===');
    console.log('Current editing state:', { 
        isFontEditMode, 
        currentEditingFont, 
        currentEditingCharacter 
    });
    
    if (!currentEditingFont || !currentEditingCharacter) {
        console.error('Missing font or character:', { currentEditingFont, currentEditingCharacter });
        if (window.showAlert) window.showAlert('No font or character selected for editing.');
        return;
    }
    
    console.log('Getting canvas data...');
    const pixelData = getCanvasData();
    console.log('Canvas data received:', {
        length: pixelData.length,
        firstFewPixels: pixelData.slice(0, 10),
        lastFewPixels: pixelData.slice(-10)
    });
    
    // Check if canvas is empty - handle both hex and rgb formats
    const isEmpty = pixelData.every(color => 
        color === '#000000' || 
        color === 'rgb(0, 0, 0)' || 
        color === '' || 
        color === 'transparent'
    );
    
    console.log('saveCharacter: Empty check - pixelData length:', pixelData.length);
    console.log('saveCharacter: Empty check - non-black pixels found:', pixelData.filter(c => 
        c !== '#000000' && c !== 'rgb(0, 0, 0)' && c !== '' && c !== 'transparent'
    ).length);
    
    if (isEmpty) {
        console.error('Canvas is empty - cannot save');
        if (window.showAlert) window.showAlert('Cannot save an empty character.');
        return;
    }
    
    // Convert 1D array to 2D array for font storage
    const { width, height } = getCanvasDimensions();
    console.log('Canvas dimensions:', { width, height });
    
    const characterData = [];
    for (let y = 0; y < height; y++) {
        const row = [];
        for (let x = 0; x < width; x++) {
            const index = y * width + x;
            row.push(pixelData[index] || '#000000');
        }
        characterData.push(row);
    }
    
    console.log('Converted to 2D array:', {
        rows: characterData.length,
        firstRow: characterData[0],
        lastRow: characterData[characterData.length - 1]
    });
    
    // Save to font using the correct storage key
    console.log('Reading fonts from localStorage...');
    const fonts = getFontsArray(); // Use shared fonts array instead of local copy
    console.log('saveCharacter: Current fonts from storage:', fonts);
    
    // Find the font by name
    const fontIndex = fonts.findIndex(font => font.name === currentEditingFont);
    console.log('saveCharacter: Font index found:', fontIndex, 'for font:', currentEditingFont);
    
    if (fontIndex === -1) {
        console.error('Font not found in storage:', currentEditingFont);
        if (window.showAlert) window.showAlert(`Font "${currentEditingFont}" not found.`);
        return;
    }
    
    // Initialize characters object if it doesn't exist
    if (!fonts[fontIndex].characters) {
        fonts[fontIndex].characters = {};
        console.log('saveCharacter: Initialized characters object for font');
    }
    
    // Save the character data
    fonts[fontIndex].characters[currentEditingCharacter] = characterData;
    console.log('saveCharacter: Saved character data for:', currentEditingCharacter, 'in font:', currentEditingFont);
    console.log('saveCharacter: Character data saved:', characterData);
    
    // Debug: Check what's in the fonts array now
    console.log('saveCharacter: Fonts array after saving character:', fonts);
    console.log('saveCharacter: Font at index', fontIndex, 'after saving:', fonts[fontIndex]);
    console.log('saveCharacter: Characters object after saving:', fonts[fontIndex].characters);
    
    console.log('About to save to localStorage...');
    localStorage.setItem('smolui_fonts', JSON.stringify(fonts));
    console.log('saveCharacter: Updated fonts saved to localStorage');
    
    // Verify the save worked
    const verifyData = JSON.parse(localStorage.getItem('smolui_fonts') || '[]');
    const verifyFont = verifyData.find(font => font.name === currentEditingFont);
    const verifyChar = verifyFont?.characters?.[currentEditingCharacter];
    console.log('Verification - saved character data:', verifyChar);
    console.log('Verification - full font data:', verifyFont);
    console.log('Verification - all fonts in storage:', verifyData);
    
    // Update font dimensions based on new logic:
    // - Width: Individual per character
    // - Height: Universal across all characters in the font
    
    console.log('Updating character width...');
    // Update this character's width individually
    updateCharacterWidth(currentEditingFont, currentEditingCharacter, width);
    
    console.log('Updating font height...');
    // Update height universally for all characters in the font
    // Use the current resize anchor to maintain proper alignment
    console.log('About to call getCurrentResizeAnchor...');
    const resizeAnchor = window.getCurrentResizeAnchor ? window.getCurrentResizeAnchor() : 'bottom';
    console.log('getCurrentResizeAnchor returned:', resizeAnchor);
    console.log('Using resize anchor for height update:', resizeAnchor);
    console.log('Window getCurrentResizeAnchor function exists:', !!window.getCurrentResizeAnchor);
    updateFontCharactersHeight(currentEditingFont, height, resizeAnchor);
    
    if (window.showAlert) window.showAlert(`Character "${currentEditingCharacter}" saved to font "${currentEditingFont}"!`);
    
    // Don't reload fonts from storage - this overwrites the data we just saved
    // The fonts array already has the updated data
    console.log('Character saved successfully - fonts array updated');
    
    // Update font display immediately since we have the data in memory
    console.log('saveCharacter: Updating font display...');
    if (window.updateFontsList) {
        window.updateFontsList();
        console.log('saveCharacter: updateFontsList completed');
    }
    if (window.updateCounts) {
        window.updateCounts();
        console.log('saveCharacter: updateCounts completed');
    }
    
    // Final save to localStorage to ensure all updates are persisted
    console.log('Final save to localStorage...');
    console.log('Fonts array before final save:', fonts);
    console.log('Font being saved:', fonts.find(f => f.name === currentEditingFont));
    console.log('Characters in font before final save:', fonts.find(f => f.name === currentEditingFont)?.characters);
    
    saveFontsToStorage();
    console.log('Final save to localStorage completed');
    
    // Verify the final save worked
    const finalVerifyData = JSON.parse(localStorage.getItem('smolui_fonts') || '[]');
    const finalVerifyFont = finalVerifyData.find(font => font.name === currentEditingFont);
    console.log('Final verification - all fonts in storage:', finalVerifyData);
    console.log('Final verification - font data:', finalVerifyFont);
    console.log('Final verification - characters object:', finalVerifyFont?.characters);
    
    console.log('=== SAVE CHARACTER DEBUG END ===');
}

// Enter font edit mode
export function enterFontEditMode(fontName, character) {
    console.log('=== ENTER FONT EDIT MODE DEBUG START ===');
    console.log('Entering font edit mode:', { fontName, character });
    
    // Store current character data as previous character before switching
    if (isFontEditMode && currentEditingFont === fontName && currentEditingCharacter !== character) {
        console.log('Switching to different character in same font, storing current data...');
        // We're switching to a different character in the same font, store current as previous
        const currentCanvasData = getCanvasData();
        if (currentCanvasData && currentCanvasData.some(color => color !== '#000000')) {
            // Convert 1D array to 2D array for storage
            const { width, height } = getCanvasDimensions();
            const characterData = [];
            
            for (let y = 0; y < height; y++) {
                const row = [];
                for (let x = 0; x < width; x++) {
                    const index = y * width + x;
                    row.push(currentCanvasData[index] || '#000000');
                }
                characterData.push(row);
            }
            
            previousCharacterData = {
                character: currentEditingCharacter,
                data: characterData,
                width: width,
                height: height
            };
            console.log('Stored previous character data for ghost preview:', previousCharacterData);
        }
    }
    
    console.log('Setting font edit mode state...');
    isFontEditMode = true;
    currentEditingFont = fontName;
    currentEditingCharacter = character;
    
    console.log('Updated state:', { isFontEditMode, currentEditingFont, currentEditingCharacter });
    
    // Expose globally for other modules to access
    window.currentEditingFont = currentEditingFont;
    window.currentEditingCharacter = currentEditingCharacter;
    
    // Update canvas name
    DOM.canvasName.value = `${fontName}_${character}`;
    console.log('Updated canvas name to:', DOM.canvasName.value);
    
    // Note: Canvas size is no longer automatically enforced to 14x14
    // Users can now freely resize the canvas for each character
    // Width can be unique per character, height is universal across the font
    
    // Show reference lines for font editing AFTER canvas is recreated
    // Use a small delay to ensure canvas is ready
    setTimeout(() => {
        console.log('Showing reference lines...');
        if (window.showReferenceLines) {
            // Load font-level reference line positions or set defaults
            loadFontReferenceLinePositions(fontName);
            
            window.showReferenceLines();
            console.log('Reference lines shown and positioned');
        } else {
            console.error('showReferenceLines function not available');
        }
        
        // Show ghost preview of previous character if available
        if (previousCharacterData && previousCharacterData.character !== character) {
            showGhostPreview(previousCharacterData);
        }
    }, 100); // Increased delay to ensure canvas is fully ready
    
    // Update save button
    console.log('Updating save button state...');
    updateSaveButtonState();
    
    console.log('=== ENTER FONT EDIT MODE DEBUG END ===');
}

// Exit font edit mode
export function exitFontEditMode() {
    console.log('Exiting font edit mode');
    
    isFontEditMode = false;
    currentEditingFont = null;
    currentEditingCharacter = null;
    
    // Clear global variables
    window.currentEditingFont = null;
    window.currentEditingCharacter = null;
    
    // Clear canvas name
    DOM.canvasName.value = '';
    
    // Hide reference lines when exiting font edit mode
    if (window.hideReferenceLines) {
        window.hideReferenceLines();
    }
    
    // Clear ghost preview when exiting font edit mode
    clearGhostPreview();
    
    // Clear previous character data
    previousCharacterData = null;
    
    // Update save button
    updateSaveButtonState();
    
    // Hide dropdown if visible
    hideSaveDropdown();
}

// Update save button state
export function updateSaveButtonState() {
    console.log('=== UPDATE SAVE BUTTON STATE DEBUG START ===');
    console.log('Updating save button state:', { isFontEditMode, currentEditingFont, currentEditingCharacter });
    
    if (isFontEditMode) {
        console.log('Setting button to SAVE CHARACTER mode');
        DOM.saveBtn.textContent = 'SAVE CHARACTER';
        DOM.saveBtn.classList.add('font-edit-mode');
        console.log('Save button set to SAVE CHARACTER mode');
        console.log('Button text is now:', DOM.saveBtn.textContent);
    } else {
        console.log('Setting button to SAVE AS mode');
        DOM.saveBtn.textContent = 'SAVE AS';
        DOM.saveBtn.classList.remove('font-edit-mode');
        console.log('Save button set to SAVE AS mode');
        console.log('Button text is now:', DOM.saveBtn.textContent);
    }
    
    console.log('=== UPDATE SAVE BUTTON STATE DEBUG END ===');
}

// Get current save state
export function getSaveState() {
    return {
        isFontEditMode,
        currentEditingFont,
        currentEditingCharacter
    };
}

// Load font-level reference line positions or set defaults
export function loadFontReferenceLinePositions(fontName) {
    console.log('Loading font reference line positions for:', fontName);
    const fonts = getFontsArray(); // Use shared fonts array
    const font = fonts.find(f => f.name === fontName);
    
    console.log('Found font:', font);
    
    if (!font) {
        console.log('Font not found, cannot load reference line positions');
        return;
    }
    
    // Check if font has stored reference line positions
    if (font.referenceLines && font.referenceLines.baseline !== undefined && font.referenceLines.vertical !== undefined) {
        console.log('Loading font reference line positions:', font.referenceLines);
        // Load stored positions
        if (window.setBaselinePosition) {
            window.setBaselinePosition(font.referenceLines.baseline);
            console.log('Set baseline position to:', font.referenceLines.baseline);
        }
        if (window.setVerticalPosition) {
            window.setVerticalPosition(font.referenceLines.vertical);
            console.log('Set vertical position to:', font.referenceLines.vertical);
        }
    } else {
        console.log('Setting default reference line positions for 14x14 canvas');
        // Set default positions: baseline at y=10, vertical at x=2
        const defaultBaselineY = 10; // 14x14 canvas, baseline at y=10
        const defaultVerticalX = 2;  // 14x14 canvas, vertical at x=2
        
        console.log('Default positions:', { baselineY: defaultBaselineY, verticalX: defaultVerticalX });
        
        if (window.setBaselinePosition) {
            window.setBaselinePosition(defaultBaselineY);
            console.log('Set default baseline position to:', defaultBaselineY);
        }
        if (window.setVerticalPosition) {
            window.setVerticalPosition(defaultVerticalX);
            console.log('Set default vertical position to:', defaultVerticalX);
        }
        
        // Save these default positions to the font
        saveFontReferenceLinePositions(fontName, defaultBaselineY, defaultVerticalX);
    }
}

// Show ghost preview of previous character
export function showGhostPreview(previousData) {
    console.log('Showing ghost preview for character:', previousData.character);
    
    // Clear any existing ghost preview
    clearGhostPreview();
    
    // Create ghost preview container
    const ghostContainer = document.createElement('div');
    ghostContainer.className = 'ghost-preview-container';
    ghostContainer.style.position = 'absolute';
    ghostContainer.style.top = '0';
    ghostContainer.style.left = '0';
    ghostContainer.style.width = '100%';
    ghostContainer.style.height = '100%';
    ghostContainer.style.pointerEvents = 'none';
    ghostContainer.style.zIndex = '100'; // Much lower z-index so drawn pixels appear above
    
    // Get pixel size for positioning
    const firstPixel = document.querySelector('.pixel');
    if (!firstPixel) {
        console.log('Canvas not ready for ghost preview');
        return;
    }
    
    const pixelSize = parseInt(getComputedStyle(firstPixel).width);
    
    // Create ghost pixels for the previous character
    for (let y = 0; y < previousData.height; y++) {
        for (let x = 0; x < previousData.width; x++) {
            const color = previousData.data[y][x];
            if (color && color !== '#000000') {
                const ghostPixel = document.createElement('div');
                ghostPixel.className = 'ghost-pixel';
                ghostPixel.style.position = 'absolute';
                ghostPixel.style.left = `${x * pixelSize}px`;
                ghostPixel.style.top = `${y * pixelSize}px`;
                ghostPixel.style.width = `${pixelSize}px`;
                ghostPixel.style.height = `${pixelSize}px`;
                ghostPixel.style.backgroundColor = color;
                ghostPixel.style.opacity = '0.08'; // Extremely subtle opacity
                ghostPixel.style.border = '1px solid rgba(128, 128, 128, 0.1)'; // Very subtle border
                ghostPixel.style.boxSizing = 'border-box';
                
                ghostContainer.appendChild(ghostPixel);
            }
        }
    }
    
    // Add ghost container to canvas
    const pixelGrid = document.querySelector('.pixel-grid');
    if (pixelGrid) {
        pixelGrid.appendChild(ghostContainer);
        console.log('Ghost preview added to canvas');
    }
}

// Clear ghost preview
export function clearGhostPreview() {
    const ghostContainer = document.querySelector('.ghost-preview-container');
    if (ghostContainer) {
        ghostContainer.remove();
        console.log('Ghost preview cleared');
    }
}

// Save font-level reference line positions
export function saveFontReferenceLinePositions(fontName, baselineY, verticalX) {
    console.log('Saving font reference line positions:', { fontName, baselineY, verticalX });
    
    const fonts = getFontsArray(); // Use shared fonts array
    const fontIndex = fonts.findIndex(font => font.name === fontName);
    
    if (fontIndex === -1) {
        console.log('Font not found, cannot save reference line positions');
        return;
    }
    
    // Initialize referenceLines object if it doesn't exist
    if (!fonts[fontIndex].referenceLines) {
        fonts[fontIndex].referenceLines = {};
        console.log('Initialized referenceLines object for font');
    }
    
    // Save the positions
    fonts[fontIndex].referenceLines.baseline = baselineY;
    fonts[fontIndex].referenceLines.vertical = verticalX;
    
    // Save to localStorage
    localStorage.setItem('smolui_fonts', JSON.stringify(fonts));
    console.log('Saved font reference line positions to localStorage:', { fontName, baselineY, verticalX });
    console.log('Updated font object:', fonts[fontIndex]);
} 
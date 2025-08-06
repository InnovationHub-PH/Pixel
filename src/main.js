// Main Application Entry Point
// Orchestrates all modules and handles global initialization

// Import DOM elements
import * as DOM from './modules/domElements.js';

// Import existing modules
import { 
  initializeFontManager, 
  updateFontsList, 
  updateFontSelector,
  selectFontCharacter,
  getFontByName,
  getFontCharacterData,
  getAllFonts,
  getCurrentEditingFont,
  handleCharacterSave,
  loadFontsFromStorage
} from './modules/fontManager.js';

import {
  initializeExportManager,
  updateExportContent,
  copyCodeToClipboard,
  getCurrentExportSettings,
  setExportSettings,
  exportCanvasData
} from './modules/exportManager.js';

// Import new modules
import { 
  initializeCanvas, 
  createGrid, 
  updateDimensions, 
  applyDimensions,
  clearCanvas,
  loadCanvasFromData,
  loadDataToCanvas,
  saveCanvasState,
  restoreCanvasState,
  undo,
  redo,
  getCanvasData,
  getCanvasDimensions,
  setBrushProperties as setCanvasBrushProperties
} from './modules/canvasManager.js';

console.log('canvasManager imported:', { initializeCanvas, createGrid, saveCanvasState });

import {
  initializeToolManager,
  setActiveTool as setToolActiveTool,
  updateToolControls,
  updateColorControlsVisibility,
  updateColorDisplay,
  getCurrentTool,
  getBrushProperties,
  setBrushProperties as setToolBrushProperties
} from './modules/toolManager.js';

console.log('toolManager imported:', { initializeToolManager, getCurrentTool });

import {
  initializeComponentManager,
  loadComponents,
  placeComponent,
  deleteComponent,
  clearAllComponents,
  showComponentPreview,
  clearComponentPreview,
  handleComponentClick,
  updateCounts
} from './modules/componentManager.js';

console.log('componentManager imported:', { initializeComponentManager, loadComponents });

import {
  initializeModalManager,
  showConfirm,
  showAlert,
  confirmAction
} from './modules/modalManager.js';

console.log('modalManager imported:', { initializeModalManager, showConfirm, showAlert });

import {
  initializeTypeManager,
  handleTypeClick,
  showTextPreview,
  clearTypingPreview,
  exitTypingMode
} from './modules/typeManager.js';

console.log('typeManager imported:', { initializeTypeManager, handleTypeClick });

import {
  initializeExportCodeGenerator,
  updateExportCode,
  updateSubFormatOptions,
  copyArduinoCode
} from './modules/exportCodeGenerator.js';

console.log('exportCodeGenerator imported:', { initializeExportCodeGenerator, updateExportCode });

import {
  initializeSaveManager,
  enterFontEditMode,
  exitFontEditMode,
  updateSaveButtonState,
  getSaveState
} from './modules/saveManager.js';

console.log('saveManager imported:', { initializeSaveManager, enterFontEditMode, exitFontEditMode });

// Application state
let fonts = JSON.parse(localStorage.getItem('fonts')) || {};
let components = JSON.parse(localStorage.getItem('components')) || {};
let compositions = JSON.parse(localStorage.getItem('compositions')) || {};

// Global functions for cross-module communication
window.currentTool = 'draw';
window.placingComponent = null;
window.updateExportCode = updateExportCode;
window.saveCanvasState = saveCanvasState;
window.clearCanvas = clearCanvas;
window.getCurrentTool = getCurrentTool;
window.showAlert = showAlert;
window.showConfirm = showConfirm;
window.handleTypeClick = handleTypeClick;
window.showTextPreview = showTextPreview;
window.clearTypingPreview = clearTypingPreview;
window.exitTypingMode = exitTypingMode;
window.showComponentPreview = showComponentPreview;
window.clearComponentPreview = clearComponentPreview;
window.handleComponentClick = handleComponentClick;
window.setCanvasBrushProperties = setCanvasBrushProperties;
window.enterFontEditMode = enterFontEditMode;
window.exitFontEditMode = exitFontEditMode;
window.updateSaveButtonState = updateSaveButtonState;
window.getSaveState = getSaveState;
window.loadComponents = loadComponents;
window.updateCounts = updateCounts;
window.updateFontsList = updateFontsList;
window.loadCanvasFromData = loadCanvasFromData;
window.loadDataToCanvas = loadDataToCanvas;
window.loadFontsFromStorage = loadFontsFromStorage;
window.setActiveTool = setActiveTool;
window.applyDimensions = applyDimensions;

// Get current editing character info
function getCurrentEditingCharacterInfo() {
  // This function should return info about the currently editing character
  // For now, return null to prevent errors
  return null;
}

// Set active tool
function setActiveTool(tool) {
    window.currentTool = tool;
    setToolActiveTool(tool);
}

// Edit font function
function editFont(fontId) {
    // Implementation for editing fonts
    console.log('Edit font:', fontId);
}

// Delete font function
function deleteFont(fontId) {
    showConfirm(`Delete font "${fonts[fontId]?.name}"?`, () => {
        delete fonts[fontId];
        localStorage.setItem('fonts', JSON.stringify(fonts));
        updateFontsList();
        showAlert('Font deleted successfully');
    });
}

// Update UI function
function updateUI() {
  // Update save button text based on current editing state
  const editingInfo = getCurrentEditingCharacterInfo();
  if (editingInfo) {
    DOM.saveBtn.textContent = `SAVE ${editingInfo.char} TO ${editingInfo.fontName}`;
  } else {
    DOM.saveBtn.textContent = 'SAVE AS';
  }

  // Update font-related UI
  updateFontsList();
  updateFontSelector();
  
  // Update export content
  updateExportContent();
}

// Initialize the application
function initializeApp() {
  console.log('Starting app initialization...');
  
  try {
    // Test module imports
    console.log('Testing module imports...');
    console.log('canvasManager functions:', { initializeCanvas, createGrid, saveCanvasState });
    console.log('toolManager functions:', { initializeToolManager, getCurrentTool });
    console.log('componentManager functions:', { initializeComponentManager, loadComponents });
    console.log('modalManager functions:', { initializeModalManager, showConfirm, showAlert });
    console.log('typeManager functions:', { initializeTypeManager, handleTypeClick });
    console.log('exportCodeGenerator functions:', { initializeExportCodeGenerator, updateExportCode });
    console.log('saveManager functions:', { initializeSaveManager, enterFontEditMode, exitFontEditMode });
    
    // Check if DOM elements exist
    console.log('Checking DOM elements...');
    if (!DOM.pixelGrid) {
      console.error('pixelGrid element not found');
      return;
    }
    if (!DOM.fontsList) {
      console.error('fontsList element not found');
        return;
    }
    if (!DOM.exportContent) {
      console.error('exportContent element not found');
        return;
    }
    if (!DOM.saveBtn) {
      console.error('saveBtn element not found');
        return;
    }
    if (!DOM.saveOptions) {
      console.error('saveOptions element not found');
        return;
    }
    if (!DOM.saveAsComponent) {
      console.error('saveAsComponent element not found');
        return;
    }
    if (!DOM.saveAsComposition) {
      console.error('saveAsComposition element not found');
            return;
        }
        
    console.log('All required DOM elements found successfully');
    
    // Initialize all modules
    console.log('Initializing fontManager...');
    initializeFontManager();
    
    console.log('Initializing exportManager...');
    initializeExportManager();
    
    console.log('Initializing canvas...');
    initializeCanvas();
    
    console.log('Initializing toolManager...');
    initializeToolManager();
    
    console.log('Initializing componentManager...');
    initializeComponentManager();
    
    console.log('Initializing modalManager...');
    initializeModalManager();
    
    console.log('Initializing typeManager...');
    initializeTypeManager();
    
    console.log('Initializing exportCodeGenerator...');
    initializeExportCodeGenerator();
    
    console.log('Initializing saveManager...');
    initializeSaveManager();
    
    // Setup global event listeners
    console.log('Setting up global event listeners...');
    setupGlobalEventListeners();
    
    // Initialize UI
    console.log('Initializing UI...');
    updateFontSelector();
    updateFontsList();
    updateExportContent();
    updateSubFormatOptions();
    
    // Save initial state
    console.log('Saving initial state...');
    saveCanvasState();
    
    console.log('App initialization complete!');
  } catch (error) {
    console.error('Error during app initialization:', error);
    console.error('Error stack:', error.stack);
  }
}

// Setup global event listeners
function setupGlobalEventListeners() {
  // Dimension controls
  DOM.applyDimensionsBtn.addEventListener('click', applyDimensions);

  // Clear buttons
  DOM.clearCompositionsBtn.addEventListener('click', () => {
    showConfirm('Clear all saved compositions?', clearAllCompositions);
  });

  // Keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    // Check for Ctrl (Windows/Linux) or Cmd (Mac)
    const isCtrlOrCmd = e.ctrlKey || e.metaKey;
    
    if (isCtrlOrCmd && e.key === 'z' && !e.shiftKey) {
      e.preventDefault();
      undo();
    } else if (isCtrlOrCmd && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
      e.preventDefault();
      redo();
    }
  });
}

// Composition management (placeholder)
function loadCompositions() {
    const compositions = JSON.parse(localStorage.getItem('pixelCompositions') || '[]');
    renderCompositionsList(compositions);
}

function renderCompositionsList(compositions) {
  DOM.compositionsList.innerHTML = '';
    
    if (compositions.length === 0) {
    DOM.compositionsList.innerHTML = '<div class="saved-empty">No compositions saved yet</div>';
        return;
    }
    
    // Placeholder for composition rendering
}

function clearAllCompositions() {
    localStorage.removeItem('pixelCompositions');
    loadCompositions();
    updateCounts();
}

// Simple test function to verify JavaScript is working
function testJavaScript() {
    console.log('JavaScript is working!');
    
    // Test DOM elements
    const testElements = [
        'pixelGrid',
        'saveBtn', 
        'saveOptions',
        'fontsList',
        'exportContent'
    ];
    
    testElements.forEach(id => {
        const element = document.getElementById(id);
        console.log(`${id}: ${element ? 'FOUND' : 'NOT FOUND'}`);
    });
    
    // Test if modules are loaded
    console.log('Module test:', {
        canvasManager: typeof initializeCanvas !== 'undefined',
        toolManager: typeof initializeToolManager !== 'undefined',
        componentManager: typeof initializeComponentManager !== 'undefined',
        modalManager: typeof initializeModalManager !== 'undefined',
        typeManager: typeof initializeTypeManager !== 'undefined',
        exportCodeGenerator: typeof initializeExportCodeGenerator !== 'undefined',
        saveManager: typeof initializeSaveManager !== 'undefined'
    });
}

// Call test function when DOM is loaded
document.addEventListener('DOMContentLoaded', testJavaScript);

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM Content Loaded - Starting initialization...');
  console.log('Document ready state:', document.readyState);
  console.log('DOM elements available:', {
    pixelGrid: !!document.getElementById('pixelGrid'),
    saveBtn: !!document.getElementById('saveBtn'),
    saveOptions: !!document.getElementById('saveOptions')
  });
  initializeApp();
});

// Expose functions to global scope for inline event handlers
window.editCharacter = editCharacter;
window.toggleFontEditMode = toggleFontEditMode;
window.deleteFont = deleteFont;
window.placeComponent = placeComponent;
window.deleteComponent = deleteComponent;

// Expose functions to global scope for fontManager to call
window.switchToDrawTool = () => setActiveTool('draw');
window.switchToTypeTool = () => setActiveTool('type');
window.updateUI = updateUI;
window.saveFontCharacter = handleCharacterSave; // Expose for fontManager to use

// Placeholder functions for backward compatibility
function editCharacter(fontName, character) {
  // This will be handled by typeManager
  console.log('Edit character:', fontName, character);
}

function toggleFontEditMode(fontName) {
  // This will be handled by typeManager
  console.log('Toggle font edit mode:', fontName);
}
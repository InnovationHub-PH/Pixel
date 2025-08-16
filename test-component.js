// Test script for component placement functionality
console.log('Testing component placement functionality...');

// Test 1: Check if component manager is loaded
if (typeof window.placeComponent === 'function') {
    console.log('✅ placeComponent function is available');
} else {
    console.error('❌ placeComponent function is not available');
}

// Test 2: Check if brush functionality is loaded
if (typeof window.enableComponentBrush === 'function') {
    console.log('✅ enableComponentBrush function is available');
} else {
    console.error('❌ enableComponentBrush function is not available');
}

// Test 3: Check if components list exists
const componentsList = document.getElementById('componentsList');
if (componentsList) {
    console.log('✅ Components list element found');
} else {
    console.error('❌ Components list element not found');
}

// Test 4: Check if canvas exists
const pixelGrid = document.getElementById('pixelGrid');
if (pixelGrid) {
    console.log('✅ Pixel grid element found');
} else {
    console.error('❌ Pixel grid element not found');
}

// Test 5: Check if MOVE tool exists
const moveTool = document.querySelector('[data-tool="move"]');
if (moveTool) {
    console.log('✅ MOVE tool found');
} else {
    console.error('❌ MOVE tool not found');
}

// Test 6: Create a test component
function createTestComponent() {
    const testComponent = {
        name: 'Test Component',
        width: 4,
        height: 4,
        data: [
            '#ff0000', '#00ff00', '#0000ff', '#ffff00',
            '#ff00ff', '#00ffff', '#ffffff', '#000000',
            '#ff0000', '#00ff00', '#0000ff', '#ffff00',
            '#ff00ff', '#00ffff', '#ffffff', '#000000'
        ],
        timestamp: Date.now()
    };
    
    const components = JSON.parse(localStorage.getItem('pixelComponents') || '[]');
    components.push(testComponent);
    localStorage.setItem('pixelComponents', JSON.stringify(components));
    
    console.log('✅ Test component created and saved');
    
    // Reload components list
    if (window.loadComponents) {
        window.loadComponents();
        console.log('✅ Components list reloaded');
    } else {
        console.error('❌ loadComponents function not available');
    }
}

// Test 7: Test component placement
function testComponentPlacement() {
    if (typeof window.placeComponent === 'function') {
        // Get the first component
        const components = JSON.parse(localStorage.getItem('pixelComponents') || '[]');
        if (components.length > 0) {
            console.log('✅ Testing component placement with:', components[0].name);
            window.placeComponent(0);
        } else {
            console.log('⚠️ No components available for testing');
        }
    }
}

// Test 8: Test brush functionality
function testBrushFunctionality() {
    if (typeof window.enableComponentBrush === 'function') {
        // Get the first component
        const components = JSON.parse(localStorage.getItem('pixelComponents') || '[]');
        if (components.length > 0) {
            console.log('✅ Testing brush functionality with:', components[0].name);
            window.enableComponentBrush(0);
        } else {
            console.log('⚠️ No components available for testing');
        }
    }
}

// Test 9: Test pixel preservation
function testPixelPreservation() {
    console.log('🧪 Testing pixel preservation...');
    
    // Draw some pixels on the canvas first
    const pixels = document.querySelectorAll('.pixel');
    if (pixels.length > 0) {
        // Draw a pattern in the top-left area
        for (let i = 0; i < 8; i++) {
            pixels[i].style.backgroundColor = '#00ff00'; // Green
        }
        console.log('✅ Drew test pattern on canvas');
        
        // Now place a component and see if it preserves the pattern
        setTimeout(() => {
            if (typeof window.placeComponent === 'function') {
                const components = JSON.parse(localStorage.getItem('pixelComponents') || '[]');
                if (components.length > 0) {
                    console.log('✅ Testing component placement over existing pixels...');
                    window.placeComponent(0);
                }
            }
        }, 1000);
    }
}

// Run tests
console.log('Running component placement tests...');
createTestComponent();
setTimeout(testComponentPlacement, 1000);
setTimeout(testBrushFunctionality, 2000);
setTimeout(testPixelPreservation, 3000);

console.log('Component placement tests completed'); 
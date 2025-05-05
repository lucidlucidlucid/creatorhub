// Color Converter JavaScript

document.addEventListener('DOMContentLoaded', () => {
    // Force apply Gogga font to all inputs
    document.querySelectorAll('input, select').forEach(el => {
        el.style.fontFamily = "'Gogga', sans-serif";
        el.style.textTransform = "uppercase";
    });

    // Elements
    const redInput = document.getElementById('gtag-r');
    const greenInput = document.getElementById('gtag-g');
    const blueInput = document.getElementById('gtag-b');
    const redSlider = document.getElementById('gtag-r-slider');
    const greenSlider = document.getElementById('gtag-g-slider');
    const blueSlider = document.getElementById('gtag-b-slider');
    const hexDisplay = document.getElementById('hex-display');
    const rgbDisplay = document.getElementById('rgb-display');
    const colorDisplay = document.getElementById('color-display');
    const randomButton = document.getElementById('random-color');
    const resetButton = document.getElementById('reset-color');
    const copyButtons = document.querySelectorAll('.copy-btn');

    // Function to convert GTAG color (0-9) to standard RGB (0-255)
    function gtagToRgb(value) {
        // Map from 0-9 range to 0-255 range
        return Math.round((value / 9) * 255);
    }

    // Function to convert RGB to hex
    function rgbToHex(r, g, b) {
        const toHex = (c) => {
            const hex = c.toString(16);
            return hex.length === 1 ? '0' + hex : hex;
        };
        return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
    }

    // Function to validate and clamp input to 0-9 range
    function validateInput(input) {
        let value = parseInt(input.value);
        if (isNaN(value)) {
            value = 0;
        }
        value = Math.max(0, Math.min(9, value));
        input.value = value;
        return value;
    }

    // Function to update sliders from inputs
    function updateSliderFromInput(input, slider) {
        const value = validateInput(input);
        slider.value = value;
        return value;
    }

    // Function to update inputs from sliders
    function updateInputFromSlider(slider, input) {
        const value = parseInt(slider.value);
        input.value = value;
        return value;
    }

    // Function to convert and update the display
    function updateColorDisplay() {
        // Get the current GTAG RGB values
        const r = parseInt(redInput.value);
        const g = parseInt(greenInput.value);
        const b = parseInt(blueInput.value);

        // Convert to standard RGB
        const standardR = gtagToRgb(r);
        const standardG = gtagToRgb(g);
        const standardB = gtagToRgb(b);

        // Convert to hex
        const hexColor = rgbToHex(standardR, standardG, standardB);
        
        // Update color displays
        colorDisplay.style.backgroundColor = hexColor;
        hexDisplay.textContent = hexColor.toUpperCase();
        rgbDisplay.textContent = `rgb(${standardR}, ${standardG}, ${standardB})`;

        // Update slider colors
        updateSliderBackground(redSlider, 'red', r);
        updateSliderBackground(greenSlider, 'green', g);
        updateSliderBackground(blueSlider, 'blue', b);
    }

    // Update the slider background to show the color gradient
    function updateSliderBackground(slider, color, value) {
        let gradientColor;
        
        switch(color) {
            case 'red':
                gradientColor = `rgb(${gtagToRgb(value)}, 0, 0)`;
                break;
            case 'green':
                gradientColor = `rgb(0, ${gtagToRgb(value)}, 0)`;
                break;
            case 'blue':
                gradientColor = `rgb(0, 0, ${gtagToRgb(value)})`;
                break;
        }
        
        // Set the slider's background to show the current color
        slider.style.setProperty('--thumb-color', gradientColor);
    }

    // Generate a random GTAG color
    function generateRandomColor() {
        redInput.value = Math.floor(Math.random() * 10);
        greenInput.value = Math.floor(Math.random() * 10);
        blueInput.value = Math.floor(Math.random() * 10);
        
        redSlider.value = redInput.value;
        greenSlider.value = greenInput.value;
        blueSlider.value = blueInput.value;
        
        updateColorDisplay();
    }

    // Reset the color to black (0,0,0)
    function resetColor() {
        redInput.value = 0;
        greenInput.value = 0;
        blueInput.value = 0;
        
        redSlider.value = 0;
        greenSlider.value = 0;
        blueSlider.value = 0;
        
        updateColorDisplay();
    }

    // Copy text to clipboard
    function copyToClipboard(text) {
        navigator.clipboard.writeText(text).then(() => {
            // Success
        }).catch(err => {
            console.error('Could not copy text: ', err);
        });
    }

    // Show a tooltip
    function showTooltip(element, message) {
        const tooltip = document.createElement('div');
        tooltip.className = 'tooltip';
        tooltip.textContent = message;
        document.body.appendChild(tooltip);

        const rect = element.getBoundingClientRect();
        tooltip.style.position = 'absolute';
        tooltip.style.top = `${rect.top - 30}px`;
        tooltip.style.left = `${rect.left + rect.width / 2 - tooltip.offsetWidth / 2}px`;
        tooltip.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
        tooltip.style.color = 'white';
        tooltip.style.padding = '5px 10px';
        tooltip.style.borderRadius = '4px';
        tooltip.style.fontSize = '14px';
        tooltip.style.pointerEvents = 'none';
        tooltip.style.zIndex = '1000';
        tooltip.style.opacity = '0';
        tooltip.style.transition = 'opacity 0.3s';

        setTimeout(() => {
            tooltip.style.opacity = '1';
        }, 10);

        setTimeout(() => {
            tooltip.style.opacity = '0';
            setTimeout(() => {
                document.body.removeChild(tooltip);
            }, 300);
        }, 1500);
    }

    // Event listeners for number inputs
    redInput.addEventListener('input', () => {
        updateSliderFromInput(redInput, redSlider);
        updateColorDisplay();
    });

    greenInput.addEventListener('input', () => {
        updateSliderFromInput(greenInput, greenSlider);
        updateColorDisplay();
    });

    blueInput.addEventListener('input', () => {
        updateSliderFromInput(blueInput, blueSlider);
        updateColorDisplay();
    });

    // Event listeners for sliders
    redSlider.addEventListener('input', () => {
        updateInputFromSlider(redSlider, redInput);
        updateColorDisplay();
    });

    greenSlider.addEventListener('input', () => {
        updateInputFromSlider(greenSlider, greenInput);
        updateColorDisplay();
    });

    blueSlider.addEventListener('input', () => {
        updateInputFromSlider(blueSlider, blueInput);
        updateColorDisplay();
    });

    // Event listeners for buttons
    randomButton.addEventListener('click', generateRandomColor);
    resetButton.addEventListener('click', resetColor);

    // Event listeners for copy buttons
    copyButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetId = button.getAttribute('data-target');
            const targetElement = document.getElementById(targetId);
            copyToClipboard(targetElement.textContent);
            showTooltip(button, 'Copied!');
        });
    });

    // Direct click on hex or rgb displays for copying
    hexDisplay.addEventListener('click', function() {
        copyToClipboard(this.textContent);
        showTooltip(this, 'Copied!');
    });

    rgbDisplay.addEventListener('click', function() {
        copyToClipboard(this.textContent);
        showTooltip(this, 'Copied!');
    });

    // Initialize with default values
    updateColorDisplay();
}); 
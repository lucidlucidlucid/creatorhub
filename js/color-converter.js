// Color Converter JavaScript

document.addEventListener('DOMContentLoaded', () => {
    // Force apply Gogga font to all inputs
    document.querySelectorAll('input, select').forEach(el => {
        el.style.fontFamily = "'Gogga', sans-serif";
        el.style.textTransform = "uppercase";
    });

    const redInput = document.getElementById('gtag-r');
    const greenInput = document.getElementById('gtag-g');
    const blueInput = document.getElementById('gtag-b');
    const hexResult = document.getElementById('hex-result');
    const rgbResult = document.getElementById('rgb-result');
    const colorPreview = document.querySelector('.color-preview');

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

    // Function to convert and update the display
    function convertColor() {
        const r = validateInput(redInput);
        const g = validateInput(greenInput);
        const b = validateInput(blueInput);

        const standardR = gtagToRgb(r);
        const standardG = gtagToRgb(g);
        const standardB = gtagToRgb(b);

        const hexColor = rgbToHex(standardR, standardG, standardB);
        
        // Update results
        hexResult.value = hexColor;
        rgbResult.value = `rgb(${standardR}, ${standardG}, ${standardB})`;
        colorPreview.style.backgroundColor = hexColor;
    }

    // Auto-convert when inputs change
    redInput.addEventListener('input', convertColor);
    greenInput.addEventListener('input', convertColor);
    blueInput.addEventListener('input', convertColor);

    // Initialize with default values
    convertColor();

    // Add copy to clipboard functionality
    hexResult.addEventListener('click', function() {
        this.select();
        navigator.clipboard.writeText(this.value);
        showTooltip(this, 'Copied!');
    });

    rgbResult.addEventListener('click', function() {
        this.select();
        navigator.clipboard.writeText(this.value);
        showTooltip(this, 'Copied!');
    });

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
}); 
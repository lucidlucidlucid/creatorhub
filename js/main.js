// Main JavaScript file for shared functionality

document.addEventListener('DOMContentLoaded', () => {
    // Add smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth'
                });
            }
        });
    });

    // Update copyright year
    const currentYear = new Date().getFullYear();
    const footerYear = document.querySelector('footer p');
    if (footerYear) {
        footerYear.innerHTML = footerYear.innerHTML.replace('2023', currentYear);
    }

    // Force apply Gogga font to all inputs
    document.querySelectorAll('input, select').forEach(el => {
        el.style.fontFamily = "'Gogga', sans-serif";
        el.style.textTransform = "uppercase";
    });
    
    // Mobile detection and UI adjustments
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth < 768;
    
    if (isMobile) {
        document.body.classList.add('mobile-device');
        setupMobileNavigation();
    }
    
    function setupMobileNavigation() {
        // Create hamburger menu button
        const header = document.querySelector('header');
        const nav = document.querySelector('nav');
        const navLinks = document.querySelector('.nav-links');
        
        // Ensure all nav links are included in mobile menu (including Terms)
        const navItems = document.querySelectorAll('.nav-links li');
        navItems.forEach(item => {
            item.style.display = 'block'; // Make sure all items are visible
        });
        
        // Create hamburger button
        const hamburgerBtn = document.createElement('button');
        hamburgerBtn.className = 'hamburger-menu';
        hamburgerBtn.innerHTML = '<span></span><span></span><span></span>';
        nav.insertBefore(hamburgerBtn, navLinks);
        
        // Toggle menu on click
        hamburgerBtn.addEventListener('click', () => {
            navLinks.classList.toggle('active');
            hamburgerBtn.classList.toggle('active');
        });
        
        // Close menu when clicking elsewhere
        document.addEventListener('click', (e) => {
            if (!nav.contains(e.target)) {
                navLinks.classList.remove('active');
                hamburgerBtn.classList.remove('active');
            }
        });
        
        // Make the page adapt to mobile viewing
        adjustContentForMobile();
    }
    
    function adjustContentForMobile() {
        // Adjust card layouts, input sizing, and other mobile-specific tweaks
        const inputGroups = document.querySelectorAll('.input-group');
        inputGroups.forEach(group => {
            group.style.marginBottom = '20px';
        });
        
        // Adjust font sizes for better readability
        document.querySelectorAll('h1').forEach(el => {
            el.style.fontSize = '32px';
        });
        
        document.querySelectorAll('p').forEach(el => {
            el.style.fontSize = '16px';
        });
    }
}); 
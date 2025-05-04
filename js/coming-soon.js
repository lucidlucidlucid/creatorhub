// Coming Soon JavaScript

document.addEventListener('DOMContentLoaded', () => {
    const emailInput = document.getElementById('email-input');
    const subscribeBtn = document.getElementById('subscribe-btn');
    const subscriptionMessage = document.getElementById('subscription-message');
    
    // Subscribe button click handler
    subscribeBtn.addEventListener('click', () => {
        const email = emailInput.value.trim();
        
        // Basic email validation
        if (!isValidEmail(email)) {
            showMessage('Please enter a valid email address.', 'error');
            return;
        }
        
        // Simulate subscription (no actual backend)
        subscribeBtn.disabled = true;
        subscribeBtn.textContent = 'Subscribing...';
        
        // Simulate API call with timeout
        setTimeout(() => {
            showMessage('Thanks for subscribing! We\'ll notify you when new features arrive.', 'success');
            emailInput.value = '';
            subscribeBtn.disabled = false;
            subscribeBtn.textContent = 'Subscribe';
        }, 1500);
    });
    
    // Email validation
    function isValidEmail(email) {
        const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        return re.test(email);
    }
    
    // Show message helper
    function showMessage(text, type) {
        subscriptionMessage.textContent = text;
        subscriptionMessage.className = type === 'error' ? 'error-message' : 'success-message';
        
        // Clear message after 5 seconds
        setTimeout(() => {
            subscriptionMessage.textContent = '';
            subscriptionMessage.className = '';
        }, 5000);
    }
    
    // Add animation to feature cards on scroll
    const featureCards = document.querySelectorAll('.feature-card');
    
    // Create an intersection observer
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });
    
    // Set initial state and observe each card
    featureCards.forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(30px)';
        card.style.transition = `opacity 0.5s ease ${index * 0.1}s, transform 0.5s ease ${index * 0.1}s`;
        observer.observe(card);
    });
}); 
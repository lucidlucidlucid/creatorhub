// Firebase Config - Replace with your Firebase project config
// You'll need to replace these values with your actual Firebase project settings 
const firebaseConfig = {
    apiKey: "AIzaSyCyNon4Fj_0F080Y2A2z8OBJbmxYZ1b7tc",
    authDomain: "gtag-world.firebaseapp.com",
    projectId: "gtag-world",
    storageBucket: "gtag-world.firebasestorage.app",
    messagingSenderId: "992687667581",
    appId: "1:992687667581:web:61562117a1503da58c7414",
    measurementId: "G-L1HQ625V08"
  };

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();

// DOM elements
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const loginButton = document.getElementById('loginButton');
const loginError = document.getElementById('loginError');

// Check if user is already logged in, if so redirect to dashboard
auth.onAuthStateChanged(user => {
    if (user) {
        // User is signed in
        window.location.href = './dashboard.html';
    }
});

// Add login event
loginButton.addEventListener('click', (e) => {
    e.preventDefault();
    
    // Get email and password
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    
    // Validate inputs
    if (!email || !password) {
        showError('Please enter both email and password');
        return;
    }

    // Clear previous errors
    clearError();
    
    // Show loading state
    loginButton.disabled = true;
    loginButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Logging in...';
    
    // Sign in with Firebase
    auth.signInWithEmailAndPassword(email, password)
        .then((userCredential) => {
            // Signed in successfully
            // The redirect will happen automatically via onAuthStateChanged
        })
        .catch((error) => {
            // Firebase authentication error
            console.error("Authentication error:", error);
            
            // Show user-friendly error message
            let errorMessage;
            switch (error.code) {
                case 'auth/user-not-found':
                case 'auth/wrong-password':
                    errorMessage = 'Invalid email or password';
                    break;
                case 'auth/too-many-requests':
                    errorMessage = 'Too many failed login attempts. Please try again later.';
                    break;
                case 'auth/network-request-failed':
                    errorMessage = 'Network error. Please check your connection.';
                    break;
                default:
                    errorMessage = 'Failed to login. Please try again.';
            }
            
            showError(errorMessage);
        })
        .finally(() => {
            // Reset button state
            loginButton.disabled = false;
            loginButton.innerHTML = '<i class="fas fa-sign-in-alt"></i> Login';
        });
});

// Show error message
function showError(message) {
    loginError.textContent = message;
    loginError.style.display = 'block';
}

// Clear error message
function clearError() {
    loginError.textContent = '';
    loginError.style.display = 'none';
}

// Add enter key support
passwordInput.addEventListener('keyup', (e) => {
    if (e.key === 'Enter') {
        loginButton.click();
    }
}); 
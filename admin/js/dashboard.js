// Firebase Config - Replace with your Firebase project config
// Make sure this matches the same config in auth.js
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
const logoutButton = document.getElementById('logoutButton');
const userEmail = document.getElementById('userEmail');

// Authentication state observer
auth.onAuthStateChanged(user => {
    if (user) {
        // User is signed in
        console.log('User is authenticated:', user.email);
        userEmail.textContent = `Logged in as: ${user.email}`;
    } else {
        // User is signed out, redirect to login page
        console.log('No user authenticated, redirecting to login');
        window.location.href = './index.html';
    }
});

// Logout functionality
logoutButton.addEventListener('click', () => {
    // Show loading state
    logoutButton.disabled = true;
    logoutButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Logging out...';
    
    // Sign out the user
    auth.signOut()
        .then(() => {
            // Sign-out successful, redirect handled by onAuthStateChanged
            console.log('User signed out successfully');
        })
        .catch((error) => {
            // An error happened during sign out
            console.error('Error signing out:', error);
            alert('Error signing out. Please try again.');
            
            // Reset button state
            logoutButton.disabled = false;
            logoutButton.innerHTML = '<i class="fas fa-sign-out-alt"></i> Logout';
        });
}); 
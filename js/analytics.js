// Firebase Analytics Configuration
// This file sets up analytics for the entire site with anti-spam/refresh protection

// Firebase config - should match the one in admin pages
const firebaseConfig = {
    apiKey: "AIzaSyCyNon4Fj_0F080Y2A2z8OBJbmxYZ1b7tc",
    authDomain: "gtag-world.firebaseapp.com",
    projectId: "gtag-world",
    storageBucket: "gtag-world.firebasestorage.app",
    messagingSenderId: "992687667581",
    appId: "1:992687667581:web:61562117a1503da58c7414",
    measurementId: "G-L1HQ625V08"
};

// Initialize Firebase if not already initialized
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

// Initialize Analytics
const analytics = firebase.analytics();

// Anti-spam/refresh protection
(function() {
    // Use localStorage to track last visit timestamps and session durations
    const SESSION_TIMEOUT_MINUTES = 30; // Consider a new session after 30 minutes of inactivity
    const PAGE_REFRESH_THRESHOLD_SECONDS = 10; // Ignore refreshes within 10 seconds
    
    // Keys for localStorage
    const LAST_VISIT_KEY = 'last_visit_timestamp';
    const VISIT_COUNT_KEY = 'visit_count';
    const CURRENT_SESSION_KEY = 'current_session_id';
    const PAGE_VIEWS_KEY = 'page_views';
    
    // Get current page path (normalized)
    const currentPath = window.location.pathname.replace(/\/$/, '') || '/';
    
    // Get stored values
    const lastVisitTimestamp = parseInt(localStorage.getItem(LAST_VISIT_KEY) || '0');
    const currentSessionId = localStorage.getItem(CURRENT_SESSION_KEY) || generateSessionId();
    const pageViews = JSON.parse(localStorage.getItem(PAGE_VIEWS_KEY) || '{}');
    
    // Current timestamp
    const now = Date.now();
    
    // Check if this is a new session (30+ minutes since last activity)
    const isNewSession = (now - lastVisitTimestamp) > (SESSION_TIMEOUT_MINUTES * 60 * 1000);
    
    // Check if this appears to be a refresh/spam (same page within threshold)
    const lastPageViewTime = pageViews[currentPath] || 0;
    const isRefresh = (now - lastPageViewTime) < (PAGE_REFRESH_THRESHOLD_SECONDS * 1000);
    
    // Update session if needed
    if (isNewSession) {
        localStorage.setItem(CURRENT_SESSION_KEY, generateSessionId());
        
        // Increment visit count for non-refresh visits
        const visitCount = parseInt(localStorage.getItem(VISIT_COUNT_KEY) || '0');
        localStorage.setItem(VISIT_COUNT_KEY, (visitCount + 1).toString());
        
        // Log session start to Analytics
        analytics.logEvent('session_start', {
            session_id: currentSessionId,
            visit_count: visitCount + 1
        });
    }
    
    // Process the page view if it's not just a refresh
    if (!isRefresh) {
        // Update page views record with current timestamp
        pageViews[currentPath] = now;
        localStorage.setItem(PAGE_VIEWS_KEY, JSON.stringify(pageViews));
        
        // Log page view to Analytics with session info
        analytics.logEvent('page_view', {
            page_path: currentPath,
            page_title: document.title,
            session_id: currentSessionId
        });
    }
    
    // Always update last visit timestamp 
    localStorage.setItem(LAST_VISIT_KEY, now.toString());
    
    // Helper to generate a random session ID
    function generateSessionId() {
        return 'session_' + Math.random().toString(36).substring(2, 15) + 
               Math.random().toString(36).substring(2, 15);
    }
})();

// Export methods for dashboard use
window.siteAnalytics = {
    // Log a custom event
    logEvent: function(eventName, params) {
        analytics.logEvent(eventName, params);
    },
    
    // Set user properties (for authenticated users)
    setUserProperties: function(properties) {
        analytics.setUserProperties(properties);
    },
    
    // Set current screen (for spa applications)
    setCurrentScreen: function(screenName) {
        analytics.setCurrentScreen(screenName);
    }
}; 
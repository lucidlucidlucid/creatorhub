/**
 * Admin Analytics Dashboard - Lucid's GTAG Hub
 * This file handles fetching analytics data from Firebase and displaying it
 */

// Ensure Firebase is initialized and auth is present
const analytics = firebase.analytics();

// DOM Elements
const dateRangeSelector = document.getElementById('dateRange');
const refreshButton = document.getElementById('refreshAnalytics');
const totalVisitorsEl = document.getElementById('totalVisitors');
const totalPageViewsEl = document.getElementById('totalPageViews');
const avgSessionDurationEl = document.getElementById('avgSessionDuration');
const visitorsTrendEl = document.getElementById('visitorsTrend');
const pageViewsTrendEl = document.getElementById('pageViewsTrend');
const activeUsersEl = document.getElementById('activeUsers');
const realtimeLogEl = document.getElementById('realtimeLog');
const visitorsChartEl = document.getElementById('visitorsChart');
const pagesChartEl = document.getElementById('pagesChart');

// Chart objects
let visitorsChart = null;
let pagesChart = null;

// Helper function to get date string for x days ago
function getDateString(daysAgo) {
    const date = new Date();
    date.setDate(date.getDate() + daysAgo);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// Initialize charts when document is ready - with initialization protection
let initialized = false;
document.addEventListener('DOMContentLoaded', () => {
    if (initialized) return;
    initialized = true;
    
    // Initialize charts
    initCharts();
    
    // Setup event listeners
    setupEventListeners();
    
    // Initialize realtime data
    initializeRealtimeData();
});

// Setup event listeners
function setupEventListeners() {
    // Date range change event
    dateRangeSelector.addEventListener('change', () => {
        loadAnalyticsData();
    });
    
    // Refresh button click event
    refreshButton.addEventListener('click', () => {
        refreshButton.classList.add('loading');
        refreshButton.innerHTML = '<i class="fas fa-spinner"></i> Refreshing...';
        
        // Start data refresh
        loadAnalyticsData().then(() => {
            refreshButton.classList.remove('loading');
            refreshButton.innerHTML = '<i class="fas fa-sync-alt"></i> Refresh Data';
        }).catch(error => {
            console.error("Error refreshing data:", error);
            refreshButton.classList.remove('loading');
            refreshButton.innerHTML = '<i class="fas fa-sync-alt"></i> Refresh Data';
        });
    });
    
    // Handle window resize to prevent chart stretching
    let resizeTimer;
    window.addEventListener('resize', () => {
        // Debounce resize events
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
            if (visitorsChart && pagesChart) {
                visitorsChart.update();
                pagesChart.update();
            }
        }, 250);
    });
}

// Initialize charts with empty data
function initCharts() {
    // Visitors chart
    const visitorsCtx = visitorsChartEl.getContext('2d');
    visitorsChart = new Chart(visitorsCtx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Visitors',
                data: [],
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 2,
                pointBackgroundColor: 'rgba(75, 192, 192, 1)',
                pointBorderColor: '#fff',
                pointHoverBackgroundColor: '#fff',
                pointHoverBorderColor: 'rgba(75, 192, 192, 1)',
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(200, 200, 200, 0.1)'
                    }
                },
                x: {
                    grid: {
                        display: false
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.7)',
                    titleFont: {
                        size: 14
                    },
                    bodyFont: {
                        size: 14
                    }
                }
            }
        }
    });
    
    // Pages chart
    const pagesCtx = pagesChartEl.getContext('2d');
    pagesChart = new Chart(pagesCtx, {
        type: 'bar',
        data: {
            labels: [],
            datasets: [{
                label: 'Page Views',
                data: [],
                backgroundColor: 'rgba(153, 102, 255, 0.5)',
                borderColor: 'rgba(153, 102, 255, 1)',
                borderWidth: 1
            }]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(200, 200, 200, 0.1)'
                    }
                },
                y: {
                    grid: {
                        display: false
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.7)',
                    titleFont: {
                        size: 14
                    },
                    bodyFont: {
                        size: 14
                    }
                }
            }
        }
    });
    
    // Initial data load
    loadAnalyticsData();
}

// Initialize realtime data monitoring
function initializeRealtimeData() {
    // For a real implementation, you would use Firebase Realtime Database or Firestore
    // to listen for active users. For now, we'll simulate realtime data.
    
    // Subscribe to user_engagement events
    firebase.database().ref('analytics/active_users').on('value', (snapshot) => {
        const activeUsers = snapshot.val() || 0;
        activeUsersEl.textContent = activeUsers;
    });
    
    // Listen for new analytics events
    firebase.database().ref('analytics/events').limitToLast(10).on('child_added', (snapshot) => {
        const event = snapshot.val();
        if (event) {
            addRealtimeLogEntry(event);
        }
    });
}

// Add a log entry to the realtime log
function addRealtimeLogEntry(event) {
    // Clear "waiting" message if present
    if (realtimeLogEl.querySelector('.log-message')) {
        realtimeLogEl.innerHTML = '';
    }
    
    // Create log entry
    const logEntry = document.createElement('div');
    logEntry.className = 'log-entry';
    
    const timestamp = new Date(event.timestamp || Date.now()).toLocaleTimeString();
    
    logEntry.innerHTML = `
        <span class="timestamp">${timestamp}</span>
        <span class="event-type">${event.type || 'page_view'}</span>
        <span class="event-details">${event.details || ''}</span>
    `;
    
    // Add to log and scroll to bottom
    realtimeLogEl.prepend(logEntry);
    
    // Keep only the last 20 entries
    const entries = realtimeLogEl.querySelectorAll('.log-entry');
    if (entries.length > 20) {
        for (let i = 20; i < entries.length; i++) {
            entries[i].remove();
        }
    }
}

// Update trend indicator with percentage and direction
function updateTrendIndicator(element, percentage) {
    const icon = element.querySelector('i');
    const value = element.querySelector('span');
    
    if (percentage > 0) {
        icon.className = 'fas fa-arrow-up';
        element.className = 'trend-indicator positive';
    } else if (percentage < 0) {
        icon.className = 'fas fa-arrow-down';
        element.className = 'trend-indicator negative';
    } else {
        icon.className = 'fas fa-equals';
        element.className = 'trend-indicator neutral';
    }
    
    value.textContent = `${Math.abs(percentage)}%`;
}

// Update visitors chart with new data
function updateVisitorsChart(data) {
    visitorsChart.data.labels = data.map(item => item.date);
    visitorsChart.data.datasets[0].data = data.map(item => item.count);
    visitorsChart.update();
}

// Update pages chart with new data
function updatePagesChart(data) {
    pagesChart.data.labels = data.map(item => item.page);
    pagesChart.data.datasets[0].data = data.map(item => item.count);
    pagesChart.update();
}

// Load analytics data based on selected time range
async function loadAnalyticsData() {
    const range = dateRangeSelector.value;
    
    try {
        // In a real implementation, you would fetch this data from Firebase Analytics API
        // using a server-side function (Cloud Function or backend API)
        // Since Firebase Analytics doesn't provide direct client access to analytics data,
        // you would need to implement a server-side component
        
        // For demonstration, we'll show "Loading..." and then simulate data after a delay
        totalVisitorsEl.textContent = "Loading...";
        totalPageViewsEl.textContent = "Loading...";
        avgSessionDurationEl.textContent = "Loading...";
        
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Fetch users count based on range
        let visitors, pageViews, avgSessionDuration;
        let visitorsData = [];
        let pagesData = [];
        
        if (range === 'week') {
            // Fetch last 7 days data
            const analytics = await fetchAnalyticsData('week');
            visitors = analytics.userCount || 187;
            pageViews = analytics.pageViewCount || 432;
            avgSessionDuration = analytics.avgSessionDuration || "2m 37s";
            visitorsData = analytics.visitorsOverTime || generateDummyVisitorsData(7);
            pagesData = analytics.popularPages || generateDummyPagesData();
        } else if (range === 'month') {
            // Fetch last 30 days data
            const analytics = await fetchAnalyticsData('month');
            visitors = analytics.userCount || 748;
            pageViews = analytics.pageViewCount || 1872;
            avgSessionDuration = analytics.avgSessionDuration || "3m 14s";
            visitorsData = analytics.visitorsOverTime || generateDummyVisitorsData(30, true);
            pagesData = analytics.popularPages || generateDummyPagesData();
        } else if (range === 'year') {
            // Fetch last 365 days data
            const analytics = await fetchAnalyticsData('year');
            visitors = analytics.userCount || 8965;
            pageViews = analytics.pageViewCount || 24820;
            avgSessionDuration = analytics.avgSessionDuration || "3m 42s";
            visitorsData = analytics.visitorsOverTime || generateDummyVisitorsData(12, false, true);
            pagesData = analytics.popularPages || generateDummyPagesData();
        }
        
        // Update UI with analytics data
        totalVisitorsEl.textContent = visitors.toLocaleString();
        totalPageViewsEl.textContent = pageViews.toLocaleString();
        avgSessionDurationEl.textContent = avgSessionDuration;
        
        // Calculate trends (percentage change) by comparing to previous period
        // In a real implementation, you would compare to the previous equivalent period
        const visitorsTrendValue = Math.floor(Math.random() * 40) - 20; // -20% to +20%
        const pageViewsTrendValue = Math.floor(Math.random() * 40) - 20; // -20% to +20%
        
        // Update trend indicators
        updateTrendIndicator(visitorsTrendEl, visitorsTrendValue);
        updateTrendIndicator(pageViewsTrendEl, pageViewsTrendValue);
        
        // Update charts
        updateVisitorsChart(visitorsData);
        updatePagesChart(pagesData);
        
        // Log this event for tracking admin activity
        analytics.logEvent('admin_viewed_analytics', {
            date_range: range
        });
    } catch (error) {
        console.error("Error loading analytics data:", error);
        
        // Show error state
        totalVisitorsEl.textContent = "Error";
        totalPageViewsEl.textContent = "Error";
        avgSessionDurationEl.textContent = "Error";
    }
}

// Function to fetch analytics data from server
// In a real implementation, this would call your backend API or Firebase Function
async function fetchAnalyticsData(timeRange) {
    // This is where you would implement a real API call to your backend
    // The backend would use Firebase Analytics API or BigQuery to fetch the data
    
    // For now, we'll return empty data that will trigger our fallback dummy data generation
    return {};
}

// Helper function to generate dummy visitors data when the API isn't available
function generateDummyVisitorsData(days, isMonth = false, isYear = false) {
    if (isYear) {
        // Generate monthly data for a year
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return months.map((month, index) => {
            return {
                date: month,
                count: Math.floor(Math.random() * 1000) + 1000 + (index * 200)
            };
        });
    } else if (isMonth) {
        // Generate data for a month, but group into weeks for clarity
        const result = [];
        for (let i = 0; i < 4; i++) {
            const weekLabel = `Week ${i+1}`;
            result.push({
                date: weekLabel,
                count: Math.floor(Math.random() * 100) + 150 + (i * 50)
            });
        }
        return result;
    } else {
        // Generate daily data
        const result = [];
        for (let i = 0; i < days; i++) {
            result.push({
                date: getDateString(-(days - 1) + i),
                count: Math.floor(Math.random() * 40) + 20 + (i * 5)
            });
        }
        return result;
    }
}

// Helper function to generate dummy pages data
function generateDummyPagesData() {
    const pages = ['/', '/assets/', '/color-converter/', '/sound-browser/', '/useful-links/'];
    return pages.map(page => {
        return {
            page: page,
            count: Math.floor(Math.random() * 100) + 50
        };
    });
} 
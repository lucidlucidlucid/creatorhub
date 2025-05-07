// Sound Browser JavaScript

document.addEventListener('DOMContentLoaded', () => {
    // Force apply Gogga font to all inputs
    document.querySelectorAll('input, select').forEach(el => {
        el.style.fontFamily = "'Gogga', sans-serif";
        el.style.textTransform = "uppercase";
    });

    // DOM elements
    const loadingIndicator = document.getElementById('loading-indicator');
    const soundList = document.getElementById('sound-list');
    const searchFilter = document.getElementById('search-filter');
    const sortFilter = document.getElementById('sort-filter');
    const selectedSoundPlayer = document.getElementById('selected-sound-player');
    const currentSoundName = document.getElementById('current-sound-name');
    const playPauseBtn = document.getElementById('play-pause-btn');
    const downloadBtn = document.getElementById('download-btn');
    const currentTimeEl = document.getElementById('current-time');
    const durationEl = document.getElementById('duration');

    // Current sound data
    let currentSound = null;
    let sounds = [];
    let currentPlayingItem = null;
    let wavesurfers = {}; // Store wavesurfer instances for each sound
    let isInitialized = false; // Track initialization state
    
    // Hardcoded repository URL - this is the correct API URL format
    const apiUrl = 'https://api.github.com/repos/lucidlucidlucid/creatorhub/contents/lucidsgtaghub';
    
    // Show loading indicator immediately
    loadingIndicator.style.display = 'flex';
    
    // Initialize only once
    if (!isInitialized) {
        fetchSounds();
        isInitialized = true;
    }

    // Add download counter
    let downloadCount = 0;
    let lastDownloadTime = 0;
    const DOWNLOAD_RESET_TIME = 3600000; // 1 hour in milliseconds
    let targetDownloadCount = Math.floor(Math.random() * 3) + 3; // Random number between 3-5
    
    // Create Patreon popup element
    const patreonPopup = document.createElement('div');
    patreonPopup.className = 'patreon-popup';
    patreonPopup.innerHTML = `
        <div class="patreon-popup-content">
            <div class="patreon-popup-header">
                <i class="fab fa-patreon"></i>
                <h3>Enjoying CreatorHub?</h3>
            </div>
            <p>Consider supporting us on Patreon to help us create more amazing content!</p>
            <div class="patreon-popup-actions">
                <a href="https://www.patreon.com/creatorhub" target="_blank" class="patreon-button">
                    <i class="fab fa-patreon"></i> Support Us
                </a>
                <button class="patreon-close">Maybe Later</button>
            </div>
        </div>
    `;
    document.body.appendChild(patreonPopup);

    // Function to show Patreon popup
    function showPatreonPopup() {
        patreonPopup.classList.add('active');
        // Auto-hide after 10 seconds
        setTimeout(() => {
            patreonPopup.classList.remove('active');
        }, 10000);
        
        // Reset counter and set new random target
        downloadCount = 0;
        targetDownloadCount = Math.floor(Math.random() * 3) + 3;
    }

    // Close popup when clicking close button
    patreonPopup.querySelector('.patreon-close').addEventListener('click', () => {
        patreonPopup.classList.remove('active');
    });

    // Close popup when clicking outside
    patreonPopup.addEventListener('click', (e) => {
        if (e.target === patreonPopup) {
            patreonPopup.classList.remove('active');
        }
    });

    function fetchSounds() {
        // Check cache first
        const cachedData = localStorage.getItem('soundListCache');
        const cacheTime = localStorage.getItem('soundListCacheTime');
        const now = Date.now();
        
        // Use cache if it exists and is less than 4 hours old
        if (cachedData && cacheTime && (now - parseInt(cacheTime)) < 14400000) {
            const sounds = JSON.parse(cachedData);
            displaySounds(sounds);
            loadingIndicator.style.display = 'none';
            return;
        }

        // If no cache or cache expired, fetch from GitHub
        fetch(apiUrl)
            .then(response => {
                if (!response.ok) {
                    // Handle different HTTP error codes
                    if (response.status === 403) {
                        throw new Error('RATE_LIMIT');
                    } else if (response.status === 404) {
                        throw new Error('NOT_FOUND');
                    } else if (response.status >= 500) {
                        throw new Error('SERVER_ERROR');
                    } else {
                        throw new Error('MAINTENANCE');
                    }
                }
                return response.json();
            })
            .then(data => {
                // Filter for audio files only
                sounds = data.filter(file => {
                    const extension = file.name.split('.').pop().toLowerCase();
                    return ['mp3', 'wav', 'ogg', 'aac', 'm4a'].includes(extension);
                }).map(file => ({
                    name: file.name,
                    path: file.download_url,
                    date: new Date().toISOString(),
                    size: file.size || 0,
                    isPlaying: false,
                    isLoaded: false
                }));
                
                // Cache the results
                localStorage.setItem('soundListCache', JSON.stringify(sounds));
                localStorage.setItem('soundListCacheTime', now.toString());
                
                if (sounds.length === 0) {
                    soundList.innerHTML = '<div class="no-results">No sound files found in the repository.</div>';
                } else {
                    displaySounds(sounds);
                }
                loadingIndicator.style.display = 'none';
            })
            .catch(error => {
                console.error('Error fetching sounds:', error);
                
                // Try to use cache even if expired when fetch fails
                if (cachedData) {
                    const sounds = JSON.parse(cachedData);
                    displaySounds(sounds);
                    loadingIndicator.style.display = 'none';
                    return;
                }
                
                // Show appropriate error message based on error type
                let errorMessage = '';
                switch(error.message) {
                    case 'RATE_LIMIT':
                        errorMessage = `
                            <div class="error-message rate-limit">
                                <div class="error-content">
                                    <h3>Rate Limit Reached</h3>
                                    <p>We've temporarily reached our API limit. This is a limitation of using GitHub's free API service.</p>
                                    <p>To help us provide a better experience and remove these limitations, consider supporting us:</p>
                                    <div class="patreon-support">
                                        <a href="https://www.patreon.com/creatorhub" target="_blank" class="patreon-button">
                                            <i class="fab fa-patreon"></i>
                                            <span>Support on Patreon</span>
                                        </a>
                                    </div>
                                    <p class="error-note">The limit will reset automatically in a few minutes.</p>
                                </div>
                            </div>`;
                        break;
                    case 'SERVER_ERROR':
                        errorMessage = `
                            <div class="error-message server-error">
                                <div class="error-content">
                                    <h3>Server Error</h3>
                                    <p>We're experiencing some technical difficulties with GitHub's servers.</p>
                                    <p>To help us implement a more reliable solution, consider supporting us:</p>
                                    <div class="patreon-support">
                                        <a href="https://www.patreon.com/creatorhub" target="_blank" class="patreon-button">
                                            <i class="fab fa-patreon"></i>
                                            <span>Support on Patreon</span>
                                        </a>
                                    </div>
                                    <p class="error-note">We'll keep trying to reconnect automatically.</p>
                                </div>
                            </div>`;
                        break;
                    case 'NOT_FOUND':
                        errorMessage = `
                            <div class="error-message not-found">
                                <div class="error-content">
                                    <h3>Repository Not Found</h3>
                                    <p>The sound repository could not be found at this time.</p>
                                    <p>To help us maintain and improve the service, consider supporting us:</p>
                                    <div class="patreon-support">
                                        <a href="https://www.patreon.com/creatorhub" target="_blank" class="patreon-button">
                                            <i class="fab fa-patreon"></i>
                                            <span>Support on Patreon</span>
                                        </a>
                                    </div>
                                    <p class="error-note">Please check back later or contact support.</p>
                                </div>
                            </div>`;
                        break;
                    default:
                        errorMessage = `
                            <div class="error-message maintenance">
                                <div class="error-content">
                                    <h3>Website Under Maintenance</h3>
                                    <p>We're currently performing some updates to improve your experience.</p>
                                    <p>To help us continue improving CreatorHub, consider supporting us:</p>
                                    <div class="patreon-support">
                                        <a href="https://www.patreon.com/creatorhub" target="_blank" class="patreon-button">
                                            <i class="fab fa-patreon"></i>
                                            <span>Support on Patreon</span>
                                        </a>
                                    </div>
                                    <p class="error-note">Please try again in a few minutes.</p>
                                </div>
                            </div>`;
                }
                
                // Show error message
                soundList.insertAdjacentHTML('beforebegin', errorMessage);
                
                // Show empty state instead of demo data
                soundList.innerHTML = `
                    <div class="no-results">
                        <div class="error-content">
                            <p>Unable to load sounds at this time.</p>
                            <div class="patreon-support">
                                <a href="https://www.patreon.com/creatorhub" target="_blank" class="patreon-button">
                                    <i class="fab fa-patreon"></i>
                                    <span>Support on Patreon</span>
                                </a>
                            </div>
                            <p class="error-note">Please try again later or check our Patreon for updates.</p>
                        </div>
                    </div>`;
                
                loadingIndicator.style.display = 'none';
            });
    }

    function displaySounds(soundsToDisplay) {
        soundList.innerHTML = '';
        
        if (soundsToDisplay.length === 0) {
            soundList.innerHTML = '<div class="no-results">No sounds match your search.</div>';
            return;
        }
        
        // Create intersection observer for lazy loading
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const index = entry.target.dataset.index;
                    if (!sounds[index].isLoaded) {
                        createWavesurfer(sounds[index], index);
                        sounds[index].isLoaded = true;
                    }
                }
            });
        }, {
            root: null,
            rootMargin: '50px',
            threshold: 0.1
        });
        
        soundsToDisplay.forEach((sound, index) => {
            const soundItem = document.createElement('div');
            soundItem.className = 'sound-item';
            soundItem.dataset.index = index;
            
            // Format file size
            const sizeInMB = (sound.size / (1024 * 1024)).toFixed(2);
            const sizeText = sizeInMB < 0.01 ? `${(sound.size / 1024).toFixed(2)} KB` : `${sizeInMB} MB`;
            
            // Format date
            const date = new Date(sound.date);
            const dateText = date.toLocaleDateString();
            
            // Create the sound item HTML
            soundItem.innerHTML = `
                <div class="sound-header">
                    <div class="sound-icon">
                        <svg viewBox="0 0 24 24" width="24" height="24">
                            <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" fill="currentColor"/>
                        </svg>
                    </div>
                    <div class="sound-info">
                        <div class="name">${sound.name}</div>
                        <div class="meta">${dateText} · ${sizeText}</div>
                    </div>
                    <div class="sound-actions">
                        <button class="sound-btn play-btn" data-index="${index}">
                            <i class="fas fa-play"></i>
                        </button>
                        <button class="sound-btn download-btn" data-index="${index}">
                            <i class="fas fa-download"></i>
                        </button>
                    </div>
                </div>
                <div class="waveform-container">
                    <div class="waveform" id="waveform-${index}"></div>
                    <div class="waveform-controls">
                        <div class="time-display">
                            <span class="current-time">0:00</span> / <span class="duration">0:00</span>
                        </div>
                    </div>
                </div>
            `;
            
            soundList.appendChild(soundItem);
            observer.observe(soundItem);
            
            // Add event listeners after the element is added to the DOM
            const playBtn = soundItem.querySelector('.play-btn');
            playBtn.addEventListener('click', () => {
                togglePlaySound(sound, index);
            });
            
            const downloadBtn = soundItem.querySelector('.download-btn');
            downloadBtn.addEventListener('click', () => {
                downloadSound(sound);
            });
        });
    }
    
    function createWavesurfer(sound, index) {
        // Clean up existing wavesurfer if it exists
        if (wavesurfers[index]) {
            wavesurfers[index].destroy();
        }
        
        // Create wavesurfer instance for this sound
        const wavesurfer = WaveSurfer.create({
            container: `#waveform-${index}`,
            waveColor: '#86868b',
            progressColor: '#0071e3',
            cursorColor: 'transparent',
            barWidth: 2,
            barRadius: 1,
            barGap: 1,
            height: 50,
            responsive: true,
            backend: 'MediaElement', // Use MediaElement backend for better mobile support
            mediaType: 'audio',
            normalize: true,
            partialRender: true // Enable partial rendering for better performance
        });
        
        // Store the wavesurfer instance
        wavesurfers[index] = wavesurfer;
        
        // Load the sound
        wavesurfer.load(sound.path);
        
        // Set up events
        wavesurfer.on('ready', function() {
            const duration = formatTime(wavesurfer.getDuration());
            const durationEl = document.querySelector(`#waveform-${index}`).parentNode.querySelector('.duration');
            if (durationEl) {
                durationEl.textContent = duration;
            }
        });
        
        wavesurfer.on('audioprocess', function() {
            const currentTime = formatTime(wavesurfer.getCurrentTime());
            const currentTimeEl = document.querySelector(`#waveform-${index}`).parentNode.querySelector('.current-time');
            if (currentTimeEl) {
                currentTimeEl.textContent = currentTime;
            }
        });
        
        wavesurfer.on('finish', function() {
            // Reset play button
            const playBtn = document.querySelector(`.play-btn[data-index="${index}"]`);
            if (playBtn) {
                playBtn.innerHTML = '<i class="fas fa-play"></i>';
                sound.isPlaying = false;
            }
        });
        
        wavesurfer.on('error', function() {
            console.error(`Error loading sound: ${sound.name}`);
        });
    }
    
    function togglePlaySound(sound, index) {
        const playBtn = document.querySelector(`.play-btn[data-index="${index}"]`);
        const wavesurfer = wavesurfers[index];
        
        if (!wavesurfer) return;
        
        // Pause any other playing sounds
        sounds.forEach((s, i) => {
            if (i !== index && s.isPlaying) {
                wavesurfers[i].pause();
                const otherPlayBtn = document.querySelector(`.play-btn[data-index="${i}"]`);
                if (otherPlayBtn) {
                    otherPlayBtn.innerHTML = '<i class="fas fa-play"></i>';
                }
                s.isPlaying = false;
            }
        });
        
        // Toggle play/pause for this sound
        if (sound.isPlaying) {
            wavesurfer.pause();
            playBtn.innerHTML = '<i class="fas fa-play"></i>';
            sound.isPlaying = false;
        } else {
            wavesurfer.play();
            playBtn.innerHTML = '<i class="fas fa-pause"></i>';
            sound.isPlaying = true;
            
            // Add keyboard event listener for spacebar to pause/play
            const handleKeyDown = function(e) {
                if (e.code === 'Space' && sound.isPlaying) {
                    e.preventDefault();
                    wavesurfer.pause();
                    playBtn.innerHTML = '<i class="fas fa-play"></i>';
                    sound.isPlaying = false;
                    document.removeEventListener('keydown', handleKeyDown);
                }
            };
            
            document.addEventListener('keydown', handleKeyDown);
            
            // Also handle when clicking anywhere on the document
            const handleDocumentClick = function(e) {
                // Only handle if we didn't click on play button or waveform
                if (!e.target.closest('.play-btn') && !e.target.closest('.waveform') && sound.isPlaying) {
                    wavesurfer.pause();
                    playBtn.innerHTML = '<i class="fas fa-play"></i>';
                    sound.isPlaying = false;
                    document.removeEventListener('click', handleDocumentClick, true);
                }
            };
            
            // Use capture phase to ensure we get the click event before other handlers
            document.addEventListener('click', handleDocumentClick, true);
        }
    }
    
    function downloadSound(sound) {
        const currentTime = Date.now();
        
        // Reset counter if more than an hour has passed
        if (currentTime - lastDownloadTime > DOWNLOAD_RESET_TIME) {
            downloadCount = 0;
            targetDownloadCount = Math.floor(Math.random() * 3) + 3;
        }
        
        downloadCount++;
        lastDownloadTime = currentTime;
        
        // Show Patreon popup when reaching the random target
        if (downloadCount === targetDownloadCount) {
            showPatreonPopup();
        }

        // Create a temporary link element
        const a = document.createElement('a');
        a.href = sound.path;
        a.download = sound.name; // This forces download instead of opening in browser
        a.style.display = 'none';
        document.body.appendChild(a);
        
        // Trigger the download
        a.click();
        
        // Clean up
        setTimeout(() => {
            document.body.removeChild(a);
        }, 100);
    }

    // Search and filtering
    searchFilter.addEventListener('input', filterSounds);
    sortFilter.addEventListener('change', filterSounds);

    function filterSounds() {
        const searchTerm = searchFilter.value.toLowerCase();
        const sortOption = sortFilter.value;
        
        let filteredSounds = sounds.filter(sound => 
            sound.name.toLowerCase().includes(searchTerm)
        );
        
        // Apply sorting
        switch (sortOption) {
            case 'name-asc':
                filteredSounds.sort((a, b) => a.name.localeCompare(b.name));
                break;
            case 'name-desc':
                filteredSounds.sort((a, b) => b.name.localeCompare(a.name));
                break;
            case 'date-new':
                filteredSounds.sort((a, b) => new Date(b.date) - new Date(a.date));
                break;
            case 'date-old':
                filteredSounds.sort((a, b) => new Date(a.date) - new Date(b.date));
                break;
        }
        
        // Clear existing wavesurfers before updating display
        Object.values(wavesurfers).forEach(ws => {
            ws.destroy();
        });
        wavesurfers = {};
        
        displaySounds(filteredSounds);
    }
    
    function formatTime(seconds) {
        if (isNaN(seconds)) return '0:00';
        const minutes = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
    }
}); 
// Assets Browser JavaScript

document.addEventListener('DOMContentLoaded', () => {
    // Force apply Gogga font to all inputs
    document.querySelectorAll('input, select').forEach(el => {
        el.style.fontFamily = "'Gogga', sans-serif";
        el.style.textTransform = "uppercase";
    });

    // DOM elements
    const loadingIndicator = document.getElementById('loading-indicator');
    const assetsGrid = document.getElementById('assets-grid');
    const searchFilter = document.getElementById('search-filter');
    const sortFilter = document.getElementById('sort-filter');
    const categoryTabsContainer = document.querySelector('.asset-categories');

    // Current active category
    let activeCategory = 'all';

    // Assets data
    let assets = [];
    let categories = ['all']; // Start with 'all' category
    
    // Hardcoded repository URL - using the correct path for the main branch
    const apiUrl = 'https://api.github.com/repos/lucidlucidlucid/creatorhub/contents/assetsstuff?ref=main';
    
    // File type definitions
    const imageExtensions = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'];
    const videoExtensions = ['mp4', 'webm', 'mov', 'avi', 'mkv'];
    const modelExtensions = ['glb', 'gltf', 'obj', 'fbx', 'stl'];
    const zipExtensions = ['zip', 'rar', '7z'];

    // Video proxy settings - enables playing GitHub videos via a proxy service
    // Set this to true to use a CORS proxy for videos (needed for GitHub hosted files)
    const useProxyForVideos = true;
    // This proxy service allows cross-origin requests
    const proxyUrl = 'https://corsproxy.io/?';
    
    // Show loading indicator immediately
    loadingIndicator.style.display = 'flex';
    
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

    // Fetch assets from the repository
    fetchFolders();

    function setupCategoryTabs() {
        // Clear existing tabs
        categoryTabsContainer.innerHTML = '';
        
        // Create "All" category tab
        const allTab = document.createElement('button');
        allTab.className = 'category-tab active';
        allTab.dataset.category = 'all';
        allTab.textContent = 'All Assets';
        categoryTabsContainer.appendChild(allTab);
        
        // Create tabs for each category
        categories.forEach(category => {
            if (category === 'all') return; // Skip 'all', we already added it
            
            const tab = document.createElement('button');
            tab.className = 'category-tab';
            tab.dataset.category = category;
            tab.textContent = formatCategoryName(category);
            categoryTabsContainer.appendChild(tab);
        });
        
        // Set up category tab click events
        document.querySelectorAll('.category-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                // Remove active class from all tabs
                document.querySelectorAll('.category-tab').forEach(t => t.classList.remove('active'));
                
                // Add active class to clicked tab
                tab.classList.add('active');
                
                // Get category from data attribute
                activeCategory = tab.dataset.category;
                
                // Filter and display assets
                filterAssets();
            });
        });
    }
    
    // Format category name (folder name) for display
    function formatCategoryName(name) {
        // Convert folder name to title case with spaces
        return name.split('-').map(word => 
            word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
        ).join(' ');
    }

    function fetchFolders() {
        // Check cache first
        const cachedData = localStorage.getItem('assetsListCache');
        const cacheTime = localStorage.getItem('assetsListCacheTime');
        const now = Date.now();
        
        // Use cache if it exists and is less than 4 hours old
        if (cachedData && cacheTime && (now - parseInt(cacheTime)) < 14400000) {
            const data = JSON.parse(cachedData);
            processFiles(data, 'root');
            setupCategoryTabs();
            displayAssets(assets);
            loadingIndicator.style.display = 'none';
            return;
        }

        // If no cache or cache expired, fetch from GitHub
        fetch(apiUrl, {
            headers: {
                'Accept': 'application/vnd.github.v3+json'
            }
        })
            .then(response => {
                if (!response.ok) {
                    console.error('GitHub API Error:', response.status, response.statusText);
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
                // Cache the results
                localStorage.setItem('assetsListCache', JSON.stringify(data));
                localStorage.setItem('assetsListCacheTime', now.toString());
                
                // Separate folders and files
                const folders = data.filter(item => item.type === 'dir');
                const rootFiles = data.filter(item => item.type === 'file');
                
                // Process root-level files
                processFiles(rootFiles, 'root');
                
                // If no folders found, just display the root files
                if (folders.length === 0) {
                    setupCategoryTabs();
                    displayAssets(assets);
                    loadingIndicator.style.display = 'none';
                    return;
                }
                
                // Add folder names to categories
                categories = ['all', ...folders.map(folder => folder.name)];
                
                // Create a promise for each folder to fetch its contents
                const folderPromises = folders.map(folder => 
                    fetch(folder.url)
                        .then(response => {
                            if (!response.ok) {
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
                        .then(folderData => {
                            // Process files in this folder
                            processFiles(folderData, folder.name);
                        })
                        .catch(error => {
                            console.error(`Error fetching contents of folder ${folder.name}:`, error);
                            throw error; // Re-throw to be caught by the main catch block
                        })
                );
                
                // When all folder contents are fetched
                Promise.all(folderPromises)
                    .then(() => {
                        // Set up category tabs based on folders
                        setupCategoryTabs();
                        
                        // Display assets
                        displayAssets(assets);
                        
                        // Hide loading indicator
                        loadingIndicator.style.display = 'none';
                    })
                    .catch(error => {
                        console.error('Error processing folders:', error);
                loadingIndicator.style.display = 'none';
                        throw error; // Re-throw to be caught by the main catch block
                    });
            })
            .catch(error => {
                console.error('Error fetching repository contents:', error);
                
                // Try to use cache even if expired when fetch fails
                if (cachedData) {
                    const data = JSON.parse(cachedData);
                    processFiles(data, 'root');
                setupCategoryTabs();
                    displayAssets(assets);
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
                                    <p>The assets repository could not be found at this time.</p>
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
                assetsGrid.insertAdjacentHTML('beforebegin', errorMessage);
                
                // Show empty state instead of demo data
                assetsGrid.innerHTML = `
                    <div class="no-results">
                        <div class="error-content">
                            <p>Unable to load assets at this time.</p>
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
    
    function processFiles(files, category) {
        // Filter for supported file types
        const supportedFiles = files.filter(file => {
            const extension = file.name.split('.').pop().toLowerCase();
            return [...imageExtensions, ...videoExtensions, ...modelExtensions, ...zipExtensions].includes(extension);
        });
        
        // Process each file
        supportedFiles.forEach(file => {
            const extension = file.name.split('.').pop().toLowerCase();
            let type = 'other';
            
            if (imageExtensions.includes(extension)) {
                type = 'image';
            } else if (videoExtensions.includes(extension)) {
                type = 'video';
            } else if (modelExtensions.includes(extension)) {
                type = 'model';
            } else if (zipExtensions.includes(extension)) {
                type = 'zip';
            }
            
            // Add to assets array
            assets.push({
                name: file.name,
                path: file.download_url,
                proxyPath: useProxyForVideos && type === 'video' ? proxyUrl + encodeURIComponent(file.download_url) : file.download_url,
                date: new Date().toISOString(), // GitHub API doesn't provide date in contents API
                size: file.size || 0,
                type: type,
                category: category
            });
        });
    }
    
    function useDemoData() {
        // Demo categories based on folders
        categories = ['all', 'characters', 'props', 'textures', 'environments'];
        
        // Demo assets with category assignments
        const demoAssets = [
            { name: 'gorilla.png', path: '#', proxyPath: '#', date: '2023-09-15T10:30:00Z', size: 1024000, type: 'image', category: 'characters' },
            { name: 'forest.jpg', path: '#', proxyPath: '#', date: '2023-09-10T14:22:00Z', size: 2048000, type: 'image', category: 'environments' },
            { name: 'banana.png', path: '#', proxyPath: '#', date: '2023-09-05T09:15:00Z', size: 512000, type: 'image', category: 'props' },
            { name: 'gameplay.mp4', path: '#', proxyPath: '#', date: '2023-09-12T13:45:00Z', size: 5120000, type: 'video', category: 'environments' },
            { name: 'tutorial.webm', path: '#', proxyPath: '#', date: '2023-09-08T17:30:00Z', size: 3584000, type: 'video', category: 'characters' },
            { name: 'tree.glb', path: '#', proxyPath: '#', date: '2023-09-01T16:45:00Z', size: 3072000, type: 'model', category: 'props' },
            { name: 'gorilla_avatar.glb', path: '#', proxyPath: '#', date: '2023-08-25T11:20:00Z', size: 4096000, type: 'model', category: 'characters' },
            { name: 'assets.zip', path: '#', proxyPath: '#', date: '2023-08-15T12:30:00Z', size: 8192000, type: 'zip', category: 'textures' },
            { name: 'map.jpg', path: '#', proxyPath: '#', date: '2023-08-20T08:10:00Z', size: 1536000, type: 'image', category: 'environments' },
            { name: 'cosmetic.glb', path: '#', proxyPath: '#', date: '2023-08-10T15:50:00Z', size: 2560000, type: 'model', category: 'characters' },
            { name: 'texture_pack.zip', path: '#', proxyPath: '#', date: '2023-08-05T09:20:00Z', size: 10240000, type: 'zip', category: 'textures' },
            { name: 'pattern.png', path: '#', proxyPath: '#', date: '2023-07-30T16:45:00Z', size: 768000, type: 'image', category: 'textures' },
            { name: 'logo.png', path: '#', proxyPath: '#', date: '2023-07-25T11:10:00Z', size: 256000, type: 'image', category: 'root' },
        ];
        
        assets = demoAssets;
    }

    function displayAssets(assetsToDisplay) {
        assetsGrid.innerHTML = '';
        
        if (assetsToDisplay.length === 0) {
            assetsGrid.innerHTML = '<div class="no-results">No assets match your search.</div>';
            return;
        }
        
        // If we're on the "all" tab, group assets by category (folder)
        if (activeCategory === 'all') {
            // First get all unique categories from assets
            const uniqueCategories = [...new Set(assetsToDisplay.map(asset => asset.category))];
            
            // Sort categories alphabetically but put 'root' at the end if it exists
            uniqueCategories.sort((a, b) => {
                if (a === 'root') return 1;
                if (b === 'root') return -1;
                return a.localeCompare(b);
            });
            
            // Display each category section
            uniqueCategories.forEach(category => {
                const categoryAssets = assetsToDisplay.filter(asset => asset.category === category);
                
                // Skip if no assets in this category
                if (categoryAssets.length === 0) return;
                
                // Add category header
                const categorySection = document.createElement('div');
                categorySection.className = 'category-section';
                categorySection.innerHTML = `
                    <h2>${category === 'root' ? 'Uncategorized' : formatCategoryName(category)} <span class="category-count">(${categoryAssets.length})</span></h2>
                `;
                assetsGrid.appendChild(categorySection);
                
                // Display assets for this category
                categoryAssets.forEach(asset => createAssetItem(asset));
            });
        } else {
            // When a specific category is selected, organize by file types
            // Type labels for display
            const typeLabels = {
                image: 'Images',
                video: 'Videos',
                model: '3D Models',
                zip: 'Archives',
                other: 'Other Files'
            };
            
            // Group assets by type within the selected category
            const assetsByType = {
                image: assetsToDisplay.filter(asset => asset.type === 'image'),
                video: assetsToDisplay.filter(asset => asset.type === 'video'),
                model: assetsToDisplay.filter(asset => asset.type === 'model'),
                zip: assetsToDisplay.filter(asset => asset.type === 'zip'),
                other: assetsToDisplay.filter(asset => !['image', 'video', 'model', 'zip'].includes(asset.type))
            };
            
            // Get selected category name for display
            const categoryName = activeCategory === 'root' ? 'Uncategorized' : formatCategoryName(activeCategory);
            
            // Add a header for the category
            const categoryHeader = document.createElement('div');
            categoryHeader.className = 'category-header';
            categoryHeader.innerHTML = `<h1>${categoryName}</h1>`;
            assetsGrid.appendChild(categoryHeader);
            
            // Display each type section
            Object.keys(assetsByType).forEach(type => {
                const typeAssets = assetsByType[type];
                
                // Skip empty types
                if (typeAssets.length === 0) return;
                
                // Add type section header
                const typeSection = document.createElement('div');
                typeSection.className = 'type-section';
                typeSection.innerHTML = `
                    <h3>${typeLabels[type]} <span class="type-count">(${typeAssets.length})</span></h3>
                `;
                assetsGrid.appendChild(typeSection);
                
                // Display assets for this type
                typeAssets.forEach(asset => createAssetItem(asset));
            });
        }
    }
    
    function createAssetItem(asset) {
            const assetItem = document.createElement('div');
            assetItem.className = 'asset-item';
        assetItem.dataset.category = asset.category;
            
            // Format file size
            const sizeInMB = (asset.size / (1024 * 1024)).toFixed(2);
            const sizeText = sizeInMB < 0.01 ? `${(asset.size / 1024).toFixed(2)} KB` : `${sizeInMB} MB`;
            
            // Format date
            const date = new Date(asset.date);
            const dateText = date.toLocaleDateString();
            
            // Create preview based on asset type
            let preview;
            if (asset.type === 'image') {
                preview = `<div class="asset-preview image-preview">
                    <img src="${asset.path}" alt="${asset.name}" onerror="this.src='../images/image-placeholder.png'">
                </div>`;
        } else if (asset.type === 'video') {
            preview = `<div class="asset-preview video-preview">
                <div class="video-placeholder" data-path="${asset.proxyPath}" data-name="${asset.name}">
                    <i class="fas fa-video"></i>
                </div>
                <div class="video-info-overlay">
                    <span class="video-label">${asset.name.split('.').pop().toUpperCase()}</span>
                </div>
            </div>`;
            } else if (asset.type === 'model') {
                preview = `<div class="asset-preview model-preview">
                    <i class="fas fa-cube"></i>
                </div>`;
            } else if (asset.type === 'zip') {
                preview = `<div class="asset-preview zip-preview">
                    <i class="fas fa-file-archive"></i>
                </div>`;
            } else {
                preview = `<div class="asset-preview other-preview">
                    <i class="fas fa-file"></i>
                </div>`;
            }
            
            // Create the asset item HTML
            assetItem.innerHTML = `
                ${preview}
                <div class="asset-info">
                    <div class="name">${asset.name}</div>
                    <div class="meta">${asset.type.toUpperCase()} · ${dateText} · ${sizeText}</div>
                </div>
                <div class="asset-actions">
                <button class="asset-btn download-btn" title="Download">
                        <i class="fas fa-download"></i>
                    </button>
                </div>
            `;
            
            assetsGrid.appendChild(assetItem);
            
            // Add event listeners
            const downloadBtn = assetItem.querySelector('.download-btn');
            downloadBtn.addEventListener('click', () => {
                downloadAsset(asset);
            });
        
        // Add video play button event listener if it's a video
        if (asset.type === 'video') {
            // Generate thumbnail from first frame
            generateVideoThumbnail(asset, assetItem);
        }
    }
    
    // Function to generate video thumbnails - rewritten to work better with Cloudflare
    function generateVideoThumbnail(asset, assetItem) {
        // Create a temporary video element
        const tempVideo = document.createElement('video');
        
        // Try to allow cross-origin
        tempVideo.crossOrigin = 'anonymous';
        
        // Add a logger to help debugging
        console.log(`Attempting to generate thumbnail for: ${asset.name}`);
        
        // Create a fallback in case thumbnail generation fails
        const placeholder = assetItem.querySelector('.video-placeholder');
        const setFallbackImage = () => {
            console.log(`Using fallback thumbnail for: ${asset.name}`);
            placeholder.innerHTML = '<i class="fas fa-video"></i>';
            placeholder.style.background = 'none';
        };
        
        // Set up media error handling before setting src
        tempVideo.addEventListener('error', function(e) {
            console.error(`Video error for ${asset.name}:`, e);
            setFallbackImage();
        });
        
        // Try using a direct iframe URL for GitHub files to bypass CORS
        // This approach can sometimes work better than proxies
        let videoUrl = asset.proxyPath;
        
        // Set video properties
        tempVideo.muted = true;
        tempVideo.preload = "metadata";
        tempVideo.playsInline = true;
        
        // Set the src after setting up event handlers
        tempVideo.src = videoUrl;
        
        // Set a timeout to handle stalled loading
        const thumbnailTimeout = setTimeout(() => {
            console.log(`Thumbnail generation timed out for: ${asset.name}`);
            setFallbackImage();
            tempVideo.src = '';
            tempVideo.load();
        }, 5000); // 5 second timeout
        
        // Once metadata is loaded, seek to the first frame
        tempVideo.addEventListener('loadedmetadata', function() {
            console.log(`Metadata loaded for: ${asset.name}`);
            // Set video to first frame (0.1 seconds to ensure we get a frame)
            tempVideo.currentTime = 0.1;
        });
        
        // Once the video has seeked to the specified time
        tempVideo.addEventListener('seeked', function() {
            console.log(`Successfully seeked to frame for: ${asset.name}`);
            clearTimeout(thumbnailTimeout);
            
            // Create a canvas and draw the video frame
            const canvas = document.createElement('canvas');
            canvas.width = tempVideo.videoWidth || 320;
            canvas.height = tempVideo.videoHeight || 240;
            
            try {
                const ctx = canvas.getContext('2d');
                ctx.drawImage(tempVideo, 0, 0, canvas.width, canvas.height);
                
                // Convert canvas to image and set it as the thumbnail
                const thumbnail = canvas.toDataURL('image/jpeg');
                
                // Replace icon with thumbnail image
                placeholder.innerHTML = '';
                placeholder.style.background = `url(${thumbnail}) center center / contain no-repeat`;
                placeholder.style.width = '100%';
                placeholder.style.height = '100%';
                console.log(`Successfully created thumbnail for: ${asset.name}`);
            } catch (e) {
                console.error(`Error generating thumbnail for ${asset.name}:`, e);
                setFallbackImage();
            }
            
            // Clean up temporary video element
            tempVideo.src = '';
            tempVideo.load();
        });
        
        // Start loading the video to trigger events
        tempVideo.load();
    }
    
    function downloadAsset(asset) {
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
        a.href = asset.path;
        a.download = asset.name; // This forces download instead of opening in browser
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
    function filterAssets() {
        const searchTerm = searchFilter.value.toLowerCase();
        const sortOption = sortFilter.value;
        
        let filteredAssets = assets.filter(asset => {
            // Filter by search term
            if (searchTerm && !asset.name.toLowerCase().includes(searchTerm)) {
                return false;
            }
            
            // Filter by selected category
            if (activeCategory !== 'all' && asset.category !== activeCategory) {
                return false;
            }
            
            return true;
        });
        
        // Sort assets
        filteredAssets.sort((a, b) => {
            switch (sortOption) {
                case 'name-asc':
                    return a.name.localeCompare(b.name);
                case 'name-desc':
                    return b.name.localeCompare(a.name);
                case 'date-new':
                    return new Date(b.date) - new Date(a.date);
                case 'date-old':
                    return new Date(a.date) - new Date(b.date);
                default:
                    return 0;
            }
        });
        
        displayAssets(filteredAssets);
    }
    
    // Add event listeners for filters
    searchFilter.addEventListener('input', filterAssets);
    sortFilter.addEventListener('change', filterAssets);
}); 
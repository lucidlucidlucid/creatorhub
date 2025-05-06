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
        // Fetch the repository contents using GitHub API
        fetch(apiUrl)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(data => {
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
                        .then(response => response.json())
                        .then(folderData => {
                            // Process files in this folder
                            processFiles(folderData, folder.name);
                        })
                        .catch(error => {
                            console.error(`Error fetching contents of folder ${folder.name}:`, error);
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
                    });
            })
            .catch(error => {
                console.error('Error fetching repository contents:', error);
                
                // Fall back to demo data if GitHub API fails
                useDemoData();
                
                // Set up tabs with demo categories
                setupCategoryTabs();
                
                // Display demo assets
                displayAssets(assets);
                
                // Show error message
                assetsGrid.insertAdjacentHTML('beforebegin', 
                    `<div class="error-message">
                        Website under maintenance. Sorry for inconvenience. Lucid is working on a fix!
                    </div>`
                );
                
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
        const a = document.createElement('a');
        a.href = asset.path; // Use direct path for download, not proxy
        a.download = asset.name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
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
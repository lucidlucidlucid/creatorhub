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
    const typeFilter = document.getElementById('type-filter');
    const sortFilter = document.getElementById('sort-filter');

    // Assets data
    let assets = [];
    
    // Hardcoded repository URL - using the correct path for the main branch
    const apiUrl = 'https://api.github.com/repos/lucidlucidlucid/creatorhub/contents/assetsstuff?ref=main';
    
    // File type definitions
    const imageExtensions = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'];
    const videoExtensions = ['mp4', 'webm', 'mov', 'avi', 'mkv'];
    const modelExtensions = ['glb', 'gltf', 'obj', 'fbx', 'stl'];
    const zipExtensions = ['zip', 'rar', '7z'];
    
    // Show loading indicator immediately
    loadingIndicator.style.display = 'flex';
    
    // Fetch assets from the repository
    fetchAssets();

    function fetchAssets() {
        // Fetch the repository contents using GitHub API
        fetch(apiUrl)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(data => {
                // Filter for image, video, model and zip files
                assets = data.filter(file => {
                    const extension = file.name.split('.').pop().toLowerCase();
                    return [...imageExtensions, ...videoExtensions, ...modelExtensions, ...zipExtensions].includes(extension);
                }).map(file => {
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
                    
                    return {
                        name: file.name,
                        path: file.download_url,
                        date: new Date().toISOString(), // GitHub API doesn't provide date in contents API
                        size: file.size || 0,
                        type: type
                    };
                });
                
                if (assets.length === 0) {
                    assetsGrid.innerHTML = '<div class="no-results">No assets found in the repository.</div>';
                } else {
                    displayAssets(assets);
                }
                loadingIndicator.style.display = 'none';
            })
            .catch(error => {
                console.error('Error fetching assets:', error);
                
                // Fall back to demo data if GitHub API fails
                const demoAssets = [
                    { name: 'gorilla.png', path: '#', date: '2023-09-15T10:30:00Z', size: 1024000, type: 'image' },
                    { name: 'forest.jpg', path: '#', date: '2023-09-10T14:22:00Z', size: 2048000, type: 'image' },
                    { name: 'banana.png', path: '#', date: '2023-09-05T09:15:00Z', size: 512000, type: 'image' },
                    { name: 'gameplay.mp4', path: '#', date: '2023-09-12T13:45:00Z', size: 5120000, type: 'video' },
                    { name: 'tutorial.webm', path: '#', date: '2023-09-08T17:30:00Z', size: 3584000, type: 'video' },
                    { name: 'tree.glb', path: '#', date: '2023-09-01T16:45:00Z', size: 3072000, type: 'model' },
                    { name: 'gorilla_avatar.glb', path: '#', date: '2023-08-25T11:20:00Z', size: 4096000, type: 'model' },
                    { name: 'assets.zip', path: '#', date: '2023-08-15T12:30:00Z', size: 8192000, type: 'zip' },
                    { name: 'map.jpg', path: '#', date: '2023-08-20T08:10:00Z', size: 1536000, type: 'image' },
                    { name: 'cosmetic.glb', path: '#', date: '2023-08-10T15:50:00Z', size: 2560000, type: 'model' },
                ];
                
                assets = demoAssets;
                displayAssets(assets);
                
                // Show error message
                assetsGrid.insertAdjacentHTML('beforebegin', 
                    `<div class="error-message">
                        Could not load assets from GitHub. Showing demo assets instead.
                    </div>`
                );
                
                loadingIndicator.style.display = 'none';
            });
    }

    function displayAssets(assetsToDisplay) {
        assetsGrid.innerHTML = '';
        
        if (assetsToDisplay.length === 0) {
            assetsGrid.innerHTML = '<div class="no-results">No assets match your search.</div>';
            return;
        }
        
        assetsToDisplay.forEach((asset, index) => {
            const assetItem = document.createElement('div');
            assetItem.className = 'asset-item';
            assetItem.dataset.index = index;
            
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
                    <div class="video-placeholder">
                        <i class="fas fa-video"></i>
                    </div>
                    <div class="video-play-button" data-path="${asset.path}" data-name="${asset.name}">
                        <i class="fas fa-play"></i>
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
                    <button class="asset-btn download-btn" title="Download" data-index="${index}">
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
                const playBtn = assetItem.querySelector('.video-play-button');
                playBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    playVideo(asset, assetItem);
                });
            }
        });
    }
    
    function playVideo(asset, assetItem) {
        const videoPreview = assetItem.querySelector('.video-preview');
        const existingVideo = videoPreview.querySelector('video');
        
        // If video is already created, toggle play/pause
        if (existingVideo) {
            if (existingVideo.paused) {
                existingVideo.play();
                assetItem.querySelector('.video-play-button i').className = 'fas fa-pause';
            } else {
                existingVideo.pause();
                assetItem.querySelector('.video-play-button i').className = 'fas fa-play';
            }
            return;
        }
        
        // Otherwise create a new video element
        const placeholder = videoPreview.querySelector('.video-placeholder');
        const playButton = videoPreview.querySelector('.video-play-button');
        
        // Hide the placeholder
        placeholder.style.display = 'none';
        
        // Create the video element
        const video = document.createElement('video');
        video.src = asset.path;
        video.className = 'video-element';
        video.setAttribute('playsinline', '');
        video.setAttribute('muted', '');
        video.setAttribute('controls', '');
        video.setAttribute('controlsList', 'nodownload');
        
        // Update the play button icon
        playButton.querySelector('i').className = 'fas fa-pause';
        
        // Add video to the preview
        videoPreview.insertBefore(video, playButton);
        
        // When video ends, show placeholder again and reset play button
        video.addEventListener('ended', () => {
            placeholder.style.display = 'flex';
            playButton.querySelector('i').className = 'fas fa-play';
        });
        
        // When video is paused, update the play button
        video.addEventListener('pause', () => {
            playButton.querySelector('i').className = 'fas fa-play';
        });
        
        // When video is playing, update the play button
        video.addEventListener('play', () => {
            playButton.querySelector('i').className = 'fas fa-pause';
        });
        
        // Start playing
        video.play();
    }
    
    function downloadAsset(asset) {
        const a = document.createElement('a');
        a.href = asset.path;
        a.download = asset.name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }

    // Search and filtering
    function filterAssets() {
        const searchTerm = searchFilter.value.toLowerCase();
        const selectedType = typeFilter.value;
        const sortOption = sortFilter.value;
        
        let filteredAssets = assets.filter(asset => {
            // Filter by search term
            if (searchTerm && !asset.name.toLowerCase().includes(searchTerm)) {
                return false;
            }
            
            // Filter by type
            if (selectedType !== 'all' && asset.type !== selectedType) {
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
    typeFilter.addEventListener('change', filterAssets);
    sortFilter.addEventListener('change', filterAssets);
}); 
// valadezfamily/js/video-player.js

document.addEventListener('DOMContentLoaded', () => {
    console.log("Video Player Page: DOM Content Loaded.");
    loadVideoFromParams();
});

function loadVideoFromParams() {
    console.log("loadVideoFromParams called.");
    const videoElement = document.getElementById('video-player-element');
    const titleElement = document.getElementById('video-page-title'); // The H1 tag
    const pageTitleTag = document.querySelector('title'); // The <title> tag

    // --- Debugging: Check if elements exist ---
    if (!videoElement) {
        console.error('Video player element (#video-player-element) not found.');
        // Try to display error even if titleElement is missing
        const main = document.getElementById('video-main');
        if(main) main.innerHTML = '<p class="error-message">Error: Video player setup failed (element missing).</p>';
        return;
    }
     if (!titleElement) {
        console.error('Title H1 element (#video-page-title) not found.');
        // Continue without title update if possible, but log error
    }
     if (!pageTitleTag) {
        console.error('<title> tag not found.');
        // Continue without page title update if possible, but log error
    }
    // --- End Debugging ---


    const urlParams = new URLSearchParams(window.location.search);
    const videoSrc = urlParams.get('video');
    const videoTitle = urlParams.get('title'); // Get the title passed from navbar.js

    // --- Debugging: Log retrieved parameters ---
    console.log("URL Parameters:", window.location.search);
    console.log("Retrieved videoSrc:", videoSrc);
    console.log("Retrieved videoTitle:", videoTitle);
     // --- End Debugging ---

    if (videoSrc) {
        console.log(`Loading video: ${videoSrc}`);
        // Basic validation: ensure it's not an obviously malicious path
        if (videoSrc.includes('../')) {
             console.error('Invalid video path detected.');
             if (titleElement) titleElement.textContent = 'Error: Invalid Video Path';
             if (pageTitleTag) pageTitleTag.textContent = 'Error - Valadez Family';
             videoElement.parentElement.innerHTML = '<p class="error-message">Invalid video source specified.</p>';
             return;
        }

        // Clear any existing sources just in case
        while (videoElement.firstChild) {
            videoElement.removeChild(videoElement.firstChild);
        }

        // Create and append the source element
        const sourceElement = document.createElement('source');
        sourceElement.setAttribute('src', videoSrc);
        const extension = videoSrc.split('.').pop()?.toLowerCase();
        if (extension === 'mp4') {
            sourceElement.setAttribute('type', 'video/mp4');
        } else if (extension === 'webm') {
            sourceElement.setAttribute('type', 'video/webm');
        } else if (extension === 'ogv' || extension === 'ogg') {
            sourceElement.setAttribute('type', 'video/ogg');
        } else {
            console.warn(`Unknown video extension: ${extension}. Browser might not play it.`);
            // Optionally add a generic type if unsure, or rely on browser detection
             // sourceElement.setAttribute('type', 'video/video');
        }
        videoElement.appendChild(sourceElement);

        // Add fallback text AFTER the source tag
        videoElement.appendChild(document.createTextNode('Your browser does not support the video tag.'));


        // Load the video
        videoElement.load();

        // --- SET INITIAL VOLUME ---
        videoElement.volume = 0.3; // Set initial volume to 30% (Adjusted from 0.5)
        console.log(`Initial video volume set to: ${videoElement.volume}`);
        // -------------------------

        // Set the titles
        const displayTitle = videoTitle || 'Family Video'; // Fallback title
        console.log("Setting display title to:", displayTitle);

        if (titleElement) {
            titleElement.textContent = displayTitle;
            console.log("H1 title element updated.");
        } else {
            console.warn("Could not update H1 title element (not found).");
        }
        if (pageTitleTag) {
            pageTitleTag.textContent = `${displayTitle} - Valadez Family`;
             console.log("<title> tag updated.");
        } else {
             console.warn("Could not update <title> tag (not found).");
        }


    } else {
        console.error('No video source specified in URL parameters.');
        if (titleElement) titleElement.textContent = 'Error: No Video Specified';
        if (pageTitleTag) pageTitleTag.textContent = 'Error - Valadez Family';
        // Replace video container content with error message
         const videoContainer = document.getElementById('video-container');
         if (videoContainer) {
             videoContainer.innerHTML = '<p class="error-message" style="color: white; padding: 20px;">No video source was provided in the link.</p>';
         } else {
             // Fallback if container itself is missing
              videoElement.parentElement.innerHTML = '<p class="error-message">No video source was provided in the link.</p>';
         }
    }
     console.log("loadVideoFromParams finished.");
}
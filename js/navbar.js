// valadezfamily/js/navbar.js

document.addEventListener('DOMContentLoaded', () => {
    loadNavbarAndData();
});

async function loadNavbarAndData() {
    const navbarPlaceholder = document.getElementById('navbar-placeholder');
    if (!navbarPlaceholder) {
        console.error('Navbar placeholder not found!');
        return;
    }

    // Fetch navbar HTML and slideshow data concurrently
    try {
        // Use relative paths from the HTML document location
        const [navbarHtmlResponse, slideshowDataResponse] = await Promise.all([
            fetch('components/navbar.html'),
            fetch('slideshow_data.json') // Assumes it's in the root
        ]);

        if (!navbarHtmlResponse.ok) {
            throw new Error(`HTTP error loading navbar HTML! status: ${navbarHtmlResponse.status}`);
        }
        if (!slideshowDataResponse.ok) {
            throw new Error(`HTTP error loading slideshow data! status: ${slideshowDataResponse.status}`);
        }

        const navbarHtml = await navbarHtmlResponse.text();
        const slideshowData = await slideshowDataResponse.json();

        // Insert navbar HTML
        navbarPlaceholder.innerHTML = navbarHtml;

        // Populate the slideshow dropdown
        populateSlideshowDropdown(slideshowData);

        // Initialize navbar interactivity
        initializeNavbar();

        // Set the active link based on the current page/hash/params
        setActiveLink();

    } catch (error) {
        console.error('Error loading navbar or slideshow data:', error);
        navbarPlaceholder.innerHTML = '<p style="color: red; text-align: center; background-color: #eee; padding: 10px;">Error loading navigation.</p>';
    }
}

function populateSlideshowDropdown(slideshowData) {
    const dropdownMenu = document.getElementById('slideshows-dropdown-menu');
    if (!dropdownMenu) {
        console.error("Slideshow dropdown menu ('slideshows-dropdown-menu') not found!");
        return;
    }

    dropdownMenu.innerHTML = ''; // Clear the 'Loading...' item

    const monthKeys = Object.keys(slideshowData);

    // Optional: Sort keys if needed (e.g., reverse chronologically as they appear in JSON)
    // monthKeys.sort((a, b) => { /* custom sorting logic */ });

    monthKeys.forEach(key => {
        const entry = slideshowData[key];
        const li = document.createElement('li');
        const a = document.createElement('a');
        a.classList.add('dropdown-item');
        a.textContent = key; // e.g., "April 2025" or "Rachel's Video"

        // Determine link based on type
        if (entry.type === 'video' && entry.videoSrc) { // Check for video type and src
            // Generic video link to video-player.html with parameters
            const videoSrcEncoded = encodeURIComponent(entry.videoSrc);
            const titleEncoded = encodeURIComponent(key);
            a.href = `video-player.html?video=${videoSrcEncoded}&title=${titleEncoded}`;
        } else {
            // Assume image slideshow (type === 'image' or type missing)
            a.href = `index.html#${encodeURIComponent(key)}`;
        }

        li.appendChild(a);
        dropdownMenu.appendChild(li);
    });
}

function initializeNavbar() {
    const toggler = document.getElementById('navbar-toggler');
    const collapse = document.getElementById('navbar-collapse');
    const dropdownToggles = document.querySelectorAll('.navbar-nav .dropdown-toggle');

    if (!toggler || !collapse) {
        console.error('Navbar toggler or collapse element not found after loading.');
        return; // Exit if core elements are missing
    }

    // --- Main Mobile Menu Toggle ---
    toggler.addEventListener('click', () => {
        const isActive = collapse.classList.toggle('active');
        toggler.classList.toggle('active', isActive); // Sync toggler animation class
        toggler.setAttribute('aria-expanded', isActive); // Accessibility

        // If closing main menu, also close any open mobile dropdowns within it
        if (!isActive) {
             document.querySelectorAll('#navbar-collapse .nav-item.dropdown.open').forEach(openDropdown => {
                 openDropdown.classList.remove('open');
                 openDropdown.querySelector('.dropdown-toggle')?.setAttribute('aria-expanded', 'false');
             });
        }
    });

    // --- Dropdown Toggle Click Handler (Mobile Specific Behavior + Always Prevent Default) ---
    dropdownToggles.forEach(toggle => {
        toggle.addEventListener('click', (e) => {
            // *ALWAYS* prevent default link behavior (#) for the toggle itself
            e.preventDefault();

            // Check if we are in mobile view (toggler is visible) to handle opening/closing
            if (window.getComputedStyle(toggler).display !== 'none') {
                const parentItem = toggle.closest('.nav-item.dropdown');
                if (parentItem) {
                     const isOpen = parentItem.classList.toggle('open');
                     toggle.setAttribute('aria-expanded', isOpen); // Accessibility

                     // Close other open dropdowns when opening a new one
                     if (isOpen) {
                         document.querySelectorAll('#navbar-collapse .nav-item.dropdown.open').forEach(openDropdown => {
                             if (openDropdown !== parentItem) {
                                 openDropdown.classList.remove('open');
                                 openDropdown.querySelector('.dropdown-toggle')?.setAttribute('aria-expanded', 'false');
                             }
                         });
                     }
                }
            }
            // On desktop, default hover/focus behavior (CSS) handles opening, and click does nothing useful now.
        });
    });

    // --- General Click Handlers for Closing Menus ---

    // Close mobile menu if clicking OUTSIDE of it
    document.addEventListener('click', (e) => {
        if (collapse.classList.contains('active')) {
            // Ensure the click target is not the toggler itself or within the opened menu
            const isClickInsideNavbar = collapse.contains(e.target);
            const isTogglerClick = toggler.contains(e.target);

            if (!isClickInsideNavbar && !isTogglerClick) {
                closeMobileMenu(); // Use a helper function
            }
        }
    });

    // Close mobile menu when a *non-toggle* navigation link INSIDE it is clicked
    collapse.addEventListener('click', (e) => {
        // Check if the clicked element is a link inside the collapse menu,
        // if the menu is currently active (mobile view),
        // AND if the clicked link is NOT a dropdown toggle itself.
        const clickedLink = e.target.closest('a');
        if (clickedLink && clickedLink.href && collapse.classList.contains('active') && !clickedLink.classList.contains('dropdown-toggle')) {
            // This condition correctly targets dropdown items as well as regular nav links
            closeMobileMenu(); // Use a helper function
            console.log("Mobile menu closed due to link click inside.");
        }
    });

    // Helper function to cleanly close the mobile menu and reset toggles
    function closeMobileMenu() {
        collapse.classList.remove('active');
        toggler.classList.remove('active');
        toggler.setAttribute('aria-expanded', 'false');
        // Also close any open mobile dropdowns within the main menu
        document.querySelectorAll('#navbar-collapse .nav-item.dropdown.open').forEach(openDropdown => {
            openDropdown.classList.remove('open');
            openDropdown.querySelector('.dropdown-toggle')?.setAttribute('aria-expanded', 'false');
        });
    }

// End of initializeNavbar function
}

function setActiveLink() {
    const navLinks = document.querySelectorAll('#navbar-collapse .nav-link, #navbar-collapse .dropdown-item');
    const currentPath = window.location.pathname;
    const currentHash = window.location.hash;
    const currentSearchParams = new URLSearchParams(window.location.search);
    const currentVideoParam = currentSearchParams.get('video'); // For video player page

    // Normalize page name (e.g., handle '/' or '/index.html')
    let pageName = currentPath.substring(currentPath.lastIndexOf('/') + 1);
    if (pageName === '') {
        pageName = 'index.html'; // Consistent base name for root
    }

    navLinks.forEach(link => {
        link.classList.remove('active', 'active-parent'); // Clear previous active states

        const linkHref = link.getAttribute('href');
        if (!linkHref) return;

        const linkUrl = new URL(linkHref, window.location.origin); // Resolve relative URLs
        const linkPageName = linkUrl.pathname.substring(linkUrl.pathname.lastIndexOf('/') + 1) || 'index.html';
        const linkHash = linkUrl.hash;
        const linkSearchParams = new URLSearchParams(linkUrl.search);
        const linkVideoParam = linkSearchParams.get('video'); // For video links

        let isActive = false;

        // --- Matching Logic ---

        // 1. Direct Page Match (excluding index.html, video-player.html)
        if (pageName === linkPageName && !['index.html', 'video-player.html'].includes(pageName)) {
            isActive = true;
        }

        // 2. index.html (Slideshows) Match
        if (pageName === 'index.html' && linkPageName === 'index.html') {
            // Is it the main index link (if one exists, unlikely now) or a dropdown item?
            const isDropdownItem = link.classList.contains('dropdown-item');
            if (isDropdownItem) {
                // Activate if the hash matches the link's hash
                if (currentHash === linkHash && currentHash !== '') {
                     isActive = true;
                }
            } else {
                 // Activate a potential main "Home" link only if there's no hash
                 if (currentHash === '' && linkHash === '') {
                      isActive = true;
                 }
            }
        }

        // 3. video-player.html Match
        if (pageName === 'video-player.html' && linkPageName === 'video-player.html') {
            // Activate if the 'video' parameter matches
            if (currentVideoParam && linkVideoParam && currentVideoParam === linkVideoParam) {
                isActive = true;
            }
        }

        // --- End Matching Logic ---


        if (isActive) {
            link.classList.add('active');

            // If the active link is inside a dropdown, mark the parent toggle
            const dropdownItemParent = link.closest('.dropdown-menu');
            if (dropdownItemParent) {
                const dropdownToggle = dropdownItemParent.closest('.nav-item.dropdown')?.querySelector('.dropdown-toggle');
                 if (dropdownToggle) {
                    // Use a different class to avoid styling the toggle exactly like an active link
                     dropdownToggle.classList.add('active-parent');
                 }
            }
        }

    });

}
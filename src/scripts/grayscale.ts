//
// Grayscale theme scripts
//
// Ported from startbootstrap-grayscale (src/js/scripts.js).
// Uses the ScrollSpy class imported from the bootstrap package rather than
// the global `bootstrap` object, since this runs as an ES module via Vite.

import ScrollSpy from 'bootstrap/js/dist/scrollspy';

window.addEventListener('DOMContentLoaded', () => {
    // Navbar shrink function
    const navbarShrink = function () {
        const navbarCollapsible = document.body.querySelector('#mainNav');
        if (!navbarCollapsible) {
            return;
        }
        if (window.scrollY === 0) {
            navbarCollapsible.classList.remove('navbar-shrink');
        } else {
            navbarCollapsible.classList.add('navbar-shrink');
        }
    };

    // Shrink the navbar
    navbarShrink();

    // Shrink the navbar when page is scrolled
    document.addEventListener('scroll', navbarShrink);

    // Activate Bootstrap scrollspy on the main nav element
    const mainNav = document.body.querySelector('#mainNav');
    if (mainNav) {
        new ScrollSpy(document.body, {
            target: '#mainNav',
            rootMargin: '0px 0px -40%',
        });
    }

    // Collapse responsive navbar when toggler is visible
    const navbarToggler = document.body.querySelector<HTMLElement>('.navbar-toggler');
    const responsiveNavItems = Array.from(
        document.querySelectorAll<HTMLElement>('#navbarResponsive .nav-link'),
    );
    responsiveNavItems.forEach((responsiveNavItem) => {
        responsiveNavItem.addEventListener('click', () => {
            if (navbarToggler && window.getComputedStyle(navbarToggler).display !== 'none') {
                navbarToggler.click();
            }
        });
    });
});

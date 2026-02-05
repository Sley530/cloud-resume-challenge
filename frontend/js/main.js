// Resume JavaScript

document.addEventListener('DOMContentLoaded', () => {
  // Update last modified date
  const lastUpdate = document.getElementById('last-update');
  if (lastUpdate) {
    lastUpdate.textContent = "Last Resume Update: " + new Date(document.lastModified).toLocaleDateString();
  }

  // Add animation classes to elements
  const summary = document.querySelector('.summary');
  const contactBar = document.querySelector('.contact-bar');
  const mainItems = document.querySelectorAll('.main-col .item');
  const sidebarSections = document.querySelectorAll('.sidebar > section');
  const header = document.querySelector('.resume-header');

  // Add initial animation classes
  if (header) header.classList.add('fade-in');
  if (contactBar) contactBar.classList.add('fade-in');
  if (summary) summary.classList.add('slide-in-left');

  mainItems.forEach(item => item.classList.add('fade-in'));
  sidebarSections.forEach(section => section.classList.add('slide-in-right'));

  // Intersection Observer for scroll animations
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  }, {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  });

  // Observe all animated elements
  document.querySelectorAll('.fade-in, .slide-in-left, .slide-in-right, .scale-in').forEach(el => {
    observer.observe(el);
  });
});

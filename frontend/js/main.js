// Resume JavaScript

// PDF Download function
function downloadPDF() {
  const element = document.getElementById('resume');
  const button = document.querySelector('.resume-header button');

  // Hide button and show loading state
  const originalText = button.textContent;
  button.textContent = 'Generating...';
  button.disabled = true;

  // Completely remove elements we don't want in PDF
  const gif = document.querySelector('.header-gif');
  const footer = document.querySelector('footer');
  const gifParent = gif ? gif.parentNode : null;
  const gifNext = gif ? gif.nextSibling : null;

  if (gif) gif.remove();
  if (button) button.style.display = 'none';
  if (footer) footer.style.display = 'none';

  // Add print class
  document.body.classList.add('generating-pdf');

  // Force white background on everything
  const originalBodyBg = document.body.style.background;
  const originalElementBg = element.style.background;
  document.body.style.background = '#ffffff';
  element.style.background = '#ffffff';

  // Make all animated elements visible immediately
  document.querySelectorAll('.fade-in, .slide-in-left, .slide-in-right, .scale-in').forEach(el => {
    el.style.opacity = '1';
    el.style.transform = 'none';
  });

  // Wait for DOM updates
  setTimeout(() => {
    const opt = {
      margin: [0.5, 0.5, 0.5, 0.5],
      filename: 'Paul-Wesley_Jeanty_Resume.pdf',
      image: { type: 'jpeg', quality: 0.95 },
      html2canvas: {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
        removeContainer: true
      },
      jsPDF: {
        unit: 'in',
        format: 'letter',
        orientation: 'portrait'
      }
    };

    html2pdf().set(opt).from(element).save().then(() => {
      cleanup();
    }).catch((err) => {
      console.error('PDF generation failed:', err);
      cleanup();
    });

    function cleanup() {
      document.body.classList.remove('generating-pdf');
      document.body.style.background = originalBodyBg;
      element.style.background = originalElementBg;

      // Restore animated elements
      document.querySelectorAll('.fade-in, .slide-in-left, .slide-in-right, .scale-in').forEach(el => {
        el.style.opacity = '';
        el.style.transform = '';
      });

      // Restore GIF
      if (gif && gifParent) {
        if (gifNext) {
          gifParent.insertBefore(gif, gifNext);
        } else {
          gifParent.appendChild(gif);
        }
      }

      if (button) {
        button.style.display = '';
        button.textContent = originalText;
        button.disabled = false;
      }
      if (footer) footer.style.display = '';
    }
  }, 200);
}

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

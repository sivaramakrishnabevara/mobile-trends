/**
 * MOBILE TRENDS - VIJAYAWADA
 * Realistic Frontend Controller & Dynamic Interactions
 * Clean Royal Blue & White Palette
 */

document.addEventListener('DOMContentLoaded', () => {
  // State
  let storeSettings = {};
  let servicesList = [];
  let inventoryList = [];

  // Initialize Elements & Handlers
  initMobileNav();
  initDialogHandlers();
  initEstimator();
  initBookingFlow();
  initTracker();
  initReviewsFlow();
  initScrollTop();

  // Load API Data
  loadStoreSettings();
  loadServices();
  loadInventory();
  loadReviews();

  // Check Store Live Timings
  updateStoreStatus();
  setInterval(updateStoreStatus, 60000); // Check every minute
});

/* ==================== MOBILE NAVIGATION ==================== */
function initMobileNav() {
  const toggleBtn = document.getElementById('mobileNavToggle');
  const navLinks = document.getElementById('navLinks');
  if (toggleBtn && navLinks) {
    toggleBtn.addEventListener('click', () => {
      navLinks.classList.toggle('active');
    });

    navLinks.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        navLinks.classList.remove('active');
      });
    });
  }
}

/* ==================== DIALOGS & LIGHT-DISMISS FALLBACK ==================== */
function initDialogHandlers() {
  // Booking Buttons
  const heroBookBtn = document.getElementById('heroBookBtn');
  const navBookBtn = document.getElementById('navBookRepairBtn');

  if (heroBookBtn) {
    heroBookBtn.addEventListener('click', () => openModal('bookingModal'));
  }
  if (navBookBtn) {
    navBookBtn.addEventListener('click', () => openModal('bookingModal'));
  }

  // Close buttons with data-close-dialog attribute
  document.querySelectorAll('[data-close-dialog]').forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.getAttribute('data-close-dialog');
      closeModal(targetId);
    });
  });

  // Modern Web Guidance: Light-dismiss fallback for browsers lacking native closedby
  const dialogs = document.querySelectorAll('dialog');
  dialogs.forEach(dialog => {
    if (!('closedBy' in HTMLDialogElement.prototype)) {
      dialog.addEventListener('click', (event) => {
        if (event.target !== dialog) return;
        const rect = dialog.getBoundingClientRect();
        const isDialogContent = (
          rect.top <= event.clientY &&
          event.clientY <= rect.top + rect.height &&
          rect.left <= event.clientX &&
          event.clientX <= rect.left + rect.width
        );
        if (isDialogContent) return;
        dialog.close();
      });
    }
  });
}

function openModal(id) {
  const dialog = document.getElementById(id);
  if (dialog && typeof dialog.showModal === 'function') {
    dialog.showModal();
  }
}

function closeModal(id) {
  const dialog = document.getElementById(id);
  if (dialog && typeof dialog.close === 'function') {
    dialog.close();
  }
}

/* ==================== STORE STATUS CALCULATOR ==================== */
function updateStoreStatus() {
  // Calculate based on Indian Standard Time (IST)
  const now = new Date();
  const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
  const istTime = new Date(utc + (3600000 * 5.5));

  const day = istTime.getDay(); // 0 is Sunday
  const hour = istTime.getHours();
  const minute = istTime.getMinutes();
  const timeVal = hour + (minute / 60);

  const statusPill = document.getElementById('storeStatusPill');
  const statusText = document.getElementById('storeStatusText');

  let isOpen = false;
  if (day === 0) {
    // Sunday: 10:00 AM to 8:00 PM
    isOpen = (timeVal >= 10.0 && timeVal < 20.0);
  } else {
    // Mon - Sat: 9:30 AM to 9:30 PM
    isOpen = (timeVal >= 9.5 && timeVal < 21.5);
  }

  if (statusPill && statusText) {
    if (isOpen) {
      statusPill.style.backgroundColor = '#ecfdf5';
      statusPill.style.borderColor = '#a7f3d0';
      statusPill.style.color = '#065f46';
      statusText.textContent = 'OPEN NOW • Madhura Nagar';
    } else {
      statusPill.style.backgroundColor = '#fef2f2';
      statusPill.style.borderColor = '#fecaca';
      statusPill.style.color = '#991b1b';
      statusText.textContent = 'CLOSED NOW • Opens 9:30 AM';
    }
  }
}

/* ==================== LOAD STORE SETTINGS ==================== */
async function loadStoreSettings() {
  try {
    const res = await fetch('/api/settings');
    if (!res.ok) throw new Error('Failed to load settings');
    storeSettings = await res.json();

    if (storeSettings.announcement) {
      const annEl = document.getElementById('announcementText');
      if (annEl) annEl.textContent = storeSettings.announcement;
    }
    if (storeSettings.address) {
      const addrEl = document.getElementById('storeAddressText');
      if (addrEl) addrEl.textContent = storeSettings.address;
    }
  } catch (err) {
    console.error('Settings load error:', err);
  }
}

/* ==================== REPAIR COST ESTIMATOR ==================== */
function initEstimator() {
  const brand = document.getElementById('estBrand');
  const issue = document.getElementById('estIssue');
  const priceDisplay = document.getElementById('estPriceDisplay');
  const timeDisplay = document.getElementById('estTimeDisplay');
  const btnBook = document.getElementById('btnBookFromEst');

  const pricingMatrix = {
    screen: { Apple: '₹3,499 - ₹7,999', Samsung: '₹2,499 - ₹6,499', OnePlus: '₹2,899 - ₹5,999', Xiaomi: '₹1,299 - ₹2,999', Vivo: '₹1,399 - ₹3,199', Oppo: '₹1,399 - ₹3,199', Other: '₹1,199 - ₹2,499', time: 'Approx 35-45 mins' },
    battery: { Apple: '₹1,499 - ₹2,499', Samsung: '₹1,199 - ₹1,899', OnePlus: '₹1,299 - ₹1,999', Xiaomi: '₹799 - ₹1,299', Vivo: '₹799 - ₹1,299', Oppo: '₹799 - ₹1,299', Other: '₹699 - ₹1,199', time: 'Approx 25-30 mins' },
    charging: { Apple: '₹899 - ₹1,499', Samsung: '₹599 - ₹999', OnePlus: '₹699 - ₹1,099', Xiaomi: '₹399 - ₹699', Vivo: '₹399 - ₹699', Oppo: '₹399 - ₹699', Other: '₹349 - ₹599', time: 'Approx 20 mins' },
    water: { Apple: '₹1,499 - ₹3,499', Samsung: '₹999 - ₹2,499', OnePlus: '₹1,199 - ₹2,799', Xiaomi: '₹699 - ₹1,499', Vivo: '₹699 - ₹1,499', Oppo: '₹699 - ₹1,499', Other: '₹699 - ₹1,299', time: 'Approx 2-3 hours' },
    motherboard: { Apple: '₹2,499 - ₹4,999', Samsung: '₹1,899 - ₹3,999', OnePlus: '₹1,999 - ₹4,199', Xiaomi: '₹1,299 - ₹2,499', Vivo: '₹1,299 - ₹2,499', Oppo: '₹1,299 - ₹2,499', Other: '₹999 - ₹1,999', time: 'Same day service' },
    mic: { Apple: '₹799 - ₹1,299', Samsung: '₹499 - ₹899', OnePlus: '₹549 - ₹899', Xiaomi: '₹349 - ₹599', Vivo: '₹349 - ₹599', Oppo: '₹349 - ₹599', Other: '₹299 - ₹499', time: 'Approx 25 mins' },
    software: { Apple: '₹699 - ₹1,299', Samsung: '₹499 - ₹999', OnePlus: '₹499 - ₹999', Xiaomi: '₹399 - ₹799', Vivo: '₹399 - ₹799', Oppo: '₹399 - ₹799', Other: '₹349 - ₹699', time: 'Approx 45 mins' }
  };

  function updateQuote() {
    const selectedBrand = brand ? brand.value : 'Apple';
    const selectedIssue = issue ? issue.value : 'screen';

    const cat = pricingMatrix[selectedIssue] || pricingMatrix.screen;
    const price = cat[selectedBrand] || cat.Other;

    if (priceDisplay) priceDisplay.textContent = price;
    if (timeDisplay) timeDisplay.textContent = `⏱️ ${cat.time}`;
  }

  if (brand) brand.addEventListener('change', updateQuote);
  if (issue) issue.addEventListener('change', updateQuote);
  updateQuote();

  if (btnBook) {
    btnBook.addEventListener('click', () => {
      const modelVal = document.getElementById('estModel').value;
      const devInput = document.getElementById('bookDeviceModel');
      if (devInput && modelVal) {
        devInput.value = `${brand.value} ${modelVal}`;
      }
      openModal('bookingModal');
    });
  }
}

/* ==================== SERVICES RENDERING ==================== */
async function loadServices() {
  const container = document.getElementById('servicesContainer');
  if (!container) return;

  try {
    const res = await fetch('/api/services');
    servicesList = await res.json();
    renderServices(servicesList);
    initServiceFilters();
  } catch (err) {
    container.innerHTML = `<p style="color: #ef4444;">Failed to load services.</p>`;
  }
}

function renderServices(items) {
  const container = document.getElementById('servicesContainer');
  if (!container) return;

  if (items.length === 0) {
    container.innerHTML = `<p style="grid-column: 1/-1; text-align: center; color: #64748b; padding: 2rem;">No services found in this category.</p>`;
    return;
  }

  container.innerHTML = items.map(srv => `
    <div class="service-item-card" data-category="${srv.category}">
      <div class="service-top-row">
        <div class="service-icon-box">${srv.icon}</div>
        <span class="service-warranty-tag">🛡️ ${srv.warranty}</span>
      </div>

      <div style="font-size: 0.75rem; color: var(--color-primary, #059669); font-weight: 700; text-transform: uppercase;">
        ${srv.category} Service
      </div>

      <h3 class="service-card-title">${srv.title}</h3>
      <p class="service-card-desc">${srv.description}</p>

      <div style="font-size: 0.8rem; color: #64748b; display: flex; align-items: center; gap: 0.35rem;">
        <span>⏱️ Turnaround: <strong>${srv.duration}</strong></span>
      </div>

      <div class="service-pricing-row">
        <span class="service-card-price">${srv.priceRange}</span>
        <button class="btn btn-secondary btn-sm" onclick="selectServiceForBooking('${srv.title.replace(/'/g, "\\'")}')">
          Book Service
        </button>
      </div>
    </div>
  `).join('');
}

window.selectServiceForBooking = function(serviceTitle) {
  const select = document.getElementById('bookServiceType');
  if (select) {
    let matched = false;
    for (let opt of select.options) {
      if (opt.value.includes(serviceTitle) || serviceTitle.includes(opt.value)) {
        select.value = opt.value;
        matched = true;
        break;
      }
    }
    if (!matched) select.value = select.options[0].value;
  }
  openModal('bookingModal');
};

function initServiceFilters() {
  const filterBtns = document.querySelectorAll('#servicesFilter .category-tab-btn');
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const cat = btn.getAttribute('data-filter');
      if (cat === 'all') {
        renderServices(servicesList);
      } else {
        const filtered = servicesList.filter(s => s.category.toLowerCase() === cat.toLowerCase());
        renderServices(filtered);
      }
    });
  });
}

/* ==================== REPAIR TRACKER FLOW ==================== */
function initTracker() {
  const form = document.getElementById('trackerForm');
  const input = document.getElementById('trackerInput');

  if (form && input) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const val = input.value.trim();
      if (!val) {
        showToast('Please enter a valid Ticket ID or Phone number');
        return;
      }
      await performTrack(val);
    });
  }
}

async function performTrack(identifier) {
  const btn = document.getElementById('btnTrackSubmit');
  if (btn) btn.disabled = true;

  try {
    const res = await fetch(`/api/bookings/track/${encodeURIComponent(identifier)}`);
    const data = await res.json();

    if (!res.ok || !data.results || data.results.length === 0) {
      showToast(data.error || 'No active repair ticket found with that ID or Phone', 'warning');
      return;
    }

    const booking = data.results[0];
    updateTrackerUI(booking);
    showToast(`Found Ticket ${booking.id} (${booking.status})`);
  } catch (err) {
    showToast('Failed to connect to tracking server', 'error');
  } finally {
    if (btn) btn.disabled = false;
  }
}

function updateTrackerUI(b) {
  const ticketIdEl = document.getElementById('trackTicketId');
  const devNameEl = document.getElementById('trackDeviceName');
  const custNameEl = document.getElementById('trackCustomerName');
  const badgeEl = document.getElementById('trackStatusBadge');
  const notesEl = document.getElementById('trackTechNotes');
  const progBar = document.getElementById('timelineProgressBar');

  if (ticketIdEl) ticketIdEl.textContent = `JOB SHEET NO: ${b.id}`;
  if (devNameEl) devNameEl.textContent = `${b.deviceModel} • ${b.serviceType}`;
  if (custNameEl) custNameEl.textContent = `Customer: ${b.customerName} • Phone: ${b.phone} • Est: ${b.estimatedCost}`;
  if (notesEl) notesEl.textContent = b.technicianNotes || 'Device in processing at Madhura Nagar lab.';

  // Map status to progress bar percentage and timeline nodes
  const steps = ['received', 'diagnosing', 'in-repair', 'ready', 'delivered'];
  const statusMap = {
    'received': 1,
    'diagnosing': 2,
    'in repair': 3,
    'ready for pickup': 4,
    'delivered': 5
  };

  const currentLevel = statusMap[b.status.toLowerCase()] || 1;

  if (badgeEl) {
    badgeEl.textContent = b.status.toUpperCase();
    badgeEl.className = 'badge-status ' + b.status.toLowerCase().replace(/\s+/g, '-');
  }

  // Update progress bar
  const percentages = [10, 25, 50, 75, 100];
  if (progBar) {
    progBar.style.width = `${percentages[currentLevel - 1]}%`;
  }

  // Update step elements
  steps.forEach((stepKey, idx) => {
    const el = document.getElementById(`step-${stepKey}`);
    if (el) {
      el.classList.remove('completed', 'active');
      if (idx + 1 < currentLevel) {
        el.classList.add('completed');
      } else if (idx + 1 === currentLevel) {
        el.classList.add('active');
      }
    }
  });
}

/* ==================== INVENTORY / ACCESSORIES ==================== */
async function loadInventory() {
  const container = document.getElementById('inventoryContainer');
  if (!container) return;

  try {
    const res = await fetch('/api/inventory');
    inventoryList = await res.json();
    renderInventory(inventoryList);
  } catch (err) {
    container.innerHTML = `<p style="color: #ef4444;">Failed to load accessories.</p>`;
  }
}

function renderInventory(items) {
  const container = document.getElementById('inventoryContainer');
  if (!container) return;

  container.innerHTML = items.map(item => `
    <div class="product-item-card">
      <div class="product-thumb-wrap">
        <img src="${item.image}" alt="${item.name}" class="product-thumb-img" loading="lazy">
        <span class="product-tag-pill">${item.tag || 'Popular'}</span>
      </div>

      <div class="product-content-body">
        <span class="product-category-name">${item.category}</span>
        <h3 class="product-heading">${item.name}</h3>
        <p class="product-spec-line">${item.specs}</p>

        <div class="product-price-bar">
          <span class="price-actual">₹${item.price}</span>
          <span class="price-crossed">₹${item.originalPrice}</span>
          <span class="price-discount-text">${Math.round(((item.originalPrice - item.price) / item.originalPrice) * 100)}% OFF</span>
        </div>

        <div style="display: flex; gap: 0.5rem; margin-top: 0.6rem;">
          <a href="https://wa.me/919394111121?text=${encodeURIComponent(`Hi Mobile Trends! I am interested in purchasing: ${item.name} (Price: ₹${item.price}). Is it in stock at your Madhura Nagar shop?`)}" 
             target="_blank" 
             rel="noopener" 
             class="btn btn-whatsapp" 
             style="flex: 1; font-size: 0.84rem; padding: 0.5rem 0.8rem;">
            💬 Order on WhatsApp
          </a>
          <button class="btn btn-secondary" style="font-size: 0.8rem; padding: 0.5rem 0.75rem;" onclick="showStockInfo('${item.name}', ${item.stock})">
            Stock: ${item.stock}
          </button>
        </div>
      </div>
    </div>
  `).join('');
}

window.showStockInfo = function(name, stock) {
  showToast(`"${name}" - ${stock} units in stock at Madhura Nagar shop`);
};

/* ==================== REVIEWS RENDERING & SUBMISSION ==================== */
async function loadReviews() {
  const container = document.getElementById('reviewsContainer');
  if (!container) return;

  try {
    const res = await fetch('/api/reviews');
    const reviews = await res.json();
    renderReviews(reviews);
  } catch (err) {
    container.innerHTML = `<p>Failed to load customer reviews.</p>`;
  }
}

function renderReviews(reviews) {
  const container = document.getElementById('reviewsContainer');
  if (!container) return;

  container.innerHTML = reviews.map(rev => {
    const isGoogle = rev.source && rev.source.toLowerCase().includes('google');
    const isJD = rev.source && rev.source.toLowerCase().includes('justdial');
    const badgeColor = isGoogle ? '#2563eb' : isJD ? '#d97706' : '#059669';
    const icon = isGoogle ? '🌐 ' : isJD ? '⭐ ' : '👤 ';

    return `
    <div class="review-item-box">
      <div style="display: flex; justify-content: space-between; align-items: flex-start;">
        <div>
          <div class="review-author-name">${rev.author}</div>
          <div class="review-author-meta" style="color: ${badgeColor}; font-weight: 600;">
            ${icon}${rev.source} <span style="color: var(--text-muted); font-weight: 400;">• ${rev.date}</span>
          </div>
        </div>
        <div style="color: #f59e0b; font-size: 0.95rem;">
          ${'⭐'.repeat(rev.rating)}
        </div>
      </div>
      <p class="review-text">"${rev.comment}"</p>
    </div>
  `;
  }).join('');
}

function initReviewsFlow() {
  const btnWrite = document.getElementById('btnWriteReview');
  const reviewForm = document.getElementById('reviewForm');

  if (btnWrite) {
    btnWrite.addEventListener('click', () => {
      openModal('reviewModal');
    });
  }

  if (reviewForm) {
    reviewForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const author = document.getElementById('revAuthor').value.trim();
      const rating = document.getElementById('revRating').value;
      const comment = document.getElementById('revComment').value.trim();
      const sourceEl = document.getElementById('revSource');
      const source = sourceEl ? sourceEl.value : 'Google Review';

      if (!author || !comment) {
        showToast('Please fill all review fields');
        return;
      }

      try {
        const res = await fetch('/api/reviews', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ author, rating, comment, source })
        });
        const data = await res.json();

        if (res.ok) {
          showToast('Thank you! Review published successfully');
          closeModal('reviewModal');
          reviewForm.reset();
          loadReviews();
        } else {
          showToast(data.error || 'Failed to submit review', 'error');
        }
      } catch (err) {
        showToast('Error connecting to reviews API', 'error');
      }
    });
  }
}

/* ==================== SERVICE BOOKING FLOW ==================== */
function initBookingFlow() {
  const bookingForm = document.getElementById('bookingForm');
  const trackThisTicketBtn = document.getElementById('btnTrackThisTicket');

  if (bookingForm) {
    bookingForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const customerName = document.getElementById('bookCustomerName').value.trim();
      const phone = document.getElementById('bookPhone').value.trim();
      const deviceModel = document.getElementById('bookDeviceModel').value.trim();
      const serviceType = document.getElementById('bookServiceType').value;
      const issueDescription = document.getElementById('bookIssueDesc').value.trim();

      const submitBtn = document.getElementById('btnSubmitBooking');
      if (submitBtn) submitBtn.disabled = true;

      try {
        const res = await fetch('/api/bookings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            customerName,
            phone,
            deviceModel,
            serviceType,
            issueDescription
          })
        });

        const data = await res.json();

        if (res.ok && data.success) {
          closeModal('bookingModal');
          bookingForm.reset();

          // Show Success Modal
          const ticketIdDisplay = document.getElementById('successTicketId');
          if (ticketIdDisplay) ticketIdDisplay.textContent = data.ticketId;

          openModal('successModal');

          if (trackThisTicketBtn) {
            trackThisTicketBtn.onclick = () => {
              closeModal('successModal');
              const trackerInp = document.getElementById('trackerInput');
              if (trackerInp) {
                trackerInp.value = data.ticketId;
                performTrack(data.ticketId);
              }
              document.getElementById('tracker').scrollIntoView({ behavior: 'smooth' });
            };
          }
        } else {
          showToast(data.error || 'Booking submission failed', 'error');
        }
      } catch (err) {
        showToast('Error connecting to booking system', 'error');
      } finally {
        if (submitBtn) submitBtn.disabled = false;
      }
    });
  }
}

/* ==================== TOAST NOTIFICATION HELPER ==================== */
function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = 'toast';

  const icon = type === 'error' ? '❌' : (type === 'warning' ? '⚠️' : '✅');
  toast.innerHTML = `<span>${icon}</span> <span>${message}</span>`;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

/* ==================== DEMO TRACKER CHIPS & SCROLL TOP ==================== */
window.fillAndTrack = function(id) {
  const input = document.getElementById('trackerInput');
  if (input) {
    input.value = id;
    performTrack(id);
  }
};

window.copyStoreAddress = function(e) {
  if (e) {
    e.preventDefault();
    e.stopPropagation();
  }
  const addr = "21-9-3A, Main Rd, Beside SBI Bank, Pasupu Thota, Madhura Nagar, Vijayawada, Andhra Pradesh 520011";
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(addr).then(() => {
      showToast('Address copied to clipboard! 📋');
    }).catch(() => {
      showToast('Address: ' + addr);
    });
  } else {
    showToast('Address: ' + addr);
  }
};

function initScrollTop() {
  const btn = document.getElementById('scrollTopBtn');
  if (!btn) return;

  window.addEventListener('scroll', () => {
    if (window.scrollY > 350) {
      btn.classList.add('visible');
    } else {
      btn.classList.remove('visible');
    }
  });

  btn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}


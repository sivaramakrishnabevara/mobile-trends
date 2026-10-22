/**
 * MOBILE TRENDS - ADMIN PORTAL SCRIPT
 * Authentication, REST API Management, CRUD for Bookings, Inventory, Services & Settings
 */

document.addEventListener('DOMContentLoaded', () => {
  let adminToken = localStorage.getItem('mt_admin_token');
  let currentBookings = [];
  let currentInventory = [];
  let currentServices = [];

  // Setup UI Listeners
  initAuthFlow();
  initTabs();
  initDialogHandlers();
  initFilters();
  initForms();

  // If token exists, verify and bootstrap
  if (adminToken) {
    verifySession();
  } else {
    showLoginOverlay();
  }

  // --- AUTHENTICATION ---
  function initAuthFlow() {
    const loginForm = document.getElementById('adminLoginForm');
    const logoutBtn = document.getElementById('btnAdminLogout');

    if (loginForm) {
      loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('loginUsername').value.trim();
        const password = document.getElementById('loginPassword').value.trim();

        try {
          const res = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
          });
          const data = await res.json();

          if (res.ok && data.token) {
            adminToken = data.token;
            localStorage.setItem('mt_admin_token', adminToken);
            hideLoginOverlay();
            showAdminToast('Login successful. Welcome back!');
            loadAllAdminData();
          } else {
            showAdminToast(data.error || 'Invalid credentials', 'error');
          }
        } catch (err) {
          showAdminToast('Error connecting to authentication service', 'error');
        }
      });
    }

    if (logoutBtn) {
      logoutBtn.addEventListener('click', async () => {
        if (adminToken) {
          await fetch('/api/auth/logout', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${adminToken}` }
          });
        }
        localStorage.removeItem('mt_admin_token');
        adminToken = null;
        showLoginOverlay();
        showAdminToast('Logged out successfully');
      });
    }

    const refreshBtn = document.getElementById('btnRefreshData');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => {
        loadAllAdminData();
        showAdminToast('Data refreshed');
      });
    }
  }

  async function verifySession() {
    try {
      const res = await fetch('/api/auth/verify', {
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });
      const data = await res.json();
      if (res.ok && data.valid) {
        hideLoginOverlay();
        loadAllAdminData();
      } else {
        localStorage.removeItem('mt_admin_token');
        showLoginOverlay();
      }
    } catch (err) {
      showLoginOverlay();
    }
  }

  function showLoginOverlay() {
    const overlay = document.getElementById('loginOverlay');
    if (overlay) overlay.style.display = 'flex';
  }

  function hideLoginOverlay() {
    const overlay = document.getElementById('loginOverlay');
    if (overlay) overlay.style.display = 'none';
  }

  // --- TABS MANAGEMENT ---
  function initTabs() {
    const navItems = document.querySelectorAll('.admin-nav-item');
    navItems.forEach(item => {
      item.addEventListener('click', () => {
        const tabId = item.getAttribute('data-tab');
        switchTab(tabId);
      });
    });
  }

  window.switchTab = function(tabId) {
    document.querySelectorAll('.admin-nav-item').forEach(i => i.classList.remove('active'));
    document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));

    const navTarget = document.querySelector(`.admin-nav-item[data-tab="${tabId}"]`);
    const panelTarget = document.getElementById(tabId);

    if (navTarget) navTarget.classList.add('active');
    if (panelTarget) panelTarget.classList.add('active');

    // Title update
    const titleMap = {
      'tab-overview': 'Dashboard Overview',
      'tab-bookings': 'Device Repair Tickets',
      'tab-inventory': 'Accessories & Inventory',
      'tab-services': 'Services & Pricing',
      'tab-settings': 'Store Settings & Landmark'
    };
    const titleEl = document.getElementById('currentTabTitle');
    if (titleEl) titleEl.textContent = titleMap[tabId] || 'Admin Console';
  };

  // --- DATA LOADING ---
  async function loadAllAdminData() {
    await Promise.all([
      loadStats(),
      loadBookings(),
      loadInventory(),
      loadServices(),
      loadSettings()
    ]);
  }

  // 1. STATS
  async function loadStats() {
    try {
      const res = await fetch('/api/stats', {
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });
      if (!res.ok) return;
      const stats = await res.json();

      document.getElementById('kpiTotalBookings').textContent = stats.totalBookings || 0;
      document.getElementById('kpiPendingRepairs').textContent = stats.pending || 0;
      document.getElementById('kpiCompletedRepairs').textContent = stats.completed || 0;
      document.getElementById('kpiTotalProducts').textContent = stats.totalProducts || 0;
      document.getElementById('kpiLowStock').textContent = `${stats.lowStock || 0} Low in stock`;
      if (document.getElementById('kpiGoogleRating')) {
        document.getElementById('kpiGoogleRating').textContent = `${stats.googleRating || 4.8} ★`;
      }
      if (document.getElementById('kpiGoogleReviews')) {
        document.getElementById('kpiGoogleReviews').textContent = `${stats.googleReviewCount || 245}+ Verified Reviews`;
      }
    } catch (err) {
      console.error('Stats error:', err);
    }
  }

  // 2. BOOKINGS
  async function loadBookings() {
    try {
      const res = await fetch('/api/bookings', {
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });
      if (!res.ok) return;
      currentBookings = await res.json();

      renderRecentBookings(currentBookings.slice(0, 5));
      renderBookingsTable(currentBookings);
    } catch (err) {
      console.error('Bookings error:', err);
    }
  }

  function renderRecentBookings(items) {
    const tbody = document.getElementById('overviewRecentBookingsBody');
    if (!tbody) return;
    if (items.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--admin-muted);">No repair jobs yet.</td></tr>`;
      return;
    }

    tbody.innerHTML = items.map(b => `
      <tr>
        <td><strong>${b.id}</strong></td>
        <td>${b.customerName}</td>
        <td>${b.deviceModel}</td>
        <td>${b.serviceType}</td>
        <td><span class="badge-status ${b.status.toLowerCase().replace(/\s+/g, '-')}">${b.status}</span></td>
        <td>${new Date(b.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
      </tr>
    `).join('');
  }

  function renderBookingsTable(items) {
    const tbody = document.getElementById('adminBookingsTableBody');
    if (!tbody) return;

    if (items.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--admin-muted); padding: 2rem;">No bookings matching search.</td></tr>`;
      return;
    }

    tbody.innerHTML = items.map(b => `
      <tr>
        <td><strong>${b.id}</strong></td>
        <td>
          <div style="font-weight: 700;">${b.customerName}</div>
          <div style="color: var(--admin-cyan); font-size: 0.82rem;">📞 ${b.phone}</div>
        </td>
        <td>${b.deviceModel}</td>
        <td>
          <div>${b.serviceType}</div>
          <div style="font-size: 0.75rem; color: var(--admin-muted); max-width: 200px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${b.issueDescription}</div>
        </td>
        <td style="color: var(--admin-amber); font-weight: 700;">${b.estimatedCost}</td>
        <td><span class="badge-status ${b.status.toLowerCase().replace(/\s+/g, '-')}">${b.status}</span></td>
        <td>
          <div style="display: flex; gap: 0.4rem;">
            <button class="btn-sm btn-action-edit" onclick="openEditBooking('${b.id}')">
              ✏️ Status
            </button>
            <button class="btn-sm btn-action-delete" onclick="deleteBooking('${b.id}')">
              🗑️
            </button>
          </div>
        </td>
      </tr>
    `).join('');
  }

  // Filter Bookings
  function initFilters() {
    const searchInput = document.getElementById('bookingSearchInput');
    const statusFilter = document.getElementById('bookingStatusFilter');

    function applyFilter() {
      const q = (searchInput ? searchInput.value : '').toLowerCase();
      const status = statusFilter ? statusFilter.value : 'All';

      const filtered = currentBookings.filter(b => {
        const matchesSearch = b.id.toLowerCase().includes(q) ||
                              b.customerName.toLowerCase().includes(q) ||
                              b.phone.includes(q) ||
                              b.deviceModel.toLowerCase().includes(q);
        const matchesStatus = (status === 'All') || (b.status.toLowerCase() === status.toLowerCase());
        return matchesSearch && matchesStatus;
      });

      renderBookingsTable(filtered);
    }

    if (searchInput) searchInput.addEventListener('input', applyFilter);
    if (statusFilter) statusFilter.addEventListener('change', applyFilter);
  }

  // Edit Booking Modal Flow
  window.openEditBooking = function(id) {
    const b = currentBookings.find(item => item.id === id);
    if (!b) return;

    document.getElementById('editBookingId').value = b.id;
    document.getElementById('editBookingStatus').value = b.status;
    document.getElementById('editBookingCost').value = b.estimatedCost;
    document.getElementById('editBookingNotes').value = b.technicianNotes || '';

    openDialog('editBookingModal');
  };

  window.deleteBooking = async function(id) {
    if (!confirm(`Are you sure you want to remove booking ticket ${id}?`)) return;

    try {
      const res = await fetch(`/api/bookings/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });
      if (res.ok) {
        showAdminToast(`Ticket ${id} removed`);
        loadBookings();
        loadStats();
      }
    } catch (err) {
      showAdminToast('Failed to delete booking', 'error');
    }
  };

  // 3. INVENTORY MANAGEMENT
  async function loadInventory() {
    try {
      const res = await fetch('/api/inventory');
      currentInventory = await res.json();
      renderInventoryTable(currentInventory);
    } catch (err) {
      console.error('Inventory error:', err);
    }
  }

  function renderInventoryTable(items) {
    const tbody = document.getElementById('adminInventoryTableBody');
    if (!tbody) return;

    tbody.innerHTML = items.map(i => `
      <tr>
        <td>
          <div style="display: flex; align-items: center; gap: 0.75rem;">
            <img src="${i.image}" style="width: 40px; height: 40px; border-radius: 8px; object-fit: cover;">
            <div>
              <div style="font-weight: 700;">${i.name}</div>
              <div style="font-size: 0.75rem; color: var(--admin-muted);">${i.specs || ''}</div>
            </div>
          </div>
        </td>
        <td><span class="badge-status in-repair">${i.category}</span></td>
        <td style="font-weight: 700; color: var(--admin-cyan);">₹${i.price}</td>
        <td style="color: var(--admin-muted); text-decoration: line-through;">₹${i.originalPrice}</td>
        <td>
          <span style="font-weight: 700; color: ${i.stock <= 10 ? 'var(--admin-amber)' : 'var(--admin-emerald)'};">
            ${i.stock} in stock
          </span>
        </td>
        <td><span style="font-size: 0.75rem; color: var(--admin-indigo); font-weight: 700;">${i.tag || ''}</span></td>
        <td>
          <button class="btn-sm btn-action-delete" onclick="deleteInventoryItem('${i.id}')">
            🗑️ Delete
          </button>
        </td>
      </tr>
    `).join('');
  }

  window.deleteInventoryItem = async function(id) {
    if (!confirm('Remove this product from catalog?')) return;
    try {
      const res = await fetch(`/api/inventory/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });
      if (res.ok) {
        showAdminToast('Product removed');
        loadInventory();
        loadStats();
      }
    } catch (err) {
      showAdminToast('Delete failed', 'error');
    }
  };

  // 4. SERVICES MANAGEMENT
  async function loadServices() {
    try {
      const res = await fetch('/api/services');
      currentServices = await res.json();
      renderServicesTable(currentServices);
    } catch (err) {
      console.error('Services error:', err);
    }
  }

  function renderServicesTable(items) {
    const tbody = document.getElementById('adminServicesTableBody');
    if (!tbody) return;

    tbody.innerHTML = items.map(s => `
      <tr>
        <td>
          <div style="display: flex; align-items: center; gap: 0.6rem;">
            <span style="font-size: 1.3rem;">${s.icon}</span>
            <div>
              <div style="font-weight: 700;">${s.title}</div>
              <div style="font-size: 0.75rem; color: var(--admin-muted);">${s.description}</div>
            </div>
          </div>
        </td>
        <td><span class="badge-status received">${s.category}</span></td>
        <td style="font-weight: 700; color: var(--admin-amber);">${s.priceRange}</td>
        <td>${s.duration}</td>
        <td style="color: var(--admin-emerald); font-weight: 600;">${s.warranty}</td>
        <td>
          <button class="btn-sm btn-action-delete" onclick="deleteServiceItem('${s.id}')">
            🗑️ Delete
          </button>
        </td>
      </tr>
    `).join('');
  }

  window.deleteServiceItem = async function(id) {
    if (!confirm('Remove this repair service?')) return;
    try {
      const res = await fetch(`/api/services/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });
      if (res.ok) {
        showAdminToast('Service removed');
        loadServices();
      }
    } catch (err) {
      showAdminToast('Delete failed', 'error');
    }
  };

  // 5. SETTINGS
  async function loadSettings() {
    try {
      const res = await fetch('/api/settings');
      const settings = await res.json();

      document.getElementById('setAnnouncement').value = settings.announcement || '';
      document.getElementById('setPhone').value = settings.phone || '';
      document.getElementById('setAltPhone').value = settings.alternatePhone || '';
      document.getElementById('setAddress').value = settings.address || '';
      document.getElementById('setLandmark').value = settings.landmark || '';
      if (settings.hours) {
        document.getElementById('setHoursWeekdays').value = settings.hours.weekdays || '';
        document.getElementById('setHoursSunday').value = settings.hours.sunday || '';
      }
    } catch (err) {
      console.error('Settings error:', err);
    }
  }

  // --- FORMS HANDLING ---
  function initForms() {
    // 1. Edit Booking Status Form
    const editBookingForm = document.getElementById('editBookingForm');
    if (editBookingForm) {
      editBookingForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('editBookingId').value;
        const status = document.getElementById('editBookingStatus').value;
        const estimatedCost = document.getElementById('editBookingCost').value.trim();
        const technicianNotes = document.getElementById('editBookingNotes').value.trim();

        try {
          const res = await fetch(`/api/bookings/${id}/status`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${adminToken}`
            },
            body: JSON.stringify({ status, estimatedCost, technicianNotes })
          });

          if (res.ok) {
            showAdminToast(`Ticket ${id} updated to ${status}`);
            closeDialog('editBookingModal');
            loadBookings();
            loadStats();
          } else {
            showAdminToast('Failed to update ticket', 'error');
          }
        } catch (err) {
          showAdminToast('Error updating ticket', 'error');
        }
      });
    }

    // 2. Add Product Form
    const btnAddProd = document.getElementById('btnAddNewProduct');
    const prodForm = document.getElementById('productForm');
    if (btnAddProd) {
      btnAddProd.addEventListener('click', () => {
        openDialog('productModal');
      });
    }

    if (prodForm) {
      prodForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('prodName').value.trim();
        const category = document.getElementById('prodCategory').value;
        const tag = document.getElementById('prodTag').value.trim();
        const price = document.getElementById('prodPrice').value;
        const originalPrice = document.getElementById('prodOrigPrice').value;
        const stock = document.getElementById('prodStock').value;
        const specs = document.getElementById('prodSpecs').value.trim();
        const image = document.getElementById('prodImage').value.trim();

        try {
          const res = await fetch('/api/inventory', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${adminToken}`
            },
            body: JSON.stringify({ name, category, tag, price, originalPrice, stock, specs, image })
          });

          if (res.ok) {
            showAdminToast(`Product "${name}" added to inventory`);
            closeDialog('productModal');
            prodForm.reset();
            loadInventory();
            loadStats();
          } else {
            showAdminToast('Failed to add product', 'error');
          }
        } catch (err) {
          showAdminToast('Error adding product', 'error');
        }
      });
    }

    // 3. Add Service Form
    const btnAddSrv = document.getElementById('btnAddService');
    const srvForm = document.getElementById('serviceForm');
    if (btnAddSrv) {
      btnAddSrv.addEventListener('click', () => {
        openDialog('serviceModal');
      });
    }

    if (srvForm) {
      srvForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const title = document.getElementById('srvTitle').value.trim();
        const category = document.getElementById('srvCategory').value;
        const icon = document.getElementById('srvIcon').value.trim() || '🛠️';
        const priceRange = document.getElementById('srvPriceRange').value.trim();
        const duration = document.getElementById('srvDuration').value.trim();
        const warranty = document.getElementById('srvWarranty').value.trim();
        const description = document.getElementById('srvDesc').value.trim();

        try {
          const res = await fetch('/api/services', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${adminToken}`
            },
            body: JSON.stringify({ title, category, icon, priceRange, duration, warranty, description })
          });

          if (res.ok) {
            showAdminToast(`Service "${title}" added`);
            closeDialog('serviceModal');
            srvForm.reset();
            loadServices();
          } else {
            showAdminToast('Failed to add service', 'error');
          }
        } catch (err) {
          showAdminToast('Error adding service', 'error');
        }
      });
    }

    // 4. Store Settings Form
    const settingsForm = document.getElementById('storeSettingsForm');
    if (settingsForm) {
      settingsForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const announcement = document.getElementById('setAnnouncement').value.trim();
        const phone = document.getElementById('setPhone').value.trim();
        const alternatePhone = document.getElementById('setAltPhone').value.trim();
        const address = document.getElementById('setAddress').value.trim();
        const landmark = document.getElementById('setLandmark').value.trim();
        const weekdays = document.getElementById('setHoursWeekdays').value.trim();
        const sunday = document.getElementById('setHoursSunday').value.trim();

        try {
          const res = await fetch('/api/settings', {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${adminToken}`
            },
            body: JSON.stringify({
              announcement,
              phone,
              alternatePhone,
              address,
              landmark,
              hours: { weekdays, sunday }
            })
          });

          if (res.ok) {
            showAdminToast('Store settings saved successfully!');
          } else {
            showAdminToast('Failed to save settings', 'error');
          }
        } catch (err) {
          showAdminToast('Error saving settings', 'error');
        }
      });
    }
  }

  // --- DIALOG MODALS & LIGHT DISMISS ---
  function initDialogHandlers() {
    document.querySelectorAll('[data-close-dialog]').forEach(btn => {
      btn.addEventListener('click', () => {
        const targetId = btn.getAttribute('data-close-dialog');
        closeDialog(targetId);
      });
    });

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

  function openDialog(id) {
    const dialog = document.getElementById(id);
    if (dialog && typeof dialog.showModal === 'function') {
      dialog.showModal();
    }
  }

  function closeDialog(id) {
    const dialog = document.getElementById(id);
    if (dialog && typeof dialog.close === 'function') {
      dialog.close();
    }
  }

  // --- TOAST HELPER ---
  function showAdminToast(message, type = 'info') {
    const container = document.getElementById('adminToastContainer');
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
});

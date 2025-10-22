document.addEventListener('DOMContentLoaded', function() {
    // Tab content mapping
    const tabContent = {
        'dashboard': 'dashboard.html',
        'user-production': 'user-production.html',
        'maintenance': 'maintenance.html',
        'engineering-store': 'engineering-store.html'
    };

    // Load default tab (dashboard)
    loadTabContent('dashboard');
    
    // Initialize dashboard if on dashboard tab
    if (document.getElementById('dashboard-content')) {
        initializeDashboard();
    }

    // Tab click handlers
    document.querySelectorAll('[data-bs-toggle="pill"]').forEach(tab => {
        tab.addEventListener('shown.bs.tab', function(e) {
            const targetId = e.target.getAttribute('data-bs-target').substring(1);
            loadTabContent(targetId);
        });
    });

    // Function to load tab content
    function loadTabContent(tabId) {
        const contentDiv = document.getElementById(tabId + '-content');
        if (!contentDiv) return;
        
        const tabContent = {
            'dashboard': 'dashboard.html',
            'user-production': 'user-production.html',
            'maintenance': 'maintenance.html',
            'engineering-store': 'engineering-store.html'
        };
        
        const fileName = tabContent[tabId];
        if (!fileName) return;
        
        fetch(fileName)
            .then(response => response.text())
            .then(html => {
                contentDiv.innerHTML = html;
                
                // Initialize specific functionality based on tab
            switch(tabId) {
                case 'dashboard':
                    initializeDashboard();
                    break;
                case 'user-production':
                    initializeUserProduction();
                    break;
                case 'maintenance':
                    initializeMaintenance();
                    break;
                case 'engineering-store':
                    initializeEngineeringStore();
                    break;
            }
            })
            .catch(error => {
                console.error('Error loading tab content:', error);
                contentDiv.innerHTML = '<div class="alert alert-danger">Error loading content</div>';
            });
    }

    // Initialize features for loaded content
    function initializeTabFeatures() {
        // Button click animations
        document.querySelectorAll('.btn').forEach(button => {
            button.addEventListener('click', function() {
                this.style.transform = 'scale(0.95)';
                setTimeout(() => {
                    this.style.transform = 'scale(1)';
                }, 150);
            });
        });

        // Card hover effects
        document.querySelectorAll('.card').forEach(card => {
            card.addEventListener('mouseenter', function() {
                this.style.transform = 'translateY(-2px)';
            });
            
            card.addEventListener('mouseleave', function() {
                this.style.transform = 'translateY(0)';
            });
        });

        // Search input focus effects
        document.querySelectorAll('input[type="text"]').forEach(input => {
            input.addEventListener('focus', function() {
                this.parentElement.style.boxShadow = '0 0 0 0.2rem rgba(78, 115, 223, 0.25)';
            });
            
            input.addEventListener('blur', function() {
                this.parentElement.style.boxShadow = 'none';
            });
        });

        // Initialize tooltips if Bootstrap is loaded
        if (typeof bootstrap !== 'undefined') {
            var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
            var tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
                return new bootstrap.Tooltip(tooltipTriggerEl);
            });
        }
    }

    // Global functions for button actions
    window.showAlert = function(message, type = 'info') {
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
        alertDiv.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        
        document.body.insertBefore(alertDiv, document.body.firstChild);
        
        setTimeout(() => {
            alertDiv.remove();
        }, 5000);
    };

    // Example button handlers
    document.addEventListener('click', function(e) {
        if (e.target.closest('.btn')) {
            const button = e.target.closest('.btn');
            const buttonText = button.textContent.trim();
            
            // Add specific handlers based on button content
            if (buttonText.includes('Add User')) {
                showAlert('Add User functionality would be implemented here', 'info');
            } else if (buttonText.includes('Run Maintenance')) {
                showAlert('Maintenance task started', 'success');
            } else if (buttonText.includes('Add to Cart')) {
                showAlert('Item added to cart', 'success');
            }
        }
    });
});

// Dashboard Functions
function initializeDashboard() {
    updateDashboardStats();
    loadRecentActivities();
    createPBKChart();
    
    // Auto refresh every 5 minutes
    setInterval(updateDashboardStats, 300000);
}

function updateDashboardStats() {
    // Get PBK data from localStorage
    const pbkHistory = JSON.parse(localStorage.getItem('pbkHistory') || '[]');
    const maintenancePBKs = JSON.parse(localStorage.getItem('maintenancePBKs') || '[]');
    const inventoryItems = JSON.parse(localStorage.getItem('inventoryItems') || '[]');
    const sparePartRequests = JSON.parse(localStorage.getItem('sparePartRequests') || '[]');
    
    // Update stats
    const pendingPBK = maintenancePBKs.filter(pbk => pbk.status === 'Pending').length;
    const activeMaintenance = maintenancePBKs.filter(pbk => pbk.status === 'In Progress').length;
    const lowStockItems = inventoryItems.filter(item => item.stock <= item.minStock).length;
    const pendingRequests = sparePartRequests.filter(req => req.status === 'Pending').length;
    
    // Update DOM dengan error handling
    const pendingElement = document.getElementById('dashboardPendingPBK');
    const activeElement = document.getElementById('dashboardActiveMaintenance');
    const lowStockElement = document.getElementById('dashboardLowStock');
    const requestsElement = document.getElementById('dashboardSpareRequests');
    
    if (pendingElement) pendingElement.textContent = pendingPBK;
    if (activeElement) activeElement.textContent = activeMaintenance;
    if (lowStockElement) lowStockElement.textContent = lowStockItems;
    if (requestsElement) requestsElement.textContent = pendingRequests;
}

function loadRecentActivities() {
    const activities = [];
    
    // Get recent PBK submissions
    const pbkHistory = JSON.parse(localStorage.getItem('pbkHistory') || '[]');
    pbkHistory.slice(-5).forEach(pbk => {
        activities.push({
            icon: 'fas fa-exclamation-triangle text-danger',
            text: `PBK submitted for ${pbk.line}`,
            time: formatTimeAgo(pbk.submittedAt)
        });
    });
    
    // Get recent spare part requests
    const sparePartRequests = JSON.parse(localStorage.getItem('sparePartRequests') || '[]');
    sparePartRequests.slice(-3).forEach(req => {
        activities.push({
            icon: 'fas fa-clipboard-list text-info',
            text: `Spare part requested: ${req.itemName}`,
            time: formatTimeAgo(req.requestDate)
        });
    });
    
    // Sort by time and take latest 8
    activities.sort((a, b) => new Date(b.time) - new Date(a.time));
    
    const activitiesList = document.getElementById('recentActivitiesList');
    if (activitiesList) {
        activitiesList.innerHTML = activities.slice(0, 8).map(activity => `
            <div class="list-group-item d-flex justify-content-between align-items-center">
                <div>
                    <i class="${activity.icon} me-2"></i>
                    ${activity.text}
                    <small class="text-muted d-block">${activity.time}</small>
                </div>
            </div>
        `).join('');
    }
}

function createPBKChart() {
    const ctx = document.getElementById('pbkStatusChart');
    if (!ctx) return;
    
    const maintenancePBKs = JSON.parse(localStorage.getItem('maintenancePBKs') || '[]');
    
    const statusCounts = {
        'Pending': maintenancePBKs.filter(pbk => pbk.status === 'Pending').length,
        'In Progress': maintenancePBKs.filter(pbk => pbk.status === 'In Progress').length,
        'Completed': maintenancePBKs.filter(pbk => pbk.status === 'Completed').length,
        'Rejected': maintenancePBKs.filter(pbk => pbk.status === 'Rejected').length
    };
    
    // Check if Chart.js is available
    if (typeof Chart !== 'undefined') {
        new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: Object.keys(statusCounts),
                datasets: [{
                    data: Object.values(statusCounts),
                    backgroundColor: ['#f6c23e', '#36b9cc', '#1cc88a', '#e74a3b']
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    }
}

function refreshDashboard() {
    updateDashboardStats();
    loadRecentActivities();
    showNotification('Dashboard refreshed successfully!', 'success');
}

function formatTimeAgo(dateString) {
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minutes ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    return `${diffDays} days ago`;
}

// PBK History Management - Mulai dengan array kosong
let pbkHistory = [];

// User Production Tab Functions
function switchToFormTab() {
    const formTab = document.getElementById('form-pbk-tab');
    const formTabPane = document.getElementById('form-pbk');
    const historyTab = document.getElementById('history-pbk-tab');
    const historyTabPane = document.getElementById('history-pbk');
    
    // Switch active tab
    formTab.classList.add('active');
    historyTab.classList.remove('active');
    
    // Switch active tab pane
    formTabPane.classList.add('show', 'active');
    historyTabPane.classList.remove('show', 'active');
    
    // Update aria-selected
    formTab.setAttribute('aria-selected', 'true');
    historyTab.setAttribute('aria-selected', 'false');
}

function switchToHistoryTab() {
    const formTab = document.getElementById('form-pbk-tab');
    const formTabPane = document.getElementById('form-pbk');
    const historyTab = document.getElementById('history-pbk-tab');
    const historyTabPane = document.getElementById('history-pbk');
    
    // Switch active tab
    historyTab.classList.add('active');
    formTab.classList.remove('active');
    
    // Switch active tab pane
    historyTabPane.classList.add('show', 'active');
    formTabPane.classList.remove('show', 'active');
    
    // Update aria-selected
    historyTab.setAttribute('aria-selected', 'true');
    formTab.setAttribute('aria-selected', 'false');
    
    // Refresh history data
    updatePBKHistoryTable();
    updatePBKStatistics();
}

function updatePBKStatistics() {
    const pbkHistory = JSON.parse(localStorage.getItem('pbkHistory') || '[]');
    const maintenancePBKs = JSON.parse(localStorage.getItem('maintenancePBKs') || '[]');
    
    // Count statistics
    const totalCount = pbkHistory.length;
    const pendingCount = maintenancePBKs.filter(pbk => pbk.status === 'Pending').length;
    const progressCount = maintenancePBKs.filter(pbk => pbk.status === 'In Progress').length;
    const completedCount = maintenancePBKs.filter(pbk => pbk.status === 'Completed').length;
    
    // Update DOM
    const totalElement = document.getElementById('totalPBKCount');
    const pendingElement = document.getElementById('pendingPBKCount');
    const progressElement = document.getElementById('progressPBKCount');
    const completedElement = document.getElementById('completedPBKCount');
    
    if (totalElement) totalElement.textContent = totalCount;
    if (pendingElement) pendingElement.textContent = pendingCount;
    if (progressElement) progressElement.textContent = progressCount;
    if (completedElement) completedElement.textContent = completedCount;
}

function refreshPBKHistory() {
    loadPBKHistory();
    if (typeof showNotification === 'function') {
        showNotification('History PBK berhasil direfresh!', 'success');
    } else {
        Swal.fire('Success', 'History PBK berhasil direfresh!', 'success');
    }
}

// PBK Form Handler
document.addEventListener('DOMContentLoaded', function() {
    const pbkForm = document.getElementById('pbkForm');
    
    if (pbkForm) {
        // Set default date to today
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('tanggal').value = today;
        
        // Set default time to current time
        const now = new Date();
        const currentTime = now.getHours().toString().padStart(2, '0') + ':' + 
                           now.getMinutes().toString().padStart(2, '0');
        document.getElementById('jam').value = currentTime;
        
        // Set default datetime for 'when' field
        const currentDateTime = now.toISOString().slice(0, 16);
        document.getElementById('when').value = currentDateTime;
        
        // Auto-fill 'who' field with current user
        document.getElementById('who').value = 'User Production';
        
        // Delegasikan ke handler terpusat untuk mencegah duplikasi
        initializeUserProduction();
        
        // Load PBK history when page loads
        loadPBKHistory();
    }
    
    // Tab click handlers for user production
    const formTab = document.getElementById('form-pbk-tab');
    const historyTab = document.getElementById('history-pbk-tab');
    
    if (formTab) {
        formTab.addEventListener('click', function() {
            switchToFormTab();
        });
    }
    
    if (historyTab) {
        historyTab.addEventListener('click', function() {
            switchToHistoryTab();
        });
    }
    
    // Initialize history table
    updatePBKHistoryTable();
    
    // Initialize statistics on page load
    updatePBKStatistics();
    
    // Search functionality
    const searchPBK = document.getElementById('searchPBK');
    if (searchPBK) {
        searchPBK.addEventListener('input', function() {
            filterPBKHistory(this.value);
        });
    }
});

// Add function to load PBK history from database
function loadPBKHistory() {
    fetch('get_pbk_history.php')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                pbkHistory = data.data;
                updatePBKHistoryTable();
                updatePBKStatisticsFromData(data.statistics);
            } else {
                console.error('Failed to load PBK history:', data.message);
            }
        })
        .catch(error => {
            console.error('Error loading PBK history:', error);
        });
}

// Add function to update statistics from database
function updatePBKStatisticsFromData(stats) {
    if (document.getElementById('totalPBKCount')) {
        document.getElementById('totalPBKCount').textContent = stats.total || 0;
    }
    if (document.getElementById('pendingPBKCount')) {
        document.getElementById('pendingPBKCount').textContent = stats.pending || 0;
    }
    if (document.getElementById('progressPBKCount')) {
        document.getElementById('progressPBKCount').textContent = stats.in_progress || 0;
    }
    if (document.getElementById('completedPBKCount')) {
        document.getElementById('completedPBKCount').textContent = stats.completed || 0;
    }
}

// Update PBK History Table
function updatePBKHistoryTable() {
    const tbody = document.getElementById('pbkHistoryBody');
    const emptyState = document.getElementById('emptyState');
    const historyTable = document.getElementById('historyTable');
    const paginationNav = document.getElementById('paginationNav');
    
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    if (pbkHistory.length === 0) {
        // Show empty state
        emptyState.style.display = 'block';
        historyTable.style.display = 'none';
        paginationNav.style.display = 'none';
    } else {
        // Show table with data
        emptyState.style.display = 'none';
        historyTable.style.display = 'block';
        paginationNav.style.display = 'block';
        
        pbkHistory.forEach(pbk => {
            const row = createPBKHistoryRow(pbk);
            tbody.appendChild(row);
        });
    }
}

// Create PBK History Row
function createPBKHistoryRow(pbk) {
    const row = document.createElement('tr');
    
    const statusBadge = getStatusBadge(pbk.status);
    const priorityBadge = getPriorityBadge(pbk.pengajuan);
    
    row.innerHTML = `
        <td><strong>${pbk.ticketId}</strong></td>
        <td>${pbk.timestamp}</td>
        <td>${pbk.line}</td>
        <td>${pbk.mesin}</td>
        <td>${pbk.tipeKerusakan}</td>
        <td>${priorityBadge}</td>
        <td>${statusBadge}</td>
        <td>
            <button class="btn btn-sm btn-info me-1" onclick="viewPBKDetail('${pbk.ticketId}')">
                <i class="fas fa-eye"></i>
            </button>
            <button class="btn btn-sm btn-secondary" onclick="printPBK('${pbk.ticketId}')">
                <i class="fas fa-print"></i>
            </button>
        </td>
    `;
    
    return row;
}

// Get Status Badge
function getStatusBadge(status) {
    const badges = {
        'Pending': '<span class="badge bg-warning">Pending</span>',
        'In Progress': '<span class="badge bg-info">In Progress</span>',
        'Completed': '<span class="badge bg-success">Completed</span>',
        'Rejected': '<span class="badge bg-danger">Rejected</span>'
    };
    return badges[status] || '<span class="badge bg-secondary">Unknown</span>';
}

// Get Priority Badge
function getPriorityBadge(priority) {
    const badges = {
        'Emergency': '<span class="badge bg-danger">Emergency</span>',
        'Urgent': '<span class="badge bg-warning">Urgent</span>',
        'Normal': '<span class="badge bg-primary">Normal</span>',
        'Scheduled': '<span class="badge bg-info">Scheduled</span>'
    };
    return badges[priority] || '<span class="badge bg-secondary">Unknown</span>';
}

// View PBK Detail
function viewPBKDetail(ticketId) {
    const pbk = pbkHistory.find(p => p.ticketId === ticketId);
    if (!pbk) return;
    
    const modalContent = document.getElementById('pbkDetailContent');
    modalContent.innerHTML = `
        <div class="row">
            <div class="col-md-6">
                <h6>Informasi Dasar</h6>
                <table class="table table-sm">
                    <tr><td><strong>Ticket ID:</strong></td><td>${pbk.ticketId}</td></tr>
                    <tr><td><strong>Tanggal Submit:</strong></td><td>${pbk.timestamp}</td></tr>
                    <tr><td><strong>Line:</strong></td><td>${pbk.line}</td></tr>
                    <tr><td><strong>Mesin:</strong></td><td>${pbk.mesin}</td></tr>
                    <tr><td><strong>Unit:</strong></td><td>${pbk.unit}</td></tr>
                    <tr><td><strong>Tanggal:</strong></td><td>${pbk.tanggal}</td></tr>
                    <tr><td><strong>Shift:</strong></td><td>${pbk.shift}</td></tr>
                    <tr><td><strong>Jam:</strong></td><td>${pbk.jam}</td></tr>
                </table>
            </div>
            <div class="col-md-6">
                <h6>Detail Kerusakan</h6>
                <table class="table table-sm">
                    <tr><td><strong>Tipe Kerusakan:</strong></td><td>${pbk.tipeKerusakan}</td></tr>
                    <tr><td><strong>Prioritas:</strong></td><td>${getPriorityBadge(pbk.pengajuan)}</td></tr>
                    <tr><td><strong>Status:</strong></td><td>${getStatusBadge(pbk.status)}</td></tr>
                    <tr><td><strong>What:</strong></td><td>${pbk.what}</td></tr>
                    <tr><td><strong>When:</strong></td><td>${pbk.when}</td></tr>
                    <tr><td><strong>Where:</strong></td><td>${pbk.where}</td></tr>
                    <tr><td><strong>Who:</strong></td><td>${pbk.who}</td></tr>
                    <tr><td><strong>Which:</strong></td><td>${pbk.which}</td></tr>
                    <tr><td><strong>How:</strong></td><td>${pbk.how}</td></tr>
                </table>
            </div>
        </div>
        <div class="row mt-3">
            <div class="col-12">
                <h6>Deskripsi Problem</h6>
                <p class="border p-2">${pbk.deskripsiProblem}</p>
                <h6>Deskripsi Penanganan</h6>
                <p class="border p-2">${pbk.deskripsiPenanganan || 'Tidak ada penanganan yang dilakukan'}</p>
            </div>
        </div>
    `;
    
    const modal = new bootstrap.Modal(document.getElementById('pbkDetailModal'));
    modal.show();
}

// Print PBK
function printPBK(ticketId) {
    const pbk = pbkHistory.find(p => p.ticketId === ticketId);
    if (!pbk) return;
    
    // Create print content
    const printContent = `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
            <h2 style="text-align: center; margin-bottom: 30px;">PERMINTAAN BANTUAN KERUSAKAN (PBK)</h2>
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
                <tr><td style="border: 1px solid #ddd; padding: 8px;"><strong>Ticket ID:</strong></td><td style="border: 1px solid #ddd; padding: 8px;">${pbk.ticketId}</td></tr>
                <tr><td style="border: 1px solid #ddd; padding: 8px;"><strong>Tanggal Submit:</strong></td><td style="border: 1px solid #ddd; padding: 8px;">${pbk.timestamp}</td></tr>
                <tr><td style="border: 1px solid #ddd; padding: 8px;"><strong>Line:</strong></td><td style="border: 1px solid #ddd; padding: 8px;">${pbk.line}</td></tr>
                <tr><td style="border: 1px solid #ddd; padding: 8px;"><strong>Mesin:</strong></td><td style="border: 1px solid #ddd; padding: 8px;">${pbk.mesin}</td></tr>
                <tr><td style="border: 1px solid #ddd; padding: 8px;"><strong>Unit:</strong></td><td style="border: 1px solid #ddd; padding: 8px;">${pbk.unit}</td></tr>
                <tr><td style="border: 1px solid #ddd; padding: 8px;"><strong>Tipe Kerusakan:</strong></td><td style="border: 1px solid #ddd; padding: 8px;">${pbk.tipeKerusakan}</td></tr>
                <tr><td style="border: 1px solid #ddd; padding: 8px;"><strong>Prioritas:</strong></td><td style="border: 1px solid #ddd; padding: 8px;">${pbk.pengajuan}</td></tr>
                <tr><td style="border: 1px solid #ddd; padding: 8px;"><strong>Deskripsi Problem:</strong></td><td style="border: 1px solid #ddd; padding: 8px;">${pbk.deskripsiProblem}</td></tr>
            </table>
        </div>
    `;
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.print();
}

// Filter PBK History
function filterPBKHistory(searchTerm) {
    const tbody = document.getElementById('pbkHistoryBody');
    if (!tbody || pbkHistory.length === 0) return;
    
    const filteredHistory = pbkHistory.filter(pbk => 
        pbk.ticketId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pbk.line.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pbk.mesin.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pbk.tipeKerusakan.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pbk.status.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    tbody.innerHTML = '';
    filteredHistory.forEach(pbk => {
        const row = createPBKHistoryRow(pbk);
        tbody.appendChild(row);
    });
}

// Global variables for maintenance
let currentPBKForAction = null;
let maintenancePBKList = [];

// Maintenance Management Functions
document.addEventListener('DOMContentLoaded', function() {
    // Initialize maintenance if on maintenance page
    if (document.getElementById('maintenancePBKTable')) {
        initializeMaintenance();
        
        // Setup filters
        setupMaintenanceFilters();
        
        // Setup search
        const searchMaintenance = document.getElementById('searchMaintenancePBK');
        if (searchMaintenance) {
            searchMaintenance.addEventListener('input', function() {
                filterMaintenancePBK(this.value);
            });
        }
    }
});

// Initialize Maintenance Page
function initializeMaintenance() {
    // Load from API to ensure fresh data independent of User Production page
    loadMaintenancePBKFromAPI();
}

// Sync PBK from User Production
function syncPBKFromUserProduction() {
    // In a real application, this would fetch from a shared database
    // For now, we'll simulate by checking if pbkHistory exists
    if (typeof pbkHistory !== 'undefined' && pbkHistory.length > 0) {
        maintenancePBKList = [...pbkHistory];
    }
}

// Load PBK data for Maintenance directly from API and map to UI shape
function loadMaintenancePBKFromAPI() {
    fetch('api/get_pbk_requests.php')
        .then(r => r.json())
        .then(data => {
            if (data.success && Array.isArray(data.data)) {
                maintenancePBKList = data.data.map(p => ({
                    pbkId: p.id,
                    ticketId: p.pbk_number,
                    timestamp: p.request_date,
                    line: p.line_name,
                    mesin: p.machine_name,
                    tipeKerusakan: p.damage_type,
                    pengajuan: p.submission_type || p.priority || 'Normal',
                    status: p.status,
                    who: (p.who_reported && p.who_reported.trim()) ? p.who_reported : (p.user_name || '-'),
                    deskripsiProblem: p.problem_description || ''
                }));
            } else {
                maintenancePBKList = [];
            }
            updateMaintenancePBKTable();
            updateMaintenanceStatistics();
        })
        .catch(err => {
            console.error('Error loading maintenance PBK:', err);
            maintenancePBKList = [];
            updateMaintenancePBKTable();
            updateMaintenanceStatistics();
        });
}

// Update Maintenance PBK Table
function updateMaintenancePBKTable() {
    const tbody = document.getElementById('maintenancePBKBody');
    const emptyState = document.getElementById('emptyMaintenanceState');
    const maintenanceTable = document.getElementById('maintenanceTable');
    
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    if (maintenancePBKList.length === 0) {
        emptyState.style.display = 'block';
        maintenanceTable.style.display = 'none';
    } else {
        emptyState.style.display = 'none';
        maintenanceTable.style.display = 'block';
        
        maintenancePBKList.forEach(pbk => {
            const row = createMaintenancePBKRow(pbk);
            tbody.appendChild(row);
        });
    }
}

// Create Maintenance PBK Row
function createMaintenancePBKRow(pbk) {
    const row = document.createElement('tr');
    
    const statusBadge = getStatusBadge(pbk.status);
    const priorityBadge = getPriorityBadge(pbk.pengajuan);
    
    // Add row class based on priority
    if (pbk.pengajuan === 'Emergency') {
        row.classList.add('table-danger');
    } else if (pbk.pengajuan === 'Urgent') {
        row.classList.add('table-warning');
    }
    
    row.innerHTML = `
        <td><strong>${pbk.ticketId}</strong></td>
        <td>${pbk.timestamp}</td>
        <td>
            <div><strong>${pbk.line}</strong></div>
            <small class="text-muted">${pbk.mesin}</small>
        </td>
        <td>${pbk.tipeKerusakan}</td>
        <td>${priorityBadge}</td>
        <td>${statusBadge}</td>
        <td>${pbk.who}</td>
        <td>
            <button class="btn btn-sm btn-primary me-1" onclick="viewMaintenancePBKDetail('${pbk.pbkId || pbk.ticketId}')">
                <i class="fas fa-eye"></i>
            </button>
            ${pbk.status === 'Pending' ? `
                <button class="btn btn-sm btn-success me-1" onclick="quickApprovePBK('${pbk.ticketId}')">
                    <i class="fas fa-check"></i>
                </button>
                <button class="btn btn-sm btn-danger" onclick="quickRejectPBK('${pbk.ticketId}')">
                    <i class="fas fa-times"></i>
                </button>
            ` : ''}
        </td>
    `;
    
    return row;
}

// View Maintenance PBK Detail (uses real API data)
function viewMaintenancePBKDetail(pbkId) {
    // Find PBK data from the current loaded data
    fetch('api/get_pbk_requests.php')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                const pbk = data.data.find(p => p.id == pbkId || p.pbk_number == pbkId);
                if (!pbk) {
                    Swal.fire('Error', 'PBK tidak ditemukan', 'error');
                    return;
                }
                
                // Set current PBK for actions
                currentPBKForAction = pbk;
                
                // Check for existing spare part requests for this PBK
                fetch(`api/get_spare_part_requests.php?pbk_id=${pbk.id}`)
                    .then(response => response.json())
                    .then(sparePartData => {
                        let sparePartRequestsHtml = '';
                        let hasActiveRequest = false;
                        
                        if (sparePartData.success && sparePartData.data.length > 0) {
                            hasActiveRequest = sparePartData.data.some(req => 
                                ['Pending', 'Approved', 'Issued'].includes(req.status)
                            );
                            
                            sparePartRequestsHtml = `
                                <div class="row mt-3">
                                    <div class="col-12">
                                        <h6><i class="fas fa-shopping-cart me-2"></i>Spare Part Requests</h6>
                                        <div class="table-responsive">
                                            <table class="table table-sm table-bordered">
                                                <thead class="table-light">
                                                    <tr>
                                                        <th>Request Number</th>
                                                        <th>Item</th>
                                                        <th>Qty</th>
                                                        <th>Urgency</th>
                                                        <th>Status</th>
                                                        <th>Request Date</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    ${sparePartData.data.map(req => `
                                                        <tr>
                                                            <td><strong>${req.request_number}</strong></td>
                                                            <td>${req.item_name || 'N/A'}</td>
                                                            <td>${req.quantity_requested}</td>
                                                            <td><span class="badge bg-${getUrgencyColor(req.urgency)}">${req.urgency}</span></td>
                                                            <td><span class="badge bg-${getStatusColor(req.status)}">${req.status}</span></td>
                                                            <td>${new Date(req.created_at).toLocaleDateString('id-ID')}</td>
                                                        </tr>
                                                    `).join('')}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                            `;
                        }
                        
                        const modalContent = document.getElementById('maintenancePBKContent');
                        modalContent.innerHTML = `
                            <div class="row">
                                <div class="col-md-6">
                                    <h6>Informasi Dasar</h6>
                                    <table class="table table-sm">
                                        <tr><td><strong>PBK Number:</strong></td><td>${pbk.pbk_number}</td></tr>
                                        <tr><td><strong>Tanggal Submit:</strong></td><td>${new Date(pbk.request_date).toLocaleDateString('id-ID')}</td></tr>
                                        <tr><td><strong>Line:</strong></td><td>${pbk.line_name}</td></tr>
                                        <tr><td><strong>Mesin:</strong></td><td>${pbk.machine_name}</td></tr>
                                        <tr><td><strong>Shift:</strong></td><td>${pbk.shift}</td></tr>
                                        <tr><td><strong>Jam:</strong></td><td>${pbk.time_reported}</td></tr>
                                    </table>
                                </div>
                                <div class="col-md-6">
                                    <h6>Detail Kerusakan</h6>
                                    <table class="table table-sm">
                                        <tr><td><strong>Tipe Kerusakan:</strong></td><td>${pbk.damage_type}</td></tr>
                                        <tr><td><strong>Jenis Pengajuan:</strong></td><td>${pbk.submission_type}</td></tr>
                                        <tr><td><strong>Status:</strong></td><td><span class="badge bg-info">${pbk.status}</span></td></tr>
                                        <tr><td><strong>What:</strong></td><td>${(pbk.what_problem && pbk.what_problem.trim()) ? pbk.what_problem : (pbk.problem_description || '-')}</td></tr>
                                        <tr><td><strong>When:</strong></td><td>${pbk.when_occurred || '-'}</td></tr>
                                        <tr><td><strong>Where:</strong></td><td>${(pbk.where_location && pbk.where_location.trim()) ? pbk.where_location : (pbk.line_name || '-')}</td></tr>
                                        <tr><td><strong>Who:</strong></td><td>${(pbk.who_reported && pbk.who_reported.trim()) ? pbk.who_reported : (pbk.user_name || '-')}</td></tr>
                                        <tr><td><strong>Which:</strong></td><td>${(pbk.which_component && pbk.which_component.trim()) ? pbk.which_component : (pbk.machine_name || '-')}</td></tr>
                                        <tr><td><strong>How:</strong></td><td>${pbk.how_happened || '-'}</td></tr>
                                    </table>
                                </div>
                            </div>
                            <div class="row mt-3">
                                <div class="col-12">
                                    <h6>Deskripsi Problem</h6>
                                    <p class="border p-2">${pbk.problem_description}</p>
                                </div>
                            </div>
                            ${sparePartRequestsHtml}
                        `;
                        
                        // Show/hide action buttons based on status and spare part requests
                        const rejectBtn = document.getElementById('rejectPBKBtn');
                        const approveBtn = document.getElementById('approvePBKBtn');
                        const sparePartBtn = document.getElementById('requestSparePartBtn');
                        const completeBtn = document.getElementById('completePBKBtn');
                        
                        if (pbk.status === 'Pending') {
                            rejectBtn.style.display = 'inline-block';
                            approveBtn.style.display = 'inline-block';
                            sparePartBtn.style.display = hasActiveRequest ? 'none' : 'inline-block';
                            if (completeBtn) completeBtn.style.display = 'none';
                        } else {
                            rejectBtn.style.display = 'none';
                            approveBtn.style.display = 'none';
                            sparePartBtn.style.display = (pbk.status === 'In Progress' && !hasActiveRequest) ? 'inline-block' : 'none';
                            if (completeBtn) completeBtn.style.display = (pbk.status === 'In Progress') ? 'inline-block' : 'none';
                        }
                        
                        // Update button text if there are requests
                        if (hasActiveRequest) {
                            sparePartBtn.innerHTML = '<i class="fas fa-check me-2"></i>Spare Part Requested';
                            sparePartBtn.classList.remove('btn-warning');
                            sparePartBtn.classList.add('btn-success');
                        } else {
                            sparePartBtn.innerHTML = '<i class="fas fa-shopping-cart me-2"></i>Request Spare Part';
                            sparePartBtn.classList.remove('btn-success');
                            sparePartBtn.classList.add('btn-warning');
                        }
                        
                        const modal = new bootstrap.Modal(document.getElementById('maintenancePBKModal'));
                        modal.show();
                    })
                    .catch(error => {
                        console.error('Error fetching spare part requests:', error);
                        // Continue showing modal even if spare part request fetch fails
                        const modalContent = document.getElementById('maintenancePBKContent');
                        modalContent.innerHTML = `
                            <div class="row">
                                <div class="col-md-6">
                                    <h6>Informasi Dasar</h6>
                                    <table class="table table-sm">
                                        <tr><td><strong>PBK Number:</strong></td><td>${pbk.pbk_number}</td></tr>
                                        <tr><td><strong>Tanggal Submit:</strong></td><td>${new Date(pbk.request_date).toLocaleDateString('id-ID')}</td></tr>
                                        <tr><td><strong>Line:</strong></td><td>${pbk.line_name}</td></tr>
                                        <tr><td><strong>Mesin:</strong></td><td>${pbk.machine_name}</td></tr>
                                        <tr><td><strong>Shift:</strong></td><td>${pbk.shift}</td></tr>
                                        <tr><td><strong>Jam:</strong></td><td>${pbk.time_reported}</td></tr>
                                    </table>
                                </div>
                                <div class="col-md-6">
                                    <h6>Detail Kerusakan</h6>
                                    <table class="table table-sm">
                                        <tr><td><strong>Tipe Kerusakan:</strong></td><td>${pbk.damage_type}</td></tr>
                                        <tr><td><strong>Jenis Pengajuan:</strong></td><td>${pbk.submission_type}</td></tr>
                                        <tr><td><strong>Status:</strong></td><td><span class="badge bg-info">${pbk.status}</span></td></tr>
                                        <tr><td><strong>What:</strong></td><td>${(pbk.what_problem && pbk.what_problem.trim()) ? pbk.what_problem : (pbk.problem_description || '-')}</td></tr>
                                        <tr><td><strong>When:</strong></td><td>${pbk.when_occurred || '-'}</td></tr>
                                        <tr><td><strong>Where:</strong></td><td>${(pbk.where_location && pbk.where_location.trim()) ? pbk.where_location : (pbk.line_name || '-')}</td></tr>
                                        <tr><td><strong>Who:</strong></td><td>${(pbk.who_reported && pbk.who_reported.trim()) ? pbk.who_reported : (pbk.user_name || '-')}</td></tr>
                                        <tr><td><strong>Which:</strong></td><td>${(pbk.which_component && pbk.which_component.trim()) ? pbk.which_component : (pbk.machine_name || '-')}</td></tr>
                                        <tr><td><strong>How:</strong></td><td>${pbk.how_happened || '-'}</td></tr>
                                    </table>
                                </div>
                            </div>
                            <div class="row mt-3">
                                <div class="col-12">
                                    <h6>Deskripsi Problem</h6>
                                    <p class="border p-2">${pbk.problem_description}</p>
                                </div>
                            </div>
                        `;
                        
                        const modal = new bootstrap.Modal(document.getElementById('maintenancePBKModal'));
                        modal.show();
                    });
            }
        })
        .catch(error => {
            console.error('Error fetching PBK detail:', error);
            Swal.fire('Error', 'Gagal memuat detail PBK', 'error');
        });
}

// Helper functions for badge colors
function getUrgencyColor(urgency) {
    const colors = {
        'Critical': 'danger',
        'High': 'warning', 
        'Medium': 'info',
        'Low': 'secondary'
    };
    return colors[urgency] || 'secondary';
}

function getStatusColor(status) {
    const colors = {
        'Pending': 'warning',
        'Approved': 'success',
        'Rejected': 'danger',
        'Issued': 'info',
        'Completed': 'primary'
    };
    return colors[status] || 'secondary';
}

// Quick Approve PBK
function quickApprovePBK(ticketId) {
    const pbk = maintenancePBKList.find(p => p.ticketId === ticketId);
    if (!pbk) return;
    
    Swal.fire({
        title: 'Approve PBK?',
        text: `Apakah Anda yakin ingin menyetujui PBK ${ticketId}?`,
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#28a745',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Ya, Approve',
        cancelButtonText: 'Cancel'
    }).then((result) => {
        if (result.isConfirmed) {
            pbk.status = 'In Progress';
            pbk.approvedBy = 'Maintenance Team';
            pbk.approvedAt = new Date().toLocaleString('id-ID');
            
            updateMaintenancePBKTable();
            updateMaintenanceStatistics();
            
            Swal.fire('Approved!', 'PBK telah disetujui dan dimulai.', 'success');
        }
    });
}

// Quick Reject PBK
function quickRejectPBK(ticketId) {
    const pbk = maintenancePBKList.find(p => p.ticketId === ticketId);
    if (!pbk) return;
    
    currentPBKForAction = pbk;
    const modal = new bootstrap.Modal(document.getElementById('rejectReasonModal'));
    modal.show();
}

// Approve PBK (from modal)
function approvePBK() {
    if (!currentPBKForAction) {
        Swal.fire('Error', 'Tidak ada PBK yang dipilih', 'error');
        return;
    }
    
    Swal.fire({
        title: 'Approve PBK?',
        text: 'Apakah Anda yakin ingin menyetujui dan memulai pekerjaan untuk PBK ini?',
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#28a745',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Ya, Approve!',
        cancelButtonText: 'Batal'
    }).then((result) => {
        if (result.isConfirmed) {
            // Show loading
            Swal.fire({
                title: 'Processing...',
                text: 'Sedang memproses PBK...',
                allowOutsideClick: false,
                didOpen: () => {
                    Swal.showLoading();
                }
            });
            
            // Make API call to update PBK status
            fetch('api/update_pbk_status.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    pbk_id: currentPBKForAction.id,
                    status: 'In Progress',
                    action_type: 'approve'
                })
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    Swal.fire({
                        icon: 'success',
                        title: 'PBK Disetujui!',
                        text: `PBK ${currentPBKForAction.pbk_number} berhasil disetujui dan pekerjaan dimulai`,
                        timer: 2000,
                        showConfirmButton: false
                    });
                    
                    // Close modal and refresh
                    const modal = bootstrap.Modal.getInstance(document.getElementById('maintenancePBKModal'));
                    if (modal) modal.hide();
                    
                    // Reset current PBK
                    currentPBKForAction = null;
                    
                    // Refresh list
                    refreshPBKList();
                } else {
                    Swal.fire({
                        icon: 'error',
                        title: 'Error!',
                        text: data.message || 'Gagal memproses PBK'
                    });
                }
            })
            .catch(error => {
                console.error('Error:', error);
                Swal.fire({
                    icon: 'error',
                    title: 'Error!',
                    text: 'Terjadi kesalahan saat memproses PBK'
                });
            });
        }
    });
}

// Reject PBK (show reason modal)
function rejectPBK() {
    const modal = new bootstrap.Modal(document.getElementById('rejectReasonModal'));
    modal.show();
}

// Confirm Reject PBK
function confirmRejectPBK() {
    const reason = document.getElementById('rejectReason').value;
    const category = document.getElementById('rejectCategory').value;
    
    if (!reason.trim()) {
        Swal.fire('Error', 'Alasan penolakan harus diisi!', 'error');
        return;
    }
    
    if (!currentPBKForAction) return;
    
    currentPBKForAction.status = 'Rejected';
    currentPBKForAction.rejectedBy = 'Maintenance Team';
    currentPBKForAction.rejectedAt = new Date().toLocaleString('id-ID');
    currentPBKForAction.rejectReason = reason;
    currentPBKForAction.rejectCategory = category;
    
    updateMaintenancePBKTable();
    updateMaintenanceStatistics();
    
    // Close modals
    const rejectModal = bootstrap.Modal.getInstance(document.getElementById('rejectReasonModal'));
    const mainModal = bootstrap.Modal.getInstance(document.getElementById('maintenancePBKModal'));
    
    rejectModal.hide();
    if (mainModal) mainModal.hide();
    
    // Reset form
    document.getElementById('rejectForm').reset();
    
    Swal.fire('Rejected!', 'PBK telah ditolak dengan alasan yang diberikan.', 'info');
}

// Request Spare Part
function requestSparePart() {
    if (!currentPBKForAction) return;
    
    // Pre-fill some information
    document.getElementById('justification').value = `Spare part dibutuhkan untuk menyelesaikan PBK ${currentPBKForAction.ticketId} - ${currentPBKForAction.deskripsiProblem}`;
    
    const modal = new bootstrap.Modal(document.getElementById('sparePartModal'));
    modal.show();
}

// Submit Spare Part Request
function submitSparePartRequest() {
    const form = document.getElementById('sparePartForm');
    const formData = new FormData(form);
    
    // Validate required fields
    const partName = formData.get('partName');
    const quantity = formData.get('quantity');
    const urgency = formData.get('urgency');
    const justification = formData.get('justification');
    
    if (!partName || !quantity || !urgency || !justification) {
        Swal.fire('Error', 'Semua field yang wajib harus diisi!', 'error');
        return;
    }
    
    // Create spare part request
    const sparePartRequest = {
        requestId: 'SPR-' + Date.now(),
        pbkTicketId: currentPBKForAction.ticketId,
        partName: partName,
        partCode: formData.get('partCode'),
        quantity: parseInt(quantity),
        urgency: urgency,
        description: formData.get('partDescription'),
        justification: justification,
        requestedBy: 'Maintenance Team',
        requestedAt: new Date().toLocaleString('id-ID'),
        status: 'Pending'
    };
    
    // In a real application, this would be sent to engineering store
    console.log('Spare Part Request:', sparePartRequest);
    
    // Close modal
    const modal = bootstrap.Modal.getInstance(document.getElementById('sparePartModal'));
    modal.hide();
    
    // Reset form
    form.reset();
    
    Swal.fire({
        title: 'Request Sent!',
        text: `Request spare part telah dikirim ke Engineering Store dengan ID: ${sparePartRequest.requestId}`,
        icon: 'success',
        confirmButtonText: 'OK'
    });
}

// Update Maintenance Statistics
function updateMaintenanceStatistics() {
    const pendingCount = maintenancePBKList.filter(p => p.status === 'Pending').length;
    const progressCount = maintenancePBKList.filter(p => p.status === 'In Progress').length;
    const completedCount = maintenancePBKList.filter(p => p.status === 'Completed').length;
    const rejectedCount = maintenancePBKList.filter(p => p.status === 'Rejected').length;
    
    document.getElementById('pendingCount').textContent = pendingCount;
    document.getElementById('progressCount').textContent = progressCount;
    document.getElementById('completedCount').textContent = completedCount;
    document.getElementById('rejectedCount').textContent = rejectedCount;
}

// Setup Maintenance Filters
function setupMaintenanceFilters() {
    const statusFilter = document.getElementById('statusFilter');
    const priorityFilter = document.getElementById('priorityFilter');
    const lineFilter = document.getElementById('lineFilter');
    
    [statusFilter, priorityFilter, lineFilter].forEach(filter => {
        if (filter) {
            filter.addEventListener('change', applyMaintenanceFilters);
        }
    });
}

// Apply Maintenance Filters
function applyMaintenanceFilters() {
    const statusFilter = document.getElementById('statusFilter').value;
    const priorityFilter = document.getElementById('priorityFilter').value;
    const lineFilter = document.getElementById('lineFilter').value;
    
    let filteredList = maintenancePBKList;
    
    if (statusFilter) {
        filteredList = filteredList.filter(p => p.status === statusFilter);
    }
    
    if (priorityFilter) {
        filteredList = filteredList.filter(p => p.pengajuan === priorityFilter);
    }
    
    if (lineFilter) {
        filteredList = filteredList.filter(p => p.line === lineFilter);
    }
    
    displayFilteredMaintenancePBK(filteredList);
}

// Display Filtered Maintenance PBK
function displayFilteredMaintenancePBK(filteredList) {
    const tbody = document.getElementById('maintenancePBKBody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    filteredList.forEach(pbk => {
        const row = createMaintenancePBKRow(pbk);
        tbody.appendChild(row);
    });
}

// Filter Maintenance PBK (search)
function filterMaintenancePBK(searchTerm) {
    if (!searchTerm) {
        updateMaintenancePBKTable();
        return;
    }
    
    const filteredList = maintenancePBKList.filter(pbk => 
        pbk.ticketId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pbk.line.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pbk.mesin.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pbk.tipeKerusakan.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pbk.who.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pbk.deskripsiProblem.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    displayFilteredMaintenancePBK(filteredList);
}

// Accept PBK function for maintenance
function acceptPBK(pbkId) {
    Swal.fire({
        title: 'Accept PBK?',
        text: 'Apakah Anda yakin ingin menerima dan memulai pekerjaan untuk PBK ini?',
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#28a745',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Ya, Accept!',
        cancelButtonText: 'Batal'
    }).then((result) => {
        if (result.isConfirmed) {
            // Show loading
            Swal.fire({
                title: 'Processing...',
                text: 'Sedang memproses PBK...',
                allowOutsideClick: false,
                didOpen: () => {
                    Swal.showLoading();
                }
            });
            
            // Make API call to update PBK status
            fetch('api/update_pbk_status.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    pbk_id: pbkId,
                    status: 'In Progress',
                    action_type: 'accept'
                })
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    Swal.fire({
                        icon: 'success',
                        title: 'PBK Diterima!',
                        text: 'PBK berhasil diterima dan pekerjaan dimulai',
                        timer: 2000,
                        showConfirmButton: false
                    });
                    
                    // Refresh the PBK list
                    refreshPBKList();
                } else {
                    Swal.fire({
                        icon: 'error',
                        title: 'Error!',
                        text: data.message || 'Gagal memproses PBK'
                    });
                }
            })
            .catch(error => {
                console.error('Error:', error);
                Swal.fire({
                    icon: 'error',
                    title: 'Error!',
                    text: 'Terjadi kesalahan saat memproses PBK'
                });
            });
        }
    });
}

// Refresh PBK List
function refreshPBKList() {
    syncPBKFromUserProduction();
    updateMaintenancePBKTable();
    updateMaintenanceStatistics();
    
    // Reset filters
    document.getElementById('statusFilter').value = '';
    document.getElementById('priorityFilter').value = '';
    document.getElementById('lineFilter').value = '';
    document.getElementById('searchMaintenancePBK').value = '';
    
    Swal.fire({
        title: 'Refreshed!',
        text: 'Data PBK telah diperbarui.',
        icon: 'success',
        timer: 1500,
        showConfirmButton: false
    });
}

// Mark PBK as Completed (from modal)
function completePBK() {
    // Ambil konteks PBK dari variabel global atau window
    const pbkCtx = (typeof currentPBKForAction !== 'undefined' && currentPBKForAction) ? currentPBKForAction : (window.currentPBKForAction || null);
    if (!pbkCtx) {
        Swal.fire('Error', 'Tidak ada PBK yang dipilih', 'error');
        return;
    }

    Swal.fire({
        title: 'Selesaikan PBK?',
        text: 'Tandai PBK ini sebagai selesai?',
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#0d6efd',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Ya, Complete!',
        cancelButtonText: 'Batal'
    }).then((result) => {
        if (result.isConfirmed) {
            Swal.fire({
                title: 'Processing...',
                text: 'Menandai PBK sebagai selesai...',
                allowOutsideClick: false,
                didOpen: () => {
                    Swal.showLoading();
                }
            });

            const pbkId = pbkCtx.id || pbkCtx.pbkId || pbkCtx.ticketId || pbkCtx.pbk_number || pbkCtx.pbkNumber;
            fetch('api/update_pbk_status.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    pbk_id: pbkId,
                    status: 'Completed',
                    action_type: 'complete'
                })
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    Swal.fire({
                        icon: 'success',
                        title: 'PBK Selesai!',
                        text: `PBK ${pbkCtx.pbk_number || pbkCtx.pbkNumber || pbkId} ditandai selesai`,
                        timer: 2000,
                        showConfirmButton: false
                    });

                    const modal = bootstrap.Modal.getInstance(document.getElementById('maintenancePBKModal'));
                    if (modal) modal.hide();

                    // Kosongkan kedua variabel agar konsisten
                    try { currentPBKForAction = null; } catch(e) {}
                    window.currentPBKForAction = null;
                    refreshPBKList();
                } else {
                    Swal.fire({
                        icon: 'error',
                        title: 'Error!',
                        text: data.message || 'Gagal menyelesaikan PBK'
                    });
                }
            })
            .catch(error => {
                console.error('Error:', error);
                Swal.fire({
                    icon: 'error',
                    title: 'Error!',
                    text: 'Terjadi kesalahan saat menyelesaikan PBK'
                });
            });
        }
    });
}

// Engineering Store Management
let inventoryItems = [];
let sparePartRequests = [];
let currentEditingItem = null;
let currentRequestForAction = null;

// Initialize Engineering Store
document.addEventListener('DOMContentLoaded', function() {
    if (document.getElementById('inventoryTable')) {
        initializeEngineeringStore();
        setupStoreFilters();
        syncSparePartRequests();
    }
});

function initializeUserProduction() {
    const pbkForm = document.getElementById('pbkForm');
    
    if (pbkForm) {
        // Set default date to today
        const today = new Date().toISOString().split('T')[0];
        const tanggalField = document.getElementById('tanggal');
        if (tanggalField) tanggalField.value = today;
        
        // Set default time to current time
        const now = new Date();
        const currentTime = now.getHours().toString().padStart(2, '0') + ':' + 
                           now.getMinutes().toString().padStart(2, '0');
        const jamField = document.getElementById('jam');
        if (jamField) jamField.value = currentTime;
        
        // Set default datetime for 'when' field
        const currentDateTime = now.toISOString().slice(0, 16);
        const whenField = document.getElementById('when');
        if (whenField) whenField.value = currentDateTime;
        
        // Auto-fill 'who' field with current user
        const whoField = document.getElementById('who');
        if (whoField) whoField.value = 'User Production';
        
        // Pastikan hanya satu handler yang terpasang
        if (!pbkForm.dataset.submitAttached) {
            pbkForm.dataset.submitAttached = 'true';
            pbkForm.addEventListener('submit', function(e) {
                e.preventDefault();
                
                // Show loading
                const submitBtn = pbkForm.querySelector('button[type="submit"]');
                const originalText = submitBtn.innerHTML;
                submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Mengirim...';
                submitBtn.disabled = true;
                
                // Collect form data
                const formData = new FormData(pbkForm);
                
                // Submit to PHP backend
                fetch('submit_pbk.php', {
                    method: 'POST',
                    body: formData
                })
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Network response was not ok');
                    }
                    return response.json();
                })
                .then(data => {
                    submitBtn.innerHTML = originalText;
                    submitBtn.disabled = false;
                    
                    if (data.success) {
                        // Show success message
                        Swal.fire({
                            title: 'PBK Berhasil Dikirim!',
                            text: `Ticket ID: ${data.pbk_number}\nPBK Anda telah dikirim ke tim Maintenance.`,
                            icon: 'success',
                            confirmButtonText: 'OK'
                        }).then(() => {
                            // Reset form
                            pbkForm.reset();
                            
                            // Reset default values
                            if (tanggalField) tanggalField.value = today;
                            if (jamField) jamField.value = currentTime;
                            if (whenField) whenField.value = currentDateTime;
                            if (whoField) whoField.value = 'User Production';
                            
                            // Refresh history and switch to history tab
                            loadPBKHistory();
                            setTimeout(() => {
                                switchToHistoryTab();
                            }, 1000);
                        });
                    } else {
                        Swal.fire({
                            title: 'Error!',
                            text: data.message || 'Gagal mengirim PBK. Silakan coba lagi.',
                            icon: 'error',
                            confirmButtonText: 'OK'
                        });
                    }
                })
                .catch(error => {
                    submitBtn.innerHTML = originalText;
                    submitBtn.disabled = false;
                    console.error('Error:', error);
                    Swal.fire({
                        title: 'Error!',
                        text: 'Terjadi kesalahan koneksi. Silakan coba lagi.',
                        icon: 'error',
                        confirmButtonText: 'OK'
                    });
                });
            });
        }
        
        // Load PBK history when tab loads
        loadPBKHistory();
    }
    
    // Tab click handlers for user production
    const formTab = document.getElementById('form-pbk-tab');
    const historyTab = document.getElementById('history-pbk-tab');
    
    if (formTab) {
        formTab.addEventListener('click', function() {
            switchToFormTab();
        });
    }
    
    if (historyTab) {
        historyTab.addEventListener('click', function() {
            switchToHistoryTab();
            loadPBKHistory();
        });
    }
    
    // Initialize history table
    updatePBKHistoryTable();
    
    // Initialize statistics on page load
    updatePBKStatistics();
    
    // Search functionality
    const searchPBK = document.getElementById('searchPBK');
    if (searchPBK) {
        searchPBK.addEventListener('input', function() {
            filterPBKHistory(this.value);
        });
    }
}

function initializeEngineeringStore() {
    updateInventoryTable();
    updateInventoryStatistics();
    updateRequestsTable();
    updateRequestStatistics();
}

// Inventory Management Functions
function saveItem() {
    const form = document.getElementById('itemForm');
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }

    const itemData = {
        code: document.getElementById('itemCode').value,
        name: document.getElementById('itemName').value,
        category: document.getElementById('itemCategory').value,
        location: document.getElementById('itemLocation').value,
        currentStock: parseInt(document.getElementById('currentStock').value),
        minStock: parseInt(document.getElementById('minStock').value),
        unitPrice: parseFloat(document.getElementById('unitPrice').value) || 0,
        description: document.getElementById('itemDescription').value,
        lastUpdated: new Date().toISOString()
    };

    if (currentEditingItem) {
        // Update existing item
        const index = inventoryItems.findIndex(item => item.code === currentEditingItem);
        if (index !== -1) {
            inventoryItems[index] = { ...inventoryItems[index], ...itemData };
        }
        currentEditingItem = null;
    } else {
        // Add new item
        if (inventoryItems.some(item => item.code === itemData.code)) {
            Swal.fire('Error', 'Item code already exists!', 'error');
            return;
        }
        inventoryItems.push(itemData);
    }

    updateInventoryTable();
    updateInventoryStatistics();
    
    const modal = bootstrap.Modal.getInstance(document.getElementById('addItemModal'));
    modal.hide();
    
    Swal.fire('Success', 'Item saved successfully!', 'success');
    form.reset();
}

function editItem(itemCode) {
    const item = inventoryItems.find(i => i.code === itemCode);
    if (!item) return;

    currentEditingItem = itemCode;
    
    document.getElementById('itemCode').value = item.code;
    document.getElementById('itemName').value = item.name;
    document.getElementById('itemCategory').value = item.category;
    document.getElementById('itemLocation').value = item.location || '';
    document.getElementById('currentStock').value = item.currentStock;
    document.getElementById('minStock').value = item.minStock;
    document.getElementById('unitPrice').value = item.unitPrice || 0;
    document.getElementById('itemDescription').value = item.description || '';
    
    document.getElementById('itemModalTitle').textContent = 'Edit Item';
    document.getElementById('itemCode').disabled = true;
    
    const modal = new bootstrap.Modal(document.getElementById('addItemModal'));
    modal.show();
}

function deleteItem(itemCode) {
    Swal.fire({
        title: 'Are you sure?',
        text: 'This item will be permanently deleted!',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Yes, delete it!'
    }).then((result) => {
        if (result.isConfirmed) {
            inventoryItems = inventoryItems.filter(item => item.code !== itemCode);
            updateInventoryTable();
            updateInventoryStatistics();
            Swal.fire('Deleted!', 'Item has been deleted.', 'success');
        }
    });
}

function adjustStock(itemCode) {
    const item = inventoryItems.find(i => i.code === itemCode);
    if (!item) return;

    document.getElementById('adjustItemCode').value = item.code;
    document.getElementById('adjustItemName').textContent = item.name;
    document.getElementById('adjustCurrentStock').textContent = item.currentStock;
    
    const modal = new bootstrap.Modal(document.getElementById('stockAdjustmentModal'));
    modal.show();
}

function saveStockAdjustment() {
    const form = document.getElementById('stockAdjustmentForm');
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }

    const itemCode = document.getElementById('adjustItemCode').value;
    const adjustmentType = document.getElementById('adjustmentType').value;
    const quantity = parseInt(document.getElementById('adjustmentQuantity').value);
    const reason = document.getElementById('adjustmentReason').value;

    const item = inventoryItems.find(i => i.code === itemCode);
    if (!item) return;

    const oldStock = item.currentStock;
    let newStock = oldStock;

    switch (adjustmentType) {
        case 'add':
            newStock = oldStock + quantity;
            break;
        case 'remove':
            newStock = Math.max(0, oldStock - quantity);
            break;
        case 'set':
            newStock = quantity;
            break;
    }

    item.currentStock = newStock;
    item.lastUpdated = new Date().toISOString();

    updateInventoryTable();
    updateInventoryStatistics();
    
    const modal = bootstrap.Modal.getInstance(document.getElementById('stockAdjustmentModal'));
    modal.hide();
    
    Swal.fire('Success', `Stock adjusted from ${oldStock} to ${newStock}`, 'success');
    form.reset();
}

function updateInventoryTable() {
    const tbody = document.getElementById('inventoryTableBody');
    const emptyState = document.getElementById('inventoryEmptyState');
    
    if (inventoryItems.length === 0) {
        tbody.innerHTML = '';
        emptyState.style.display = 'block';
        return;
    }
    
    emptyState.style.display = 'none';
    tbody.innerHTML = inventoryItems.map(item => createInventoryRow(item)).join('');
}

function createInventoryRow(item) {
    const stockStatus = getStockStatus(item);
    const stockBadge = getStockBadge(stockStatus);
    
    return `
        <tr>
            <td><strong>${item.code}</strong></td>
            <td>${item.name}</td>
            <td><span class="badge bg-secondary">${item.category}</span></td>
            <td>${item.currentStock}</td>
            <td>${item.minStock}</td>
            <td>$${item.unitPrice.toFixed(2)}</td>
            <td>${item.location || '-'}</td>
            <td>${stockBadge}</td>
            <td>
                <div class="btn-group btn-group-sm">
                    <button class="btn btn-outline-primary" onclick="editItem('${item.code}')" title="Edit">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-outline-warning" onclick="adjustStock('${item.code}')" title="Adjust Stock">
                        <i class="fas fa-plus-minus"></i>
                    </button>
                    <button class="btn btn-outline-danger" onclick="deleteItem('${item.code}')" title="Delete">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
    `;
}

function getStockStatus(item) {
    if (item.currentStock === 0) return 'out-of-stock';
    if (item.currentStock <= item.minStock) return 'low-stock';
    return 'in-stock';
}

function getStockBadge(status) {
    switch (status) {
        case 'in-stock':
            return '<span class="badge bg-success">In Stock</span>';
        case 'low-stock':
            return '<span class="badge bg-warning">Low Stock</span>';
        case 'out-of-stock':
            return '<span class="badge bg-danger">Out of Stock</span>';
        default:
            return '<span class="badge bg-secondary">Unknown</span>';
    }
}

function updateInventoryStatistics() {
    const total = inventoryItems.length;
    const inStock = inventoryItems.filter(item => getStockStatus(item) === 'in-stock').length;
    const lowStock = inventoryItems.filter(item => getStockStatus(item) === 'low-stock').length;
    const outOfStock = inventoryItems.filter(item => getStockStatus(item) === 'out-of-stock').length;
    
    document.getElementById('totalItems').textContent = total;
    document.getElementById('inStockItems').textContent = inStock;
    document.getElementById('lowStockItems').textContent = lowStock;
    document.getElementById('outOfStockItems').textContent = outOfStock;
}

// Spare Part Requests Management
function syncSparePartRequests() {
    // In a real application, this would sync from the maintenance system
    // For now, we'll check if there are any spare part requests from maintenance
    if (typeof maintenancePBKList !== 'undefined') {
        // Extract spare part requests from maintenance PBK list
        sparePartRequests = [];
        maintenancePBKList.forEach(pbk => {
            if (pbk.sparePartRequests && pbk.sparePartRequests.length > 0) {
                pbk.sparePartRequests.forEach(request => {
                    sparePartRequests.push({
                        id: `SPR-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                        pbkTicket: pbk.ticketId,
                        requestedBy: pbk.requestedBy || 'Maintenance Team',
                        itemRequested: request.itemName,
                        quantity: request.quantity,
                        priority: request.priority || pbk.priority,
                        requestDate: request.requestDate || new Date().toISOString(),
                        status: request.status || 'Pending',
                        description: request.description || '',
                        urgency: request.urgency || 'Normal'
                    });
                });
            }
        });
    }
    
    updateRequestsTable();
    updateRequestStatistics();
}

function updateRequestsTable() {
    const tbody = document.getElementById('requestsTableBody');
    const emptyState = document.getElementById('requestsEmptyState');
    
    if (sparePartRequests.length === 0) {
        tbody.innerHTML = '';
        emptyState.style.display = 'block';
        return;
    }
    
    emptyState.style.display = 'none';
    tbody.innerHTML = sparePartRequests.map(request => createRequestRow(request)).join('');
}

function createRequestRow(request) {
    const statusBadge = getRequestStatusBadge(request.status);
    const priorityBadge = getPriorityBadge(request.priority);
    
    return `
        <tr>
            <td><strong>${request.id}</strong></td>
            <td><a href="#" onclick="viewPBKFromRequest('${request.pbkTicket}')">${request.pbkTicket}</a></td>
            <td>${request.requestedBy}</td>
            <td>${request.itemRequested}</td>
            <td>${request.quantity}</td>
            <td>${priorityBadge}</td>
            <td>${new Date(request.requestDate).toLocaleDateString()}</td>
            <td>${statusBadge}</td>
            <td>
                <div class="btn-group btn-group-sm">
                    <button class="btn btn-outline-info" onclick="viewRequestDetail('${request.id}')" title="View Details">
                        <i class="fas fa-eye"></i>
                    </button>
                    ${request.status === 'Pending' ? `
                        <button class="btn btn-outline-success" onclick="processRequest('${request.id}')" title="Process">
                            <i class="fas fa-cog"></i>
                        </button>
                    ` : ''}
                </div>
            </td>
        </tr>
    `;
}

function getRequestStatusBadge(status) {
    switch (status) {
        case 'Pending':
            return '<span class="badge bg-warning">Pending</span>';
        case 'Processing':
            return '<span class="badge bg-info">Processing</span>';
        case 'Fulfilled':
            return '<span class="badge bg-success">Fulfilled</span>';
        case 'Rejected':
            return '<span class="badge bg-danger">Rejected</span>';
        default:
            return '<span class="badge bg-secondary">Unknown</span>';
    }
}

function viewRequestDetail(requestId) {
    const request = sparePartRequests.find(r => r.id === requestId);
    if (!request) return;

    currentRequestForAction = requestId;
    
    const content = `
        <div class="row">
            <div class="col-md-6">
                <h6>Request Information</h6>
                <table class="table table-sm">
                    <tr><td><strong>Request ID:</strong></td><td>${request.id}</td></tr>
                    <tr><td><strong>PBK Ticket:</strong></td><td>${request.pbkTicket}</td></tr>
                    <tr><td><strong>Requested By:</strong></td><td>${request.requestedBy}</td></tr>
                    <tr><td><strong>Request Date:</strong></td><td>${new Date(request.requestDate).toLocaleString()}</td></tr>
                    <tr><td><strong>Status:</strong></td><td>${getRequestStatusBadge(request.status)}</td></tr>
                </table>
            </div>
            <div class="col-md-6">
                <h6>Item Details</h6>
                <table class="table table-sm">
                    <tr><td><strong>Item:</strong></td><td>${request.itemRequested}</td></tr>
                    <tr><td><strong>Quantity:</strong></td><td>${request.quantity}</td></tr>
                    <tr><td><strong>Priority:</strong></td><td>${getPriorityBadge(request.priority)}</td></tr>
                    <tr><td><strong>Urgency:</strong></td><td>${request.urgency}</td></tr>
                </table>
            </div>
        </div>
        ${request.description ? `
            <div class="row mt-3">
                <div class="col-12">
                    <h6>Description</h6>
                    <p class="border p-2 rounded">${request.description}</p>
                </div>
            </div>
        ` : ''}
    `;
    
    document.getElementById('requestDetailContent').innerHTML = content;
    
    // Show/hide action buttons based on status
    const fulfillBtn = document.getElementById('fulfillRequestBtn');
    const rejectBtn = document.getElementById('rejectRequestBtn');
    
    if (request.status === 'Pending' || request.status === 'Processing') {
        fulfillBtn.style.display = 'inline-block';
        rejectBtn.style.display = 'inline-block';
    } else {
        fulfillBtn.style.display = 'none';
        rejectBtn.style.display = 'none';
    }
    
    const modal = new bootstrap.Modal(document.getElementById('requestDetailModal'));
    modal.show();
}

function processRequest(requestId) {
    const request = sparePartRequests.find(r => r.id === requestId);
    if (!request) return;

    request.status = 'Processing';
    updateRequestsTable();
    updateRequestStatistics();
    
    Swal.fire('Success', 'Request is now being processed', 'success');
}

function fulfillRequest() {
    if (!currentRequestForAction) return;
    
    const request = sparePartRequests.find(r => r.id === currentRequestForAction);
    if (!request) return;

    // Check if item exists in inventory
    const inventoryItem = inventoryItems.find(item => 
        item.name.toLowerCase().includes(request.itemRequested.toLowerCase()) ||
        item.code.toLowerCase().includes(request.itemRequested.toLowerCase())
    );

    if (inventoryItem && inventoryItem.currentStock >= request.quantity) {
        // Deduct from inventory
        inventoryItem.currentStock -= request.quantity;
        inventoryItem.lastUpdated = new Date().toISOString();
        
        // Update request status
        request.status = 'Fulfilled';
        request.fulfilledDate = new Date().toISOString();
        
        updateInventoryTable();
        updateInventoryStatistics();
        updateRequestsTable();
        updateRequestStatistics();
        
        const modal = bootstrap.Modal.getInstance(document.getElementById('requestDetailModal'));
        modal.hide();
        
        Swal.fire('Success', 'Request fulfilled successfully!', 'success');
    } else {
        Swal.fire('Error', 'Insufficient stock or item not found in inventory!', 'error');
    }
    
    currentRequestForAction = null;
}

function rejectRequest() {
    if (!currentRequestForAction) return;
    
    Swal.fire({
        title: 'Reject Request',
        input: 'textarea',
        inputLabel: 'Reason for rejection',
        inputPlaceholder: 'Enter reason for rejecting this request...',
        showCancelButton: true,
        confirmButtonText: 'Reject Request',
        confirmButtonColor: '#d33'
    }).then((result) => {
        if (result.isConfirmed) {
            const request = sparePartRequests.find(r => r.id === currentRequestForAction);
            if (request) {
                request.status = 'Rejected';
                request.rejectionReason = result.value;
                request.rejectedDate = new Date().toISOString();
                
                updateRequestsTable();
                updateRequestStatistics();
                
                const modal = bootstrap.Modal.getInstance(document.getElementById('requestDetailModal'));
                modal.hide();
                
                Swal.fire('Rejected', 'Request has been rejected', 'success');
            }
            currentRequestForAction = null;
        }
    });
}

function updateRequestStatistics() {
    const pending = sparePartRequests.filter(r => r.status === 'Pending').length;
    const processing = sparePartRequests.filter(r => r.status === 'Processing').length;
    const fulfilled = sparePartRequests.filter(r => r.status === 'Fulfilled').length;
    const rejected = sparePartRequests.filter(r => r.status === 'Rejected').length;
    
    document.getElementById('pendingRequests').textContent = pending;
    document.getElementById('processingRequests').textContent = processing;
    document.getElementById('fulfilledRequests').textContent = fulfilled;
    document.getElementById('rejectedRequests').textContent = rejected;
}

function refreshRequests() {
    syncSparePartRequests();
    Swal.fire('Success', 'Requests refreshed!', 'success');
}

function viewPBKFromRequest(ticketId) {
    // Switch to maintenance tab and show PBK detail
    if (typeof viewMaintenancePBKDetail === 'function') {
        // Switch to maintenance page
        showSection('maintenance');
        setTimeout(() => {
            viewMaintenancePBKDetail(ticketId);
        }, 100);
    }
}

// Filter and Search Functions
function setupStoreFilters() {
    const searchInventory = document.getElementById('searchInventory');
    const categoryFilter = document.getElementById('categoryFilter');
    const stockFilter = document.getElementById('stockFilter');
    const searchRequests = document.getElementById('searchRequests');
    const requestStatusFilter = document.getElementById('requestStatusFilter');
    const requestPriorityFilter = document.getElementById('requestPriorityFilter');
    
    if (searchInventory) {
        searchInventory.addEventListener('input', applyInventoryFilters);
    }
    if (categoryFilter) {
        categoryFilter.addEventListener('change', applyInventoryFilters);
    }
    if (stockFilter) {
        stockFilter.addEventListener('change', applyInventoryFilters);
    }
    if (searchRequests) {
        searchRequests.addEventListener('input', applyRequestFilters);
    }
    if (requestStatusFilter) {
        requestStatusFilter.addEventListener('change', applyRequestFilters);
    }
    if (requestPriorityFilter) {
        requestPriorityFilter.addEventListener('change', applyRequestFilters);
    }
}

function applyInventoryFilters() {
    const searchTerm = document.getElementById('searchInventory').value.toLowerCase();
    const categoryFilter = document.getElementById('categoryFilter').value;
    const stockFilter = document.getElementById('stockFilter').value;
    
    let filteredItems = inventoryItems.filter(item => {
        const matchesSearch = item.name.toLowerCase().includes(searchTerm) ||
                            item.code.toLowerCase().includes(searchTerm) ||
                            (item.description && item.description.toLowerCase().includes(searchTerm));
        
        const matchesCategory = !categoryFilter || item.category === categoryFilter;
        
        const stockStatus = getStockStatus(item);
        const matchesStock = !stockFilter || stockStatus === stockFilter;
        
        return matchesSearch && matchesCategory && matchesStock;
    });
    
    displayFilteredInventory(filteredItems);
}

function displayFilteredInventory(filteredItems) {
    const tbody = document.getElementById('inventoryTableBody');
    const emptyState = document.getElementById('inventoryEmptyState');
    
    if (filteredItems.length === 0) {
        tbody.innerHTML = '';
        emptyState.style.display = 'block';
        return;
    }
    
    emptyState.style.display = 'none';
    tbody.innerHTML = filteredItems.map(item => createInventoryRow(item)).join('');
}

function applyRequestFilters() {
    const searchTerm = document.getElementById('searchRequests').value.toLowerCase();
    const statusFilter = document.getElementById('requestStatusFilter').value;
    const priorityFilter = document.getElementById('requestPriorityFilter').value;
    
    let filteredRequests = sparePartRequests.filter(request => {
        const matchesSearch = request.id.toLowerCase().includes(searchTerm) ||
                            request.pbkTicket.toLowerCase().includes(searchTerm) ||
                            request.itemRequested.toLowerCase().includes(searchTerm) ||
                            request.requestedBy.toLowerCase().includes(searchTerm);
        
        const matchesStatus = !statusFilter || request.status === statusFilter;
        const matchesPriority = !priorityFilter || request.priority === priorityFilter;
        
        return matchesSearch && matchesStatus && matchesPriority;
    });
    
    displayFilteredRequests(filteredRequests);
}

function displayFilteredRequests(filteredRequests) {
    const tbody = document.getElementById('requestsTableBody');
    const emptyState = document.getElementById('requestsEmptyState');
    
    if (filteredRequests.length === 0) {
        tbody.innerHTML = '';
        emptyState.style.display = 'block';
        return;
    }
    
    emptyState.style.display = 'none';
    tbody.innerHTML = filteredRequests.map(request => createRequestRow(request)).join('');
}

// Reset modal when closed
document.addEventListener('hidden.bs.modal', function (event) {
    if (event.target.id === 'addItemModal') {
        document.getElementById('itemForm').reset();
        document.getElementById('itemModalTitle').textContent = 'Add New Item';
        document.getElementById('itemCode').disabled = false;
        currentEditingItem = null;
    }
});
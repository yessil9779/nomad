// Netflix Catalog App JavaScript

const API_BASE = '/api';

// Auth State
let currentUser = null;
let authToken = localStorage.getItem('auth_token');

// Utility Functions
async function apiRequest(endpoint, options = {}) {
    const url = `${API_BASE}${endpoint}`;
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers
    };
    
    if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
    }
    
    try {
        const response = await fetch(url, {
            ...options,
            headers
        });
        
        if (response.status === 401) {
            logout();
            return null;
        }
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.detail || 'Request failed');
        }
        
        return data;
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

function showError(elementId, message) {
    const errorEl = document.getElementById(elementId);
    if (errorEl) {
        errorEl.textContent = message;
        errorEl.classList.add('show');
    }
}

function hideError(elementId) {
    const errorEl = document.getElementById(elementId);
    if (errorEl) {
        errorEl.classList.remove('show');
    }
}

function logout() {
    localStorage.removeItem('auth_token');
    authToken = null;
    currentUser = null;
    window.location.href = '/login';
}

// Check auth status
async function checkAuth() {
    if (!authToken) {
        return false;
    }
    
    try {
        currentUser = await apiRequest('/auth/me');
        return !!currentUser;
    } catch (error) {
        logout();
        return false;
    }
}

// Login Page
async function handleLogin(event) {
    event.preventDefault();
    hideError('error-message');
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    try {
        const formData = new URLSearchParams();
        formData.append('username', username);
        formData.append('password', password);
        
        const response = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: formData
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.detail || 'Login failed');
        }
        
        authToken = data.access_token;
        localStorage.setItem('auth_token', authToken);
        window.location.href = '/catalog';
    } catch (error) {
        showError('error-message', error.message);
    }
}

// Register Page
async function handleRegister(event) {
    event.preventDefault();
    hideError('error-message');
    
    const username = document.getElementById('username').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirm-password').value;
    
    if (password !== confirmPassword) {
        showError('error-message', 'Passwords do not match');
        return;
    }
    
    try {
        await apiRequest('/auth/register', {
            method: 'POST',
            body: JSON.stringify({ username, email, password })
        });
        
        // Auto login after registration
        const formData = new URLSearchParams();
        formData.append('username', username);
        formData.append('password', password);
        
        const loginResponse = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: formData
        });
        
        const loginData = await loginResponse.json();
        
        if (loginResponse.ok) {
            authToken = loginData.access_token;
            localStorage.setItem('auth_token', authToken);
            window.location.href = '/catalog';
        } else {
            window.location.href = '/login';
        }
    } catch (error) {
        showError('error-message', error.message);
    }
}

// Catalog Page
let currentPage = 1;
let totalPages = 1;
let currentFilters = {};

async function loadFilters() {
    try {
        const [types, categories, ratings, years] = await Promise.all([
            apiRequest('/shows/types'),
            apiRequest('/shows/categories'),
            apiRequest('/shows/ratings'),
            apiRequest('/shows/years')
        ]);
        
        // Populate type filter
        const typeSelect = document.getElementById('filter-type');
        if (typeSelect && types) {
            types.forEach(type => {
                const option = document.createElement('option');
                option.value = type;
                option.textContent = type;
                typeSelect.appendChild(option);
            });
        }
        
        // Populate category filter
        const categorySelect = document.getElementById('filter-category');
        if (categorySelect && categories) {
            categories.forEach(cat => {
                const option = document.createElement('option');
                option.value = cat.name;
                option.textContent = cat.name;
                categorySelect.appendChild(option);
            });
        }
        
        // Populate rating filter
        const ratingSelect = document.getElementById('filter-rating');
        if (ratingSelect && ratings) {
            ratings.forEach(rating => {
                const option = document.createElement('option');
                option.value = rating.name;
                option.textContent = rating.name;
                ratingSelect.appendChild(option);
            });
        }
        
        // Populate year filters
        const yearFromSelect = document.getElementById('filter-year-from');
        const yearToSelect = document.getElementById('filter-year-to');
        if (yearFromSelect && yearToSelect && years) {
            for (let year = years.max; year >= years.min; year--) {
                const optionFrom = document.createElement('option');
                optionFrom.value = year;
                optionFrom.textContent = year;
                yearFromSelect.appendChild(optionFrom);
                
                const optionTo = document.createElement('option');
                optionTo.value = year;
                optionTo.textContent = year;
                yearToSelect.appendChild(optionTo);
            }
        }
    } catch (error) {
        console.error('Failed to load filters:', error);
    }
}

async function loadShows(page = 1) {
    const showsGrid = document.getElementById('shows-grid');
    const showsStats = document.getElementById('shows-stats');
    const loading = document.getElementById('loading');
    
    if (!showsGrid) return;
    
    showsGrid.innerHTML = '';
    if (loading) loading.style.display = 'flex';
    
    try {
        const params = new URLSearchParams();
        params.append('page', page);
        params.append('per_page', 20);
        
        if (currentFilters.search) params.append('search', currentFilters.search);
        if (currentFilters.type) params.append('type', currentFilters.type);
        if (currentFilters.category) params.append('category', currentFilters.category);
        if (currentFilters.rating) params.append('rating', currentFilters.rating);
        if (currentFilters.yearFrom) params.append('year_from', currentFilters.yearFrom);
        if (currentFilters.yearTo) params.append('year_to', currentFilters.yearTo);
        
        const data = await apiRequest(`/shows/?${params.toString()}`);
        
        if (loading) loading.style.display = 'none';
        
        if (!data || !data.items || data.items.length === 0) {
            showsGrid.innerHTML = `
                <div class="empty-state">
                    <h3>No shows found</h3>
                    <p>Try adjusting your filters or search query</p>
                </div>
            `;
            if (showsStats) showsStats.textContent = 'No shows found';
            return;
        }
        
        currentPage = data.page;
        totalPages = data.pages;
        
        if (showsStats) {
            showsStats.textContent = `Showing ${data.items.length} of ${data.total} shows`;
        }
        
        data.items.forEach(show => {
            const card = createShowCard(show);
            showsGrid.appendChild(card);
        });
        
        updatePagination();
    } catch (error) {
        if (loading) loading.style.display = 'none';
        showsGrid.innerHTML = `
            <div class="empty-state">
                <h3>Error loading shows</h3>
                <p>${error.message}</p>
            </div>
        `;
    }
}

function createShowCard(show) {
    const card = document.createElement('div');
    card.className = 'show-card';
    card.onclick = () => openShowModal(show);
    
    const typeClass = show.type === 'Movie' ? 'movie' : 'tv-show';
    const categories = show.categories.slice(0, 2).map(c => 
        `<span class="category-tag">${c.name}</span>`
    ).join('');
    
    card.innerHTML = `
        <div class="show-card-image">
            <span class="show-type-badge ${typeClass}">${show.type}</span>
            <span class="show-card-icon">${show.type === 'Movie' ? '🎬' : '📺'}</span>
        </div>
        <div class="show-card-content">
            <h3 class="show-card-title" title="${show.title}">${show.title}</h3>
            <div class="show-card-meta">
                <span>📅 ${show.release_year || 'N/A'}</span>
                <span>⏱️ ${show.duration || 'N/A'}</span>
                ${show.rating ? `<span class="show-card-rating">${show.rating}</span>` : ''}
            </div>
            ${categories ? `<div class="show-card-categories">${categories}</div>` : ''}
            ${show.description ? `<p class="show-card-description">${show.description}</p>` : ''}
        </div>
    `;
    
    return card;
}

function openShowModal(show) {
    const modal = document.getElementById('show-modal');
    if (!modal) return;
    
    const categories = show.categories.map(c => 
        `<span class="category-tag">${c.name}</span>`
    ).join('');
    
    modal.querySelector('.modal-title').textContent = show.title;
    modal.querySelector('.modal-body').innerHTML = `
        <div class="modal-meta">
            <div class="modal-meta-item">
                <strong>Type:</strong> ${show.type}
            </div>
            <div class="modal-meta-item">
                <strong>Year:</strong> ${show.release_year || 'N/A'}
            </div>
            <div class="modal-meta-item">
                <strong>Duration:</strong> ${show.duration || 'N/A'}
            </div>
            <div class="modal-meta-item">
                <strong>Rating:</strong> ${show.rating || 'N/A'}
            </div>
        </div>
        
        ${show.director ? `
            <div class="modal-section">
                <h4>Director</h4>
                <p>${show.director}</p>
            </div>
        ` : ''}
        
        ${show.cast ? `
            <div class="modal-section">
                <h4>Cast</h4>
                <p>${show.cast}</p>
            </div>
        ` : ''}
        
        ${show.country ? `
            <div class="modal-section">
                <h4>Country</h4>
                <p>${show.country}</p>
            </div>
        ` : ''}
        
        ${show.description ? `
            <div class="modal-section">
                <h4>Description</h4>
                <p>${show.description}</p>
            </div>
        ` : ''}
        
        ${categories ? `
            <div class="modal-section">
                <h4>Categories</h4>
                <div class="modal-categories">${categories}</div>
            </div>
        ` : ''}
        
        ${show.date_added ? `
            <div class="modal-section">
                <h4>Added to Netflix</h4>
                <p>${show.date_added}</p>
            </div>
        ` : ''}
    `;
    
    modal.querySelector('.modal-overlay').classList.add('active');
}

function closeShowModal() {
    const modal = document.getElementById('show-modal');
    if (modal) {
        modal.querySelector('.modal-overlay').classList.remove('active');
    }
}

function updatePagination() {
    const pagination = document.getElementById('pagination');
    if (!pagination) return;
    
    let html = '';
    
    // Previous button
    html += `<button onclick="goToPage(${currentPage - 1})" ${currentPage === 1 ? 'disabled' : ''}>← Prev</button>`;
    
    // Page numbers
    const startPage = Math.max(1, currentPage - 2);
    const endPage = Math.min(totalPages, currentPage + 2);
    
    if (startPage > 1) {
        html += `<button onclick="goToPage(1)">1</button>`;
        if (startPage > 2) html += `<span class="pagination-info">...</span>`;
    }
    
    for (let i = startPage; i <= endPage; i++) {
        html += `<button onclick="goToPage(${i})" class="${i === currentPage ? 'active' : ''}">${i}</button>`;
    }
    
    if (endPage < totalPages) {
        if (endPage < totalPages - 1) html += `<span class="pagination-info">...</span>`;
        html += `<button onclick="goToPage(${totalPages})">${totalPages}</button>`;
    }
    
    // Next button
    html += `<button onclick="goToPage(${currentPage + 1})" ${currentPage === totalPages ? 'disabled' : ''}>Next →</button>`;
    
    // Page info
    html += `<span class="pagination-info">Page ${currentPage} of ${totalPages}</span>`;
    
    pagination.innerHTML = html;
}

function goToPage(page) {
    if (page < 1 || page > totalPages) return;
    loadShows(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function applyFilters() {
    currentFilters = {
        search: document.getElementById('search-input')?.value || '',
        type: document.getElementById('filter-type')?.value || '',
        category: document.getElementById('filter-category')?.value || '',
        rating: document.getElementById('filter-rating')?.value || '',
        yearFrom: document.getElementById('filter-year-from')?.value || '',
        yearTo: document.getElementById('filter-year-to')?.value || ''
    };
    loadShows(1);
}

function resetFilters() {
    document.getElementById('search-input').value = '';
    document.getElementById('filter-type').value = '';
    document.getElementById('filter-category').value = '';
    document.getElementById('filter-rating').value = '';
    document.getElementById('filter-year-from').value = '';
    document.getElementById('filter-year-to').value = '';
    currentFilters = {};
    loadShows(1);
}

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
    // Navbar scroll effect
    window.addEventListener('scroll', () => {
        const navbar = document.querySelector('.navbar');
        if (navbar) {
            if (window.scrollY > 50) {
                navbar.classList.add('scrolled');
            } else {
                navbar.classList.remove('scrolled');
            }
        }
    });
    
    // Login form
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    // Register form
    const registerForm = document.getElementById('register-form');
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
    }
    
    // Catalog page
    const catalogPage = document.getElementById('catalog-page');
    if (catalogPage) {
        const isAuthenticated = await checkAuth();
        if (!isAuthenticated) {
            window.location.href = '/login';
            return;
        }
        
        // Update user info
        const userNameEl = document.getElementById('user-name');
        if (userNameEl && currentUser) {
            userNameEl.textContent = currentUser.username;
        }
        
        // Load filters and shows
        await loadFilters();
        loadShows();
        
        // Search on enter
        const searchInput = document.getElementById('search-input');
        if (searchInput) {
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    applyFilters();
                }
            });
        }
        
        // Modal close
        const modalOverlay = document.querySelector('.modal-overlay');
        if (modalOverlay) {
            modalOverlay.addEventListener('click', (e) => {
                if (e.target === modalOverlay) {
                    closeShowModal();
                }
            });
        }
        
        // ESC to close modal
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                closeShowModal();
            }
        });
    }
    
    // Logout button
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }
});


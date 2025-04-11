// Initialize Telegram Web App
const telegramWebApp = window.Telegram.WebApp;

// API URL - will be replaced with your actual backend URL
const API_BASE_URL = 'https://guxlab.pro/api';

// DOM Elements
const themeToggle = document.getElementById('theme-toggle');
const tabButtons = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');
const ticketForm = document.getElementById('ticket-form');
const screenshotsInput = document.getElementById('screenshots');
const dropArea = screenshotsInput.closest('div').parentElement;
const imagePreview = document.getElementById('image-preview');
const ticketsList = document.getElementById('tickets-list');
const filterType = document.getElementById('filter-type');
const filterStatus = document.getElementById('filter-status');
const typeOptions = document.querySelectorAll('.type-option');

// User data from Telegram
const userData = telegramWebApp.initDataUnsafe?.user || {};

// Check and set initial theme
function initTheme() {
    // Check for stored preference
    const savedTheme = localStorage.getItem('theme');
    
    // If no saved preference, use Telegram's color scheme
    const prefersDark = savedTheme === 'dark' || 
                       (savedTheme === null && telegramWebApp.colorScheme === 'dark');
    
    if (prefersDark) {
        document.documentElement.classList.add('dark');
    } else {
        document.documentElement.classList.remove('dark');
    }
}

// Theme Toggle
themeToggle.addEventListener('click', () => {
    const isDark = document.documentElement.classList.toggle('dark');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
});

// Tab Switching with animation
tabButtons.forEach(button => {
    button.addEventListener('click', () => {
        // Update active tab button style
        tabButtons.forEach(btn => {
            btn.classList.remove('bg-blue-500', 'text-white');
            btn.classList.add('bg-white', 'dark:bg-gray-800');
        });
        
        button.classList.remove('bg-white', 'dark:bg-gray-800');
        button.classList.add('bg-blue-500', 'text-white');
        
        // Show selected tab content
        tabContents.forEach(content => content.classList.add('hidden'));
        
        const tabId = button.dataset.tab;
        const tabContent = document.getElementById(tabId);
        tabContent.classList.remove('hidden');
        
        // Add a subtle animation
        tabContent.classList.add('animate-fade-in');
        setTimeout(() => tabContent.classList.remove('animate-fade-in'), 300);
        
        if (tabId === 'history') {
            loadTicketHistory();
        }
    });
});

// Type option selection
typeOptions.forEach(option => {
    option.addEventListener('click', () => {
        // Remove selected class from all options
        typeOptions.forEach(opt => {
            opt.classList.remove('ring-2', 'ring-blue-500', 'bg-blue-50', 'dark:bg-blue-900/20');
        });
        
        // Add selected class to clicked option
        option.classList.add('ring-2', 'ring-blue-500', 'bg-blue-50', 'dark:bg-blue-900/20');
        
        // Check the radio button
        const radio = option.querySelector('input[type="radio"]');
        radio.checked = true;
    });
});

// Drag and drop for screenshots
['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    dropArea.addEventListener(eventName, preventDefaults, false);
});

function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
}

['dragenter', 'dragover'].forEach(eventName => {
    dropArea.addEventListener(eventName, highlight, false);
});

['dragleave', 'drop'].forEach(eventName => {
    dropArea.addEventListener(eventName, unhighlight, false);
});

function highlight() {
    dropArea.classList.add('ring-2', 'ring-blue-500');
}

function unhighlight() {
    dropArea.classList.remove('ring-2', 'ring-blue-500');
}

dropArea.addEventListener('drop', handleDrop, false);
dropArea.addEventListener('click', () => {
    screenshotsInput.click();
});

function handleDrop(e) {
    const dt = e.dataTransfer;
    const files = dt.files;
    handleFiles(files);
}

screenshotsInput.addEventListener('change', () => {
    handleFiles(screenshotsInput.files);
});

function handleFiles(files) {
    imagePreview.innerHTML = '';
    
    if (files.length > 0) {
        Array.from(files).forEach(file => {
            previewImage(file);
        });
    }
}

function previewImage(file) {
    const reader = new FileReader();
    
    reader.onload = (e) => {
        const container = document.createElement('div');
        container.className = 'relative group';
        
        const img = document.createElement('img');
        img.src = e.target.result;
        img.className = 'w-16 h-16 object-cover rounded-lg';
        container.appendChild(img);
        
        const removeBtn = document.createElement('button');
        removeBtn.className = 'absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200';
        removeBtn.innerHTML = '×';
        removeBtn.addEventListener('click', (e) => {
            e.preventDefault();
            container.remove();
        });
        container.appendChild(removeBtn);
        
        imagePreview.appendChild(container);
    };
    
    reader.readAsDataURL(file);
}

// Form Submission
ticketForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const submitBtn = ticketForm.querySelector('.submit-btn');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Submitting...';
    submitBtn.disabled = true;
    
    try {
        const formData = new FormData();
        
        // Add form fields
        formData.append('entity', document.getElementById('entity').value);
        formData.append('type', document.querySelector('input[name="type"]:checked').value);
        formData.append('title', document.getElementById('title').value);
        formData.append('description', document.getElementById('description').value);
        
        // Add user data
        formData.append('userId', userData.id);
        formData.append('username', userData.username || '');
        formData.append('firstName', userData.first_name || '');
        formData.append('lastName', userData.last_name || '');
        
        // Add screenshots
        const imageElements = imagePreview.querySelectorAll('img');
        if (imageElements.length > 0) {
            // Only if we have actual screenshots in the preview
            Array.from(screenshotsInput.files).forEach(file => {
                formData.append('screenshots', file);
            });
        }
        
        // Send to API
        const response = await fetch(`${API_BASE_URL}/tickets`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${telegramWebApp.initData}`
            },
            body: formData
        });
        
        if (!response.ok) {
            throw new Error('Failed to submit ticket');
        }
        
        const result = await response.json();
        
        // Show success message with animation
        ticketForm.innerHTML = `
            <div class="success-message text-center py-8 px-4">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 text-green-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 class="text-xl font-bold mb-2">Request Submitted!</h3>
                <p class="mb-1">Your ticket ID is: <span class="font-mono font-medium">${result.ticketId}</span></p>
                <p class="text-gray-600 dark:text-gray-400">We'll notify you when there's an update.</p>
            </div>
        `;
        
        telegramWebApp.MainButton.setText("Close");
        telegramWebApp.MainButton.show();
        telegramWebApp.MainButton.onClick(() => telegramWebApp.close());
        
    } catch (error) {
        console.error(error);
        
        // Show error message
        const errorDiv = document.createElement('div');
        errorDiv.className = 'bg-red-100 border border-red-400 text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400 px-4 py-3 rounded mb-4';
        errorDiv.innerHTML = `
            <div class="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
                </svg>
                <span>Failed to submit your request. Please try again.</span>
            </div>
        `;
        
        ticketForm.prepend(errorDiv);
        
        // Auto-remove error after 5 seconds
        setTimeout(() => {
            errorDiv.remove();
        }, 5000);
        
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }
});

// Load Ticket History with skeleton loading
async function loadTicketHistory() {
    ticketsList.innerHTML = `
        <div class="animate-pulse space-y-3">
            <div class="bg-gray-300 dark:bg-gray-700 h-24 rounded-lg"></div>
            <div class="bg-gray-300 dark:bg-gray-700 h-24 rounded-lg"></div>
            <div class="bg-gray-300 dark:bg-gray-700 h-24 rounded-lg"></div>
        </div>
    `;
    
    try {
        const typeFilter = filterType.value;
        const statusFilter = filterStatus.value;
        
        const response = await fetch(`${API_BASE_URL}/tickets?userId=${userData.id}&type=${typeFilter}&status=${statusFilter}`, {
            headers: {
                'Authorization': `Bearer ${telegramWebApp.initData}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to load tickets');
        }
        
        const tickets = await response.json();
        
        if (tickets.length === 0) {
            ticketsList.innerHTML = `
                <div class="text-center py-8">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 text-gray-400 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    <p class="text-gray-500 dark:text-gray-400">No tickets found</p>
                </div>
            `;
            return;
        }
        
        ticketsList.innerHTML = '';
        
        tickets.forEach(ticket => {
            const ticketElement = document.createElement('div');
            ticketElement.className = 'ticket-item bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 shadow-sm transition-all duration-200 hover:shadow-md';
            
            const date = new Date(ticket.createdAt).toLocaleDateString();
            
            let statusClass = '';
            switch(ticket.status) {
                case 'open':
                    statusClass = 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
                    break;
                case 'in-progress':
                    statusClass = 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
                    break;
                case 'closed':
                    statusClass = 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
                    break;
            }
            
            let typeIcon = '';
            switch(ticket.type) {
                case 'bug':
                    typeIcon = `<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>`;
                    break;
                case 'feature':
                    typeIcon = `<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                </svg>`;
                    break;
                case 'improvement':
                    typeIcon = `<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>`;
                    break;
            }
            
            ticketElement.innerHTML = `
                <div class="flex justify-between items-start">
                    <h3 class="text-lg font-medium">${ticket.title}</h3>
                    <span class="text-xs px-2 py-1 rounded-full ${statusClass} capitalize">${ticket.status}</span>
                </div>
                <div class="flex items-center mt-2 text-xs text-gray-500 dark:text-gray-400">
                    <div class="flex items-center mr-3">
                        ${typeIcon}
                        <span class="ml-1 capitalize">${ticket.type}</span>
                    </div>
                    <div class="mr-3">${ticket.entity}</div>
                    <div>${date}</div>
                </div>
                <p class="mt-2 text-sm text-gray-600 dark:text-gray-300 line-clamp-2">${ticket.description}</p>
                ${ticket.ScreenshotUrls && ticket.ScreenshotUrls.length > 0 ? 
                  `<div class="mt-2 flex -space-x-2 overflow-hidden">
                      ${ticket.ScreenshotUrls.slice(0, 3).map(url => 
                        `<img src="${url}" class="inline-block h-8 w-8 rounded-md ring-2 ring-white dark:ring-gray-800" />`
                      ).join('')}
                      ${ticket.ScreenshotUrls.length > 3 ? 
                        `<div class="flex items-center justify-center h-8 w-8 rounded-md bg-gray-200 dark:bg-gray-700 ring-2 ring-white dark:ring-gray-800 text-xs">+${ticket.ScreenshotUrls.length - 3}</div>` : 
                        ''}
                   </div>` : 
                  ''}
            `;
            
            ticketsList.appendChild(ticketElement);
        });
        
    } catch (error) {
        ticketsList.innerHTML = `
            <div class="text-center py-8">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 text-red-400 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p class="text-gray-500 dark:text-gray-400">Failed to load tickets</p>
                <button class="mt-2 text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 text-sm" onclick="loadTicketHistory()">Try again</button>
            </div>
        `;
    }
}

// Filter change events
filterType.addEventListener('change', loadTicketHistory);
filterStatus.addEventListener('change', loadTicketHistory);

// Initialize the app
initTheme();
telegramWebApp.ready();
telegramWebApp.expand();

// Set initial active tab
document.querySelector('.tab-btn[data-tab="new-ticket"]').classList.add('bg-blue-500', 'text-white');
document.querySelector('.tab-btn[data-tab="new-ticket"]').classList.remove('bg-white', 'dark:bg-gray-800');
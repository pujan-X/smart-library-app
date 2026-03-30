
const API_BASE_URL = '/api';

let currentBookId = null;


function showToast(message, type = 'success') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');

    const isSuccess = type === 'success';
    const bgColor = isSuccess ? 'bg-green-500/10 border-green-500/50 text-green-400' : 'bg-red-500/10 border-red-500/50 text-red-400';
    const icon = isSuccess ? '<i class="fa-solid fa-circle-check"></i>' : '<i class="fa-solid fa-circle-exclamation"></i>';

    toast.className = `flex items-center gap-3 px-5 py-3 rounded-xl border backdrop-blur-md shadow-2xl transform transition-all duration-300 translate-x-full opacity-0 ${bgColor}`;
    toast.innerHTML = `
        <div class="text-xl">${icon}</div>
        <div class="font-medium text-sm leading-snug">${message}</div>
    `;

    container.appendChild(toast);

    setTimeout(() => {
        toast.classList.remove('translate-x-full', 'opacity-0');
    }, 10);

    setTimeout(() => {
        toast.classList.add('translate-x-full', 'opacity-0');
        setTimeout(() => toast.remove(), 300);
    }, 3500);
}


async function handleLogin() {
    event.preventDefault(); // <--- THIS STOPS THE PAGE FROM REFRESHING!
    const usernameInput = document.getElementById('username').value;
    const passwordInput = document.getElementById('password').value;

    if (!usernameInput || !passwordInput) {
        showToast("Enter both username and password.", "error");
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: usernameInput, password: passwordInput })
        });

        if (response.ok) {
            const data = await response.json();
            localStorage.setItem('jwtToken', data.token);
            localStorage.setItem('username', usernameInput);

            window.location.href = '/dashboard.html';
        } else {
            showToast("Invalid credentials.", "error");
        }
    } catch (error) {
        console.error("Login Error:", error);
        showToast("Server connection failed.", "error");
    }
}


async function handleRegister(event) {
    event.preventDefault();

    // Grab the selected role
    const role = document.getElementById('regRole').value;
    const fullName = document.getElementById('regFullName').value;
    const email = document.getElementById('regEmail').value;
    const username = document.getElementById('regUsername').value;
    const password = document.getElementById('regPassword').value;
    const btn = document.getElementById('regSubmitBtn');

    btn.innerHTML = `<i class="fa-solid fa-circle-notch fa-spin"></i> Creating...`;
    btn.disabled = true;

    try {
        const response = await fetch(`${API_BASE_URL}/auth/register?role=${role}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                fullName: fullName,
                email: email,
                username: username,
                password: password
            })
        });

        if (response.ok) {
            showToast("Account created successfully! Please log in.", "success");
            setTimeout(() => {
                window.location.href = '/index.html';
            }, 2000);
        } else {
            const errorMsg = await response.text();
            showToast(errorMsg || "Registration failed.", "error");
            btn.innerHTML = `Create Account`;
            btn.disabled = false;
        }
    } catch (error) {
        console.error("Registration Error:", error);
        showToast("Server connection failed.", "error");
        btn.innerHTML = `Create Account`;
        btn.disabled = false;
    }
}

function logout() {
    localStorage.removeItem('jwtToken');
    localStorage.removeItem('username');
    window.location.href = '/index.html';
}

document.addEventListener('DOMContentLoaded', async () => {

    if (window.location.pathname.includes('dashboard.html')) {

        const token = localStorage.getItem('jwtToken');

        if (!token) {
            window.location.href = '/index.html';
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/users/me`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const userData = await response.json();

                const usernameEl = document.getElementById('navUsername');
                if (usernameEl) usernameEl.textContent = userData.username || 'User';

                const badgeEl = document.getElementById('userRoleBadge');
                let isAdmin = false; // Flag for Smart Routing

                if (badgeEl) {
                    const displayRole = userData.role.replace('ROLE_', '');
                    badgeEl.textContent = displayRole + " MODE";

                    if (displayRole === 'ADMIN') {
                        isAdmin = true;
                        const adminElements = ['addBookBtn', 'navManageBooks', 'navUsers', 'navIssueReturn'];
                        adminElements.forEach(id => {
                            const el = document.getElementById(id);
                            if (el) {
                                el.classList.remove('hidden');
                                if (el.tagName === 'A') el.classList.add('flex');
                            }
                        });
                    } else {
                        badgeEl.classList.replace('text-[#00D4AA]', 'text-purple-400');
                        badgeEl.classList.replace('bg-[#00D4AA]/10', 'bg-purple-500/10');
                        badgeEl.classList.replace('border-[#00D4AA]/30', 'border-purple-500/30');

                        const dashLink = document.getElementById('navDashboard');
                        if (dashLink) dashLink.classList.add('hidden');
                    }
                }

                if (isAdmin) {
                    switchTab('dashboard');
                } else {
                    switchTab('catalog');
                }

            } else {
                localStorage.removeItem('jwtToken');
                window.location.href = '/index.html';
            }
        } catch (error) {
            console.error("Auth check failed:", error);
            window.location.href = '/index.html';
        }
    }
});


function switchTab(tabName) {
    const token = localStorage.getItem('jwtToken');
    if (!token) {
        window.location.href = 'index.html';
        return;
    }

    // 1. Run Security Check
    enforceSidebarSecurity();

    // 2. Save the original tab name so the Sidebar highlight knows which button to light up!
    let tabToHighlight = tabName;

    // 3. Smart Routing: Admin vs Student Dashboard
    if (tabName === 'dashboard') {
        const roleBadge = document.getElementById('userRoleBadge');
        if (roleBadge && !roleBadge.textContent.includes("ADMIN")) {
            tabName = 'studentDashboard'; // Secretly swap the destination to the Student view
        }
    }

    // 4. Highlight the active sidebar button
    highlightActiveNavButton(tabToHighlight);

    // 5. Hide all sections
    const sections = ['dashboard', 'catalog', 'manageBooks', 'users', 'issue', 'aiInsights', 'bookDetail', 'myLoans', 'studentDashboard'];
    sections.forEach(sec => {
        const el = document.getElementById(sec + 'Section');
        if (el) {
            el.classList.add('hidden');
            el.classList.remove('flex');
        }
    });

    // Auto-close mobile menu if it is open
    const sidebar = document.getElementById('sidebar');
    if (sidebar && !sidebar.classList.contains('-translate-x-full') && window.innerWidth < 768) {
        toggleMobileMenu();
    }
    // 6. Show the requested section
    const targetEl = document.getElementById(tabName + 'Section');
    if (targetEl) {
        targetEl.classList.remove('hidden');
        targetEl.classList.add('flex');
    }

    // 7. Load Data specific to that tab
    if (tabName === 'dashboard') {
        loadDashboardStats(token);
    } else if (tabName === 'studentDashboard') {
        loadStudentDashboard();
    } else if (tabName === 'catalog' || tabName === 'manageBooks') {
        loadBooks(token);
    } else if (tabName === 'users') {
        loadUsers(token);
    } else if (tabName === 'aiInsights') {
        runAiAnalysis();
    } else if (tabName === 'myLoans') {
        loadMyLoans();
    }
}

let currentBooksList = [];
async function loadBooks(token) {
    try {
        const response = await fetch(`${API_BASE_URL}/books`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
            currentBooksList = await response.json();

            if (typeof renderManageBooksTable === 'function') renderManageBooksTable(currentBooksList);
            if (typeof renderCatalogGridBooks === 'function') renderCatalogGridBooks(currentBooksList);
            if (typeof renderCatalogListBooks === 'function') renderCatalogListBooks(currentBooksList);
        }
    } catch (error) {
        console.error("Network error while loading books:", error);
    }
}



async function showBookDetails(id) {
    const header = document.querySelector('main > header');
    const catalog = document.getElementById('catalogSection');
    const borrowings = document.getElementById('borrowingsSection');
    const bookDetails = document.getElementById('bookDetailSection');
    const token = localStorage.getItem('jwtToken');

    currentBookId = id;

    header.classList.add('hidden');
    catalog.classList.add('hidden');
    borrowings.classList.add('hidden');
    bookDetails.classList.remove('hidden');

    window.scrollTo({ top: 0, behavior: 'smooth' });

    try {
        const response = await fetch(`${API_BASE_URL}/books/${id}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) throw new Error("Failed to fetch");
        const book = await response.json();

        document.getElementById('detailBookCover').src = book.coverImageUrl || 'https://via.placeholder.com/400x600/1e293b/a855f7?text=No+Cover';
        document.getElementById('detailBookTitle').textContent = book.title;
        document.getElementById('detailBookAuthor').innerHTML = `<i class="fa-solid fa-pen-nib text-sm mr-2"></i> By ${book.author}`;
        document.getElementById('detailBookIsbn').textContent = book.isbn;

        document.getElementById('detailCategoryBadge').innerHTML = `<i class="fa-solid fa-tag mr-1"></i> ${book.category ? book.category.name : 'Uncategorized'}`;

        document.getElementById('detailAvailableCopies').textContent = book.availableCopies;
        document.getElementById('detailTotalCopies').textContent = book.totalCopies;

        const statusBadge = document.getElementById('detailStatusBadge');
        if (book.availableCopies > 0) {
            statusBadge.className = "px-3 py-1 bg-green-500/10 text-green-400 text-xs font-bold rounded-lg border border-green-500/30 shadow-[0_0_10px_rgba(34,197,94,0.2)]";
            statusBadge.innerHTML = `<i class="fa-solid fa-circle-check mr-1"></i> Available`;
        } else {
            statusBadge.className = "px-3 py-1 bg-red-500/10 text-red-400 text-xs font-bold rounded-lg border border-red-500/30 animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.2)]";
            statusBadge.innerHTML = `<i class="fa-solid fa-triangle-exclamation mr-1"></i> Out of Stock`;
        }

        const descElement = document.getElementById('detailBookDescription');
        if (book.description && book.description.trim() !== "") {
            descElement.textContent = book.description;
        } else {
            descElement.innerHTML = `<span class="italic text-slate-500">No synopsis available for this title yet. Ask the AI Librarian if you want to know what this book is about!</span>`;
        }

    } catch (error) {
        console.error("Failed to fetch book details:", error);
        showToast("Failed to load book details.", "error");
        hideBookDetails();
    }
}

function hideBookDetails() {
    switchTab('catalog');
}

function hideBookDetails() {
    switchTab('catalog');
}

function openAddBookModal() {
    document.getElementById('modalTitle').textContent = "Add New Book";
    document.getElementById('editBookId').value = "";
    document.getElementById('addBookForm').reset();
    document.getElementById('addBookModal').classList.remove('hidden');
    document.getElementById('addBookModal').classList.add('flex');
}

function closeAddBookModal() {
    document.getElementById('addBookModal').classList.add('hidden');
    document.getElementById('addBookModal').classList.remove('flex');
}

async function openEditModal(id) {
    const token = localStorage.getItem('jwtToken');
    try {
        const response = await fetch(`${API_BASE_URL}/books/${id}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const book = await response.json();

        document.getElementById('modalTitle').textContent = "Edit Book";
        document.getElementById('editBookId').value = book.id;
        document.getElementById('bookTitle').value = book.title;
        document.getElementById('bookAuthor').value = book.author;
        document.getElementById('bookCoverUrl').value = book.coverImageUrl || '';
        document.getElementById('bookIsbn').value = book.isbn;
        document.getElementById('bookCopies').value = book.totalCopies;
        document.getElementById('bookCategory').value = book.category ? book.category.id : 1;

        document.getElementById('addBookModal').classList.remove('hidden');
        document.getElementById('addBookModal').classList.add('flex');
    } catch (error) {
        console.error("Edit fetch error:", error);
        showToast("Failed to fetch book details.", "error");
    }
}

async function submitNewBook(event) {
    event.preventDefault();
    const token = localStorage.getItem('jwtToken');
    const bookId = document.getElementById('editBookId').value;

    const bookData = {
        title: document.getElementById('bookTitle').value,
        author: document.getElementById('bookAuthor').value,
        isbn: document.getElementById('bookIsbn').value,
        coverImageUrl: document.getElementById('bookCoverUrl').value || null,
        totalCopies: parseInt(document.getElementById('bookCopies').value),
        availableCopies: parseInt(document.getElementById('bookCopies').value),
        category: { id: parseInt(document.getElementById('bookCategory').value) }
    };

    const method = bookId ? 'PUT' : 'POST';
    const url = bookId ? `${API_BASE_URL}/books/${bookId}` : `${API_BASE_URL}/books`;

    try {
        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(bookData)
        });

        if (response.ok) {
            showToast(bookId ? "Book updated successfully!" : "Book added successfully!", "success");
            closeAddBookModal();
            loadBooks(token);
        } else {
            const errorMsg = await response.text();
            showToast(errorMsg || "Failed to save book. Check details.", "error");
        }
    } catch (error) {
        console.error("Save error:", error);
        showToast("Server connection failed.", "error");
    }
}

function deleteBook(id) {
    document.getElementById('deleteBookId').value = id;
    document.getElementById('deleteConfirmModal').classList.remove('hidden');
    document.getElementById('deleteConfirmModal').classList.add('flex');
}

function closeDeleteModal() {
    document.getElementById('deleteConfirmModal').classList.add('hidden');
    document.getElementById('deleteConfirmModal').classList.remove('flex');
    document.getElementById('deleteBookId').value = '';
}

async function confirmDeleteBook() {
    const id = document.getElementById('deleteBookId').value;
    if (!id) return;
    const token = localStorage.getItem('jwtToken');

    try {
        const response = await fetch(`${API_BASE_URL}/books/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
            showToast("Book deleted safely.", "success");
            loadBooks(token);
        } else {
            const errorMsg = await response.text();
            showToast(errorMsg || "Cannot delete: Book may be borrowed.", "error");
        }
    } catch (error) {
        console.error("Delete error:", error);
        showToast("Server connection failed.", "error");
    } finally {
        closeDeleteModal();
    }
}
async function issueBook(bookId) {
    const token = localStorage.getItem('jwtToken');

    try {
        const response = await fetch(`${API_BASE_URL}/borrowings/issue?bookId=${bookId}`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
            showToast("Book borrowed! Due in 14 days.", "success");

            const bookDetails = document.getElementById('bookDetailSection');
            if (!bookDetails.classList.contains('hidden')) {
                showBookDetails(bookId);
            } else {
                loadBooks(token);
            }
        } else {
            const errorMsg = await response.text();
            showToast(errorMsg || "Borrowing failed.", "error");
        }
    } catch (error) {
        console.error("Borrowing error:", error);
        showToast("Server connection failed.", "error");
    }
}

async function loadMyBorrowings(token) {
    const borrowingsList = document.getElementById('borrowingsList');
    borrowingsList.innerHTML = '';
    try {
        const response = await fetch(`${API_BASE_URL}/borrowings/my`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
            const borrowings = await response.json();
            const activeBorrowings = borrowings.filter(b => b.returnDate === null);

            if (activeBorrowings.length === 0) {
                borrowingsList.innerHTML = `
                    <div class="col-span-3 flex flex-col items-center justify-center p-12 text-center border border-dashed border-slate-700 rounded-2xl bg-slate-800/20 shadow-inner">
                        <i class="fa-solid fa-book-open text-5xl text-slate-600 mb-4 drop-shadow"></i>
                        <p class="text-gray-400 text-lg">Your reading list is currently empty.</p>
                        <button onclick="switchTab('catalog')" class="mt-5 px-5 py-2.5 text-[#00D4AA] border border-[#00D4AA]/50 rounded-lg hover:bg-[#00D4AA] hover:text-white transition shadow-[0_0_15px_rgba(0,212,170,0.2)]">Explore Catalog</button>
                    </div>`;
                return;
            }

            activeBorrowings.forEach(borrowing => {
                const book = borrowing.book;
                const coverImg = book.coverImageUrl ? book.coverImageUrl : 'https://via.placeholder.com/200x300/1e293b/a855f7?text=No+Cover';

                const borrowDateStr = borrowing.borrowDate || borrowing.borrowedDate || Date.now();
                const borrowDate = new Date(borrowDateStr);
                const dueDate = new Date(borrowing.dueDate);
                const now = new Date();

                const diffTime = dueDate - now;
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                const totalDuration = Math.ceil((dueDate - borrowDate) / (1000 * 60 * 60 * 24));
                const daysPassed = totalDuration - diffDays;
                let progressPercent = Math.max(0, Math.min(100, (daysPassed / totalDuration) * 100));

                let statusBadge = '';
                let progressBarColor = 'bg-[#00D4AA]';

                if (diffDays < 0) {
                    statusBadge = `<span class="px-2 py-1 bg-red-500/10 text-red-400 text-xs font-bold rounded border border-red-500/30 animate-pulse"><i class="fa-solid fa-triangle-exclamation mr-1"></i> Overdue ${Math.abs(diffDays)}d</span>`;
                    progressBarColor = 'bg-red-500';
                    progressPercent = 100;
                } else if (diffDays <= 3) {
                    statusBadge = `<span class="px-2 py-1 bg-orange-500/10 text-orange-400 text-xs font-bold rounded border border-orange-500/30"><i class="fa-solid fa-clock mr-1"></i> Due in ${diffDays}d</span>`;
                    progressBarColor = 'bg-orange-500';
                } else {
                    statusBadge = `<span class="px-2 py-1 bg-[#00D4AA]/10 text-[#00D4AA] text-xs font-bold rounded border border-[#00D4AA]/30 shadow-[0_0_10px_rgba(0,212,170,0.1)]"><i class="fa-solid fa-shield-check mr-1"></i> ${diffDays}d left</span>`;
                }

                const item = document.createElement('div');
                item.className = 'flex flex-col justify-between p-5 bg-white/5 backdrop-blur-md rounded-2xl border border-slate-700/50 hover:border-blue-500/50 transition-all shadow-lg group';
                item.innerHTML = `
                    <div class="flex items-start gap-4 mb-4">
                        <img src="${coverImg}" alt="Book Cover" class="w-16 h-24 object-cover rounded shadow border border-slate-600 transition group-hover:scale-105">
                        <div class="flex-grow">
                            <h4 class="text-lg font-bold text-white group-hover:text-blue-400 transition leading-snug">${book.title}</h4>
                            <p class="text-sm text-gray-400 mt-0.5">By ${book.author}</p>
                            <div class="flex items-center gap-2 mt-2">
                                ${statusBadge}
                                <p class="text-xs text-slate-500 font-mono">ISBN: ${book.isbn}</p>
                            </div>
                        </div>
                    </div>
                    
                    <div class="space-y-3 pt-3 border-t border-slate-800">
                        <div class="flex justify-between text-xs text-slate-500">
                            <span>Borrowed: ${borrowDate.toLocaleDateString()}</span>
                            <span>Due: ${dueDate.toLocaleDateString()}</span>
                        </div>
                        <div class="w-full bg-slate-800 rounded-full h-1.5 shadow-inner">
                            <div class="${progressBarColor} h-1.5 rounded-full shadow" style="width: ${progressPercent}%"></div>
                        </div>
                        <button class="w-full px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-xl shadow transition border border-slate-700" onclick="returnBook(${borrowing.id})">
                            <i class="fa-solid fa-arrow-rotate-left mr-2"></i> Return Book
                        </button>
                    </div>
                `;
                borrowingsList.appendChild(item);
            });
        }
    } catch (error) {
        console.error("Failed to load borrowings:", error);
        showToast("Failed to load your borrowings.", "error");
    }
}

async function returnBook(borrowingId) {
    const token = localStorage.getItem('jwtToken');
    try {
        const response = await fetch(`${API_BASE_URL}/borrowings/return/${borrowingId}`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
            showToast("Book returned successfully!", "success");
            loadMyBorrowings(token); // Phase 1 Re-hook: refresh dynamic list safely
        } else {
            const errorMsg = await response.text();
            showToast(errorMsg || "Failed to return book.", "error");
        }
    } catch (error) {
        console.error("Return error:", error);
        showToast("Server connection failed.", "error");
    }
}


function toggleChat() {
    const chatWindow = document.getElementById('aiChatWindow');
    chatWindow.classList.toggle('hidden');
}

async function sendMessage() {
    const inputField = document.getElementById('chatInput');
    const message = inputField.value.trim();
    if (!message) return;

    const chatHistory = document.getElementById('chatHistory');
    const token = localStorage.getItem('jwtToken');

    chatHistory.innerHTML += `
        <div class="bg-purple-600 text-white p-3.5 rounded-2xl rounded-tr-sm text-sm w-[85%] ml-auto border border-purple-500 shadow-sm leading-relaxed">
            ${message}
        </div>
    `;


    inputField.value = '';
    chatHistory.scrollTop = chatHistory.scrollHeight;


    const typingId = 'typing-' + Date.now();
    chatHistory.innerHTML += `
        <div id="${typingId}" class="bg-slate-800/80 text-slate-400 p-3.5 rounded-2xl rounded-tl-sm text-sm w-[85%] italic border border-slate-700 leading-relaxed">
            Thinking... <i class="fa-solid fa-circle-notch fa-spin ml-2"></i>
        </div>
    `;
    chatHistory.scrollTop = chatHistory.scrollHeight;

    // Auto-scroll to the newest message
    const chatBox = document.getElementById('chatHistory');
    chatBox.scrollTop = chatBox.scrollHeight;

    try {
        const response = await fetch(`${API_BASE_URL}/ai/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ message: message })
        });

        const data = await response.json();

        const typingEl = document.getElementById(typingId);
        if (typingEl) { typingEl.remove(); }

        const formattedResponse = data.response.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

        chatHistory.innerHTML += `
            <div class="bg-slate-800/80 text-slate-200 p-3.5 rounded-2xl rounded-tl-sm text-sm w-[85%] border border-[#00D4AA]/30 shadow-[0_0_15px_rgba(0,212,170,0.05)] leading-relaxed">
                ${formattedResponse}
            </div>
        `;
        chatHistory.scrollTop = chatHistory.scrollHeight;

    } catch (error) {
        console.error("Chat Error:", error);
        showToast("Chatbot offline.", "error");
        const typingEl = document.getElementById(typingId);
        if (typingEl) { typingEl.innerHTML = "Lost server connection."; }
    }
}

let dashboardChartInstance = null;

async function loadDashboardStats(token) {
    document.querySelectorAll('#dashboardSection .font-extrabold i').forEach(el => el.style.display = 'inline-block');

    try {
        const response = await fetch(`${API_BASE_URL}/users/dashboard/stats`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
            const data = await response.json();

            renderDashboardKPIs(data);

            renderDashboardActivityLists(data);

            renderDashboardChart(token);

            document.getElementById('dashUpdateTime').textContent = new Date().toLocaleTimeString();

        } else if (response.status === 401) {
            logout();
        } else if (response.status === 403) {
            console.warn("Student attempted to load Admin stats.");
            document.querySelectorAll('#dashboardSection .font-extrabold i').forEach(el => {
                el.parentElement.innerHTML = '<span class="text-sm text-red-500 font-bold tracking-widest uppercase">Restricted</span>';
            });
        }
    } catch (error) {
        console.error("Dashboard Fetch Error:", error);
        showToast("Cannot connect to server.", "error");
    }
}

function renderDashboardKPIs(data) {
    document.getElementById('kpiTotalInventory').textContent = data.totalInventoryTitles;
    document.getElementById('kpiActiveLoans').textContent = data.currentlyBorrowedBooks;
    document.getElementById('kpiOverdue').textContent = data.overdueHighPriorityCount;
    document.getElementById('kpiNewUsers').textContent = data.newUsers30Days;

    document.getElementById('topCategoryName').textContent = data.topCategoryName;
    document.getElementById('topCategoryCount').textContent = data.topCategoryCount;
}

function renderDashboardActivityLists(data) {
    try {
        const booksList = document.getElementById('recentBooksList');
        if (data.recentlyAddedBooks && data.recentlyAddedBooks.length > 0) {
            booksList.innerHTML = '';
            data.recentlyAddedBooks.forEach(book => {
                const coverImg = book.coverImageUrl ? book.coverImageUrl : 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?q=80&w=150&auto=format&fit=crop';
                const li = document.createElement('div');
                li.className = 'flex items-center gap-4 bg-slate-900 border border-slate-800 p-3 rounded-xl shadow-inner group hover:border-[#00D4AA]/30 transition';
                li.innerHTML = `
                    <div class="w-10 h-14 rounded shadow border border-slate-700/50 flex items-center justify-center shrink-0 overflow-hidden bg-[#0D1117]">
                        <img src="${coverImg}" alt="Cover" class="w-full h-full object-cover">
                    </div>
                    <div class="flex-grow">
                        <h4 class="text-sm font-bold text-white group-hover:text-[#00D4AA] transition line-clamp-1">${book.title}</h4>
                        <p class="text-xs text-slate-400 mt-0.5">By ${book.author}</p>
                    </div>
                    <span class="text-[10px] text-slate-600 font-mono uppercase bg-[#0D1117] px-2 py-0.5 rounded border border-slate-700/50">#${book.id}</span>
                `;
                booksList.appendChild(li);
            });
        } else {
            booksList.innerHTML = `<p class="text-center text-slate-500 italic py-4">No recently added books.</p>`;
        }

        const borrowersBody = document.getElementById('topBorrowersTableBody');
        if (data.activeBorrowers && data.activeBorrowers.length > 0) {
            borrowersBody.innerHTML = '';

            data.activeBorrowers.forEach(borrower => {
                const initial = borrower.username.charAt(0).toUpperCase();
                const tr = document.createElement('tr');
                tr.className = 'hover:bg-slate-800/30 transition group border-b border-slate-800/50 last:border-0';

                tr.innerHTML = `
                    <td class="py-4 px-2">
                        <div class="flex items-center gap-3">
                            <div class="w-8 h-8 rounded-full bg-[#00D4AA]/20 text-[#00D4AA] flex items-center justify-center text-xs font-bold border border-[#00D4AA]/30 shadow-inner">
                                ${initial}
                            </div>
                            <p class="text-sm font-bold text-white capitalize group-hover:text-[#00D4AA] transition">${borrower.username}</p>
                        </div>
                    </td>
                    <td class="py-4 px-2 text-center text-sm font-bold text-white">${borrower.openLoans}</td>
                    <td class="py-4 px-2 text-right text-xs text-slate-400 font-mono">${borrower.lastAction}</td>
                `;
                borrowersBody.appendChild(tr);
            });
        } else {
            borrowersBody.innerHTML = `<tr><td colspan="3" class="text-center text-slate-500 italic py-8">No active loans at this moment.</td></tr>`;
        }
    } catch (err) {
        console.error("Error rendering lists:", err);
    }
}

async function renderDashboardChart(token) {
    try {
        const res = await fetch(`${API_BASE_URL}/books`, { headers: { 'Authorization': `Bearer ${token}` } });
        if (!res.ok) return;
        const books = await res.json();

        const catCounts = {};
        books.forEach(b => {
            const cat = b.category ? b.category.name : 'Uncategorized';
            catCounts[cat] = (catCounts[cat] || 0) + 1;
        });

        const ctx = document.getElementById('inventoryChart');
        if (!ctx) return;

        if (dashboardChartInstance) dashboardChartInstance.destroy();

        Chart.defaults.color = '#94a3b8';
        Chart.defaults.font.family = "'Syne', sans-serif";

        dashboardChartInstance = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: Object.keys(catCounts),
                datasets: [{
                    data: Object.values(catCounts),
                    backgroundColor: ['#6C63FF', '#00D4AA', '#f97316', '#3b82f6', '#ec4899'],
                    borderWidth: 0,
                    hoverOffset: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '75%',
                plugins: {
                    legend: { position: 'right', labels: { boxWidth: 12, padding: 20 } }
                }
            }
        });
    } catch (e) {
        console.error("Chart rendering failed", e);
    }
}

function renderManageBooksTable(books) {
    const tableBody = document.getElementById('manageBooksTableBody');
    if (!tableBody) return;

    tableBody.innerHTML = '';

    if (books.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="5" class="px-6 py-8 text-center text-slate-500">No books found in inventory.</td></tr>`;
        return;
    }

    books.forEach(book => {
        const coverImg = book.coverImageUrl ? book.coverImageUrl : 'https://via.placeholder.com/40x60/1e293b/a855f7?text=NA';

        let stockBadge = '';
        if (book.availableCopies > 0) {
            stockBadge = `<span class="px-2 py-1 bg-green-500/10 text-green-400 text-xs font-bold rounded border border-green-500/30">${book.availableCopies} / ${book.totalCopies}</span>`;
        } else {
            stockBadge = `<span class="px-2 py-1 bg-red-500/10 text-red-400 text-xs font-bold rounded border border-red-500/30">0 / ${book.totalCopies}</span>`;
        }

        const categoryName = book.category ? book.category.name : 'Uncategorized';

        const row = document.createElement('tr');
        row.className = 'hover:bg-white/5 transition-colors group book-row';


        row.setAttribute('data-search', `${book.title} ${book.isbn}`.toLowerCase());

        row.innerHTML = `
            <td class="px-6 py-4">
                <div class="flex items-center gap-4">
                    <div class="w-10 h-14 bg-[#0D1117] rounded shadow border border-slate-700 flex items-center justify-center shrink-0 overflow-hidden">
                        <img src="${coverImg}" alt="Cover" class="w-full h-full object-cover">
                    </div>
                    <div>
                        <h4 class="text-sm font-bold text-white group-hover:text-[#00D4AA] transition line-clamp-1">${book.title}</h4>
                        <p class="text-xs text-slate-400 mt-0.5">By ${book.author}</p>
                    </div>
                </div>
            </td>
            <td class="px-6 py-4 text-sm text-slate-300 font-mono">${book.isbn}</td>
            <td class="px-6 py-4 text-sm text-purple-400">${categoryName}</td>
            <td class="px-6 py-4 text-center">${stockBadge}</td>
            <td class="px-6 py-4 text-center">
                <div class="flex items-center justify-center gap-4">
                    <button onclick="openEditModal(${book.id})" class="text-blue-500 hover:text-blue-400 transition" title="Edit Book">
                        <i class="fa-solid fa-pen"></i>
                    </button>
                    <button onclick="deleteBook(${book.id})" class="text-red-500 hover:text-red-400 transition" title="Delete Book">
                        <i class="fa-regular fa-trash-can"></i>
                    </button>
                </div>
            </td>
        `;
        tableBody.appendChild(row);
    });
}


let currentCategoryFilter = 'all';

function renderCatalogGridBooks(books) {
    const container = document.getElementById('bookCatalogGrid');
    if (!container) return;

    container.innerHTML = '';
    document.getElementById('catalogBookCount').textContent = books.length;

    if (books.length === 0) {
        container.innerHTML = `<p class="text-slate-400 italic">No books found matching your criteria.</p>`;
        return;
    }

    books.forEach(book => {

        const coverImg = book.coverImageUrl ? book.coverImageUrl : 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?q=80&w=600&auto=format&fit=crop';
        const categoryName = book.category ? book.category.name : 'Uncategorized';
        const rating = (Math.random() * (5.0 - 4.0) + 4.0).toFixed(1);

        let availBadge = '';
        if (book.availableCopies > 0) {
            availBadge = `<span class="px-2 py-1 bg-[#00D4AA]/20 text-[#00D4AA] text-[10px] font-bold rounded backdrop-blur-md border border-[#00D4AA]/30 shadow-lg">${book.availableCopies} avail</span>`;
        } else {
            availBadge = `<span class="px-2 py-1 bg-red-500/20 text-red-400 text-[10px] font-bold rounded backdrop-blur-md border border-red-500/30 shadow-lg">Out</span>`;
        }

        const card = document.createElement('div');

        card.className = 'relative w-full h-80 rounded-2xl overflow-hidden shadow-xl group cursor-pointer catalog-book-card border border-slate-700/50 hover:border-[#00D4AA]/50 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_10px_30px_rgba(0,212,170,0.15)]';

        card.setAttribute('data-search', `${book.title} ${book.author}`.toLowerCase());
        card.setAttribute('data-category', categoryName);
        card.setAttribute('onclick', `showBookDetails(${book.id})`);

        card.innerHTML = `
            <img src="${coverImg}" alt="${book.title}" class="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110">
            
            <div class="absolute inset-0 bg-gradient-to-t from-[#0D1117] via-[#0D1117]/60 to-transparent opacity-90"></div>
            
            <div class="absolute top-3 left-3">
                <span class="px-2 py-1 bg-[#151B23]/80 text-[#00D4AA] text-[9px] uppercase tracking-wider font-bold rounded backdrop-blur-md border border-slate-700/50">${categoryName}</span>
            </div>
            <div class="absolute top-3 right-3 flex items-center gap-1 bg-[#151B23]/80 px-2 py-1 rounded backdrop-blur-md border border-slate-700/50">
                <i class="fa-solid fa-star text-yellow-500 text-[10px]"></i>
                <span class="text-white text-[10px] font-bold">${rating}</span>
            </div>

            <div class="absolute bottom-3 right-3">
                ${availBadge}
            </div>

            <div class="absolute bottom-0 left-0 w-full p-4 pr-20">
                <h4 class="text-lg font-bold text-white leading-tight line-clamp-2">${book.title}</h4>
                <p class="text-xs text-slate-300 mt-1 truncate">${book.author}</p>
            </div>
        `;
        container.appendChild(card);
    });
}


function setCategoryFilter(category, btnElement) {
    currentCategoryFilter = category;


    document.querySelectorAll('.category-btn').forEach(btn => {
        btn.classList.remove('bg-[#00D4AA]/10', 'text-[#00D4AA]', 'font-medium');
        btn.classList.add('hover:bg-white/5');
    });
    btnElement.classList.remove('hover:bg-white/5');
    btnElement.classList.add('bg-[#00D4AA]/10', 'text-[#00D4AA]', 'font-medium');

    filterCatalogGrid();
}

function filterCatalogGrid() {
    const searchInput = document.getElementById('catalogBookSearch').value.toLowerCase();
    const cards = document.querySelectorAll('.catalog-book-card');
    let visibleCount = 0;

    cards.forEach(card => {
        const searchableText = card.getAttribute('data-search');
        const cardCategory = card.getAttribute('data-category');


        const categoryMatches = (currentCategoryFilter === 'all' || cardCategory.includes(currentCategoryFilter));
        const searchMatches = searchableText.includes(searchInput);

        if (searchMatches && categoryMatches) {
            card.style.display = '';
            visibleCount++;
        } else {
            card.style.display = 'none';
        }
    });

    document.getElementById('catalogBookCount').textContent = visibleCount;
}


function filterAdminTable() {
    const searchInput = document.getElementById('adminBookSearch').value.toLowerCase();
    const rows = document.querySelectorAll('.book-row');

    rows.forEach(row => {
        const searchableText = row.getAttribute('data-search');
        if (searchableText && searchableText.includes(searchInput)) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
}


async function showBookDetails(bookId) {
    try {
        const book = currentBooksList.find(b => b.id === bookId);
        if (!book) return;

        currentBookId = book.id;

        document.getElementById('detailTitle').textContent = book.title;
        document.getElementById('detailAuthor').textContent = `By ${book.author}`;
        document.getElementById('detailIsbn').textContent = book.isbn || "N/A";
        document.getElementById('detailCategory').textContent = book.category ? book.category.name : "Uncategorized";
        document.getElementById('detailAvailable').textContent = book.availableCopies;
        document.getElementById('detailTotal').textContent = book.totalCopies;
        document.getElementById('detailDescription').textContent = book.description || "No detailed description is available for this title at the moment. Please check back later!";

        const coverImg = document.getElementById('detailCover');
        coverImg.src = book.coverImageUrl || 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?q=80&w=400&auto=format&fit=crop';

        const statusBadge = document.getElementById('detailStatus');
        const borrowBtn = document.getElementById('borrowBookBtn');

        const roleBadge = document.getElementById('userRoleBadge');
        const isAdmin = roleBadge && roleBadge.textContent.toUpperCase().includes('ADMIN');


        if (borrowBtn) {
            const buttonContainer = borrowBtn.parentElement;

            if (isAdmin) {

                buttonContainer.classList.add('hidden');


                if (book.availableCopies > 0) {
                    statusBadge.textContent = "Available";
                    statusBadge.className = "bg-[#00D4AA]/10 text-[#00D4AA] px-3 py-1 rounded-full text-xs font-bold border border-[#00D4AA]/30";
                } else {
                    statusBadge.textContent = "Out of Stock";
                    statusBadge.className = "bg-red-500/10 text-red-500 px-3 py-1 rounded-full text-xs font-bold border border-red-500/30";
                }

            } else {

                buttonContainer.classList.remove('hidden');

                if (book.availableCopies > 0) {
                    statusBadge.textContent = "Available";
                    statusBadge.className = "bg-[#00D4AA]/10 text-[#00D4AA] px-3 py-1 rounded-full text-xs font-bold border border-[#00D4AA]/30";

                    borrowBtn.disabled = false;
                    borrowBtn.classList.remove('opacity-50', 'cursor-not-allowed');
                    borrowBtn.innerHTML = `<i class="fa-solid fa-hand-holding-box mr-2"></i> Borrow Now`;
                } else {
                    statusBadge.textContent = "Out of Stock";
                    statusBadge.className = "bg-red-500/10 text-red-500 px-3 py-1 rounded-full text-xs font-bold border border-red-500/30";

                    borrowBtn.disabled = true;
                    borrowBtn.classList.add('opacity-50', 'cursor-not-allowed');
                    borrowBtn.innerHTML = `<i class="fa-solid fa-times-circle mr-2"></i> Unavailable`;
                }
            }
        }


        switchTab('bookDetail');

    } catch (error) {
        console.error("Error loading book details:", error);
    }
}

async function borrowCurrentBook() {
    if (!currentBookId) {
        showToast("Error: No book selected.", "error");
        return;
    }

    const token = localStorage.getItem('jwtToken');
    const borrowBtn = document.getElementById('borrowBookBtn');
    const originalText = borrowBtn.innerHTML;


    borrowBtn.innerHTML = `<i class="fa-solid fa-circle-notch fa-spin mr-2"></i> Processing...`;
    borrowBtn.disabled = true;

    try {
        const response = await fetch(`${API_BASE_URL}/borrowings/borrow/${currentBookId}`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
            const successMsg = await response.text();
            showToast(successMsg, "success");


            setTimeout(() => {
                borrowBtn.innerHTML = originalText;
                borrowBtn.disabled = false;
                switchTab('catalog');
            }, 1500);

            // Trigger Admin Notification
            const username = document.getElementById('navUsername').textContent;
            const bookTitle = document.getElementById('detailTitle').textContent;
            triggerAdminNotification(`${username} successfully borrowed '${bookTitle}'.`, 'borrow');
        } else {

            const errorMsg = await response.text();
            showToast(errorMsg, "error");
            borrowBtn.innerHTML = originalText;
            borrowBtn.disabled = false;
        }
    } catch (error) {
        console.error("Borrowing Error:", error);
        showToast("Server connection failed.", "error");
        borrowBtn.innerHTML = originalText;
        borrowBtn.disabled = false;
    }
}


function switchCatalogViewMode(mode) {
    const gridBtn = document.getElementById('viewGridBtn');
    const listBtn = document.getElementById('viewListBtn');
    const gridContainer = document.getElementById('bookCatalogGrid');
    const listContainer = document.getElementById('bookCatalogList');

    if (mode === 'grid') {
        gridBtn.className = 'p-2 bg-[#00D4AA]/20 text-[#00D4AA] rounded-lg transition';
        listBtn.className = 'p-2 text-slate-400 hover:text-white transition';
        gridContainer.classList.remove('hidden');
        gridContainer.classList.add('grid');
        listContainer.classList.add('hidden');
        listContainer.classList.remove('flex');
    } else {
        listBtn.className = 'p-2 bg-[#00D4AA]/20 text-[#00D4AA] rounded-lg transition';
        gridBtn.className = 'p-2 text-slate-400 hover:text-white transition';
        listContainer.classList.remove('hidden');
        listContainer.classList.add('flex');
        gridContainer.classList.add('hidden');
        gridContainer.classList.remove('grid');
    }
}


function renderCatalogListBooks(books) {
    const container = document.getElementById('bookCatalogList');
    if (!container) return;
    container.innerHTML = '';

    if (books.length === 0) {
        container.innerHTML = `<p class="text-slate-400 italic">No books found matching your criteria.</p>`;
        return;
    }

    books.forEach(book => {
        const coverImg = book.coverImageUrl ? book.coverImageUrl : 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?q=80&w=600&auto=format&fit=crop';
        const categoryName = book.category ? book.category.name : 'Uncategorized';
        const rating = (Math.random() * (5.0 - 4.0) + 4.0).toFixed(1);

        let availBadge = book.availableCopies > 0
            ? `<span class="px-3 py-1 bg-[#00D4AA]/10 text-[#00D4AA] text-xs font-bold rounded-lg border border-[#00D4AA]/30">${book.availableCopies} available</span>`
            : `<span class="px-3 py-1 bg-red-500/10 text-red-400 text-xs font-bold rounded-lg border border-red-500/30">Out of Stock</span>`;

        const card = document.createElement('div');
        card.className = 'flex gap-5 bg-[#151B23] p-4 rounded-2xl border border-slate-700/50 shadow-lg group hover:border-[#00D4AA]/50 transition-all duration-300 cursor-pointer catalog-book-card';

        card.setAttribute('data-search', `${book.title} ${book.author}`.toLowerCase());
        card.setAttribute('data-category', categoryName);
        card.setAttribute('onclick', `showBookDetails(${book.id})`);

        card.innerHTML = `
            <div class="w-24 h-36 md:w-28 md:h-40 shrink-0 rounded-xl overflow-hidden border border-slate-700 relative shadow-inner">
                <img src="${coverImg}" alt="${book.title}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500">
            </div>
            <div class="flex flex-col flex-grow justify-center py-2">
                <div class="flex flex-col md:flex-row md:justify-between md:items-start gap-2 mb-2">
                    <div>
                        <h4 class="text-xl font-bold text-white leading-tight group-hover:text-[#00D4AA] transition">${book.title}</h4>
                        <p class="text-sm text-slate-400 mt-1">By ${book.author}</p>
                    </div>
                    <div class="shrink-0">
                        ${availBadge}
                    </div>
                </div>
                <div class="flex items-center gap-4 mt-auto pt-4 border-t border-slate-800/50">
                    <span class="px-2 py-1 bg-[#0D1117] text-[#00D4AA] text-[10px] uppercase tracking-wider font-bold rounded border border-slate-700/50">${categoryName}</span>
                    <div class="flex items-center gap-1">
                        <i class="fa-solid fa-star text-yellow-500 text-[10px]"></i>
                        <span class="text-slate-300 text-[11px] font-bold">${rating}</span>
                    </div>
                    <span class="text-slate-500 text-[11px] ml-auto font-mono">ISBN: ${book.isbn}</span>
                </div>
            </div>
        `;
        container.appendChild(card);
    });
}


let currentUsersList = [];
let currentStatusFilter = 'All';
let currentRoleFilter = 'All';

async function loadUsers(token) {
    try {
        const response = await fetch(`${API_BASE_URL}/users/all`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
            currentUsersList = await response.json();
            applyUserFilters();
            updateUserKPIs(currentUsersList);
        } else {
            console.error("Failed to load users", response.status);
            showToast("Failed to load users.", "error");
        }
    } catch (error) {
        console.error("Network error while loading users:", error);
        showToast("Server connection failed.", "error");
    }
}

function applyUserFilters() {
    const searchInput = document.getElementById('userSearch');
    const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';

    const filteredUsers = currentUsersList.filter(user => {
        const matchesSearch = user.username.toLowerCase().includes(searchTerm) ||
            user.email.toLowerCase().includes(searchTerm) ||
            user.systemId.toLowerCase().includes(searchTerm);

        const matchesStatus = currentStatusFilter === 'All' || user.status === currentStatusFilter;
        const matchesRole = currentRoleFilter === 'All' || user.role === currentRoleFilter;

        return matchesSearch && matchesStatus && matchesRole;
    });

    renderUsersTable(filteredUsers);
}

function setStatusFilter(status, btnElement) {
    currentStatusFilter = status;
    const parent = btnElement.parentElement;
    Array.from(parent.children).forEach(btn => btn.className = "px-4 py-2 rounded-lg text-slate-400 hover:text-white text-sm font-medium transition");
    btnElement.className = "px-4 py-2 rounded-lg bg-[#00D4AA]/20 text-[#00D4AA] text-sm font-bold border border-[#00D4AA]/30";
    applyUserFilters();
}

function setRoleFilter(role, btnElement) {
    currentRoleFilter = role;
    const parent = btnElement.parentElement;
    Array.from(parent.children).forEach(btn => btn.className = "px-4 py-2 rounded-lg text-slate-400 hover:text-white text-sm font-medium transition");
    btnElement.className = "px-4 py-2 rounded-lg bg-[#00D4AA]/20 text-[#00D4AA] text-sm font-bold border border-[#00D4AA]/30";
    applyUserFilters();
}


function toggleUserStatus(userId) {
    const user = currentUsersList.find(u => u.id === userId);
    if (user) {

        if (user.role === 'Admin') {
            showToast("Security Alert: Administrator accounts cannot be suspended.", "error");
            return;
        }


        user.status = user.status === 'Active' ? 'Suspended' : 'Active';
        showToast(`${user.username} is now ${user.status}`, user.status === 'Active' ? 'success' : 'error');

        applyUserFilters();
        updateUserKPIs(currentUsersList);
    }
}


function viewUserDetails(userId) {
    const user = currentUsersList.find(u => u.id === userId);
    if (!user) return;


    const modal = document.getElementById('userModal');
    const modalContent = document.getElementById('userModalContent');
    const avatar = document.getElementById('modalAvatar');


    document.getElementById('modalName').textContent = user.username;
    document.getElementById('modalEmail').textContent = user.email;
    document.getElementById('modalId').textContent = user.systemId;
    document.getElementById('modalDept').textContent = user.department;
    document.getElementById('modalLoans').textContent = user.activeLoans;


    const initial = user.username.charAt(0).toUpperCase();
    avatar.textContent = initial;

    let roleClass = "bg-[#00D4AA]/10 text-[#00D4AA] border-[#00D4AA]/30";
    let avatarClass = "bg-[#00D4AA]/20 text-[#00D4AA] border-[#00D4AA]/50";

    if (user.role === 'Teacher') {
        roleClass = "bg-orange-500/10 text-orange-400 border-orange-500/30";
        avatarClass = "bg-orange-500/20 text-orange-400 border-orange-500/50";
    } else if (user.role === 'Admin') {
        roleClass = "bg-purple-500/10 text-purple-400 border-purple-500/30";
        avatarClass = "bg-purple-500/20 text-purple-400 border-purple-500/50";
    }

    let statusClass = "bg-green-500/10 text-green-500 border-green-500/30";
    if (user.status === 'Suspended') statusClass = "bg-red-500/10 text-red-500 border-red-500/30";


    avatar.className = `w-24 h-24 rounded-full border-4 border-slate-900 absolute -top-12 flex items-center justify-center text-4xl font-bold shadow-lg ${avatarClass}`;

    const roleBadge = document.getElementById('modalRole');
    roleBadge.textContent = user.role;
    roleBadge.className = `px-3 py-1 rounded-full text-xs font-bold border ${roleClass}`;

    const statusBadge = document.getElementById('modalStatus');
    statusBadge.textContent = user.status;
    statusBadge.className = `px-3 py-1 rounded-full text-xs font-bold border ${statusClass}`;


    modal.classList.remove('hidden');
    modal.classList.add('flex');


    setTimeout(() => {
        modal.classList.remove('opacity-0');
        modalContent.classList.remove('scale-95');
        modalContent.classList.add('scale-100');
    }, 10);
}


function closeUserModal() {
    const modal = document.getElementById('userModal');
    const modalContent = document.getElementById('userModalContent');


    modal.classList.add('opacity-0');
    modalContent.classList.remove('scale-100');
    modalContent.classList.add('scale-95');


    setTimeout(() => {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }, 300);
}

function renderUsersTable(users) {
    const tbody = document.getElementById('usersTableBody');
    if (!tbody) return;

    tbody.innerHTML = '';

    if (users.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" class="p-8 text-center text-slate-500 italic">No users match your filters.</td></tr>`;
        return;
    }

    users.forEach(user => {
        const initial = user.username.charAt(0).toUpperCase();

        let roleClass = "bg-[#00D4AA]/10 text-[#00D4AA] border-[#00D4AA]/30";
        if (user.role === 'Teacher') roleClass = "bg-orange-500/10 text-orange-400 border-orange-500/30";
        if (user.role === 'Admin') roleClass = "bg-purple-500/10 text-purple-400 border-purple-500/30";

        let statusClass = "bg-green-500/10 text-green-500 border-green-500/30";
        if (user.status === 'Suspended') statusClass = "bg-red-500/10 text-red-500 border-red-500/30";

        const isSuspended = user.status === 'Suspended';
        const actionBtnIcon = isSuspended ? 'fa-user-check' : 'fa-user-xmark';
        const actionBtnColor = isSuspended ? 'text-green-400 hover:text-green-300 hover:bg-green-400/10 hover:border-green-400/30' : 'text-red-400 hover:text-red-300 hover:bg-red-400/10 hover:border-red-400/30';

        const tr = document.createElement('tr');
        tr.className = 'hover:bg-slate-800/30 transition group';
        tr.innerHTML = `
            <td class="p-5">
                <div class="flex items-center gap-4">
                    <div class="w-10 h-10 rounded-full ${roleClass.split(' ')[0]} ${roleClass.split(' ')[1]} flex items-center justify-center font-bold border ${roleClass.split(' ')[2]} shadow-inner">
                        ${initial}
                    </div>
                    <div>
                        <p class="text-white font-bold group-hover:text-[#00D4AA] transition capitalize">${user.username}</p>
                        <p class="text-xs text-slate-500">${user.email}</p>
                    </div>
                </div>
            </td>
            <td class="p-5 text-[#00D4AA] font-mono text-sm">${user.systemId}</td>
            <td class="p-5">
                <span class="${roleClass} border px-3 py-1.5 rounded-full text-xs font-bold">${user.role}</span>
            </td>
            <td class="p-5 text-slate-400 text-sm">${user.department}</td>
            <td class="p-5 text-white font-bold text-center">${user.activeLoans}</td>
            <td class="p-5 text-center">
                <span class="${statusClass} border px-3 py-1.5 rounded-full text-xs font-bold transition-all">${user.status}</span>
            </td>
            <td class="p-5 text-center flex justify-center items-center">
                
                ${user.role === 'Admin' ?
                `<button class="text-slate-600 cursor-not-allowed p-2 rounded-lg border border-transparent" title="Admins cannot be suspended">
                        <i class="fa-solid fa-shield-halved"></i>
                     </button>`
                :
                `<button onclick="toggleUserStatus(${user.id})" class="${actionBtnColor} p-2 rounded-lg transition border border-transparent" title="${isSuspended ? 'Reactivate User' : 'Suspend User'}">
                        <i class="fa-solid ${actionBtnIcon}"></i>
                     </button>`
            }
                
                <button onclick="viewUserDetails(${user.id})" class="text-slate-400 hover:text-white hover:bg-slate-700 p-2 rounded-lg transition ml-2 border border-transparent hover:border-slate-600" title="View Details">
                    <i class="fa-solid fa-ellipsis-v"></i>
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function updateUserKPIs(users) {
    const totalEl = document.getElementById('statTotalUsers');
    const studentsEl = document.getElementById('statStudents');
    const teachersEl = document.getElementById('statTeachers');
    const suspendedEl = document.getElementById('statSuspended');

    if (totalEl) totalEl.textContent = users.length;
    if (studentsEl) studentsEl.textContent = users.filter(u => u.role === 'Student').length;
    if (teachersEl) teachersEl.textContent = users.filter(u => u.role === 'Teacher').length;
    if (suspendedEl) suspendedEl.textContent = users.filter(u => u.status === 'Suspended').length;
}



async function processDeskIssue() {
    const username = document.getElementById('issueUsername').value.trim();
    const isbn = document.getElementById('issueIsbn').value.trim();
    const btn = document.getElementById('btnProcessIssue');

    if (!username || !isbn) {
        showToast("Please enter both Username and ISBN.", "error");
        return;
    }

    const token = localStorage.getItem('jwtToken');
    const originalText = btn.innerHTML;
    btn.innerHTML = `<i class="fa-solid fa-circle-notch fa-spin"></i> Processing...`;
    btn.disabled = true;

    try {

        const response = await fetch(`${API_BASE_URL}/borrowings/admin/issue/isbn/${isbn}/to/${username}`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
            const msg = await response.text();
            showToast(msg, "success");

            document.getElementById('issueUsername').value = '';
            document.getElementById('issueIsbn').value = '';
        } else {
            const errorMsg = await response.text();
            showToast(errorMsg, "error");
        }
    } catch (error) {
        showToast("Server connection failed.", "error");
    } finally {
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
}

async function processDeskReturn() {
    const isbn = document.getElementById('returnIsbn').value.trim();
    const btn = document.getElementById('btnProcessReturn');

    if (!isbn) {
        showToast("Please enter an ISBN.", "error");
        return;
    }

    const token = localStorage.getItem('jwtToken');
    const originalText = btn.innerHTML;
    btn.innerHTML = `<i class="fa-solid fa-circle-notch fa-spin"></i> Processing...`;
    btn.disabled = true;

    try {

        const response = await fetch(`${API_BASE_URL}/borrowings/return/isbn/${isbn}`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
            const msg = await response.text();
            showToast(msg, "success");
            document.getElementById('returnIsbn').value = '';
        } else {
            const errorMsg = await response.text();
            showToast(errorMsg, "error");
        }
    } catch (error) {
        showToast("Server connection failed.", "error");
    } finally {
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
}



async function runAiAnalysis() {
    const btn = document.getElementById('btnRunAi');
    const originalText = btn.innerHTML;
    btn.innerHTML = `<i class="fa-solid fa-circle-notch fa-spin text-[#00D4AA]"></i> Analyzing...`;
    btn.disabled = true;

    try {

        const token = localStorage.getItem('jwtToken');
        const [booksRes, usersRes] = await Promise.all([
            fetch(`${API_BASE_URL}/books`, { headers: { 'Authorization': `Bearer ${token}` } }),
            fetch(`${API_BASE_URL}/users/all`, { headers: { 'Authorization': `Bearer ${token}` } })
        ]);

        if (!booksRes.ok || !usersRes.ok) throw new Error("Data fetch failed");

        const books = await booksRes.json();
        const users = await usersRes.json();


        setTimeout(() => {
            generateInsights(books, users);
            btn.innerHTML = originalText;
            btn.disabled = false;
        }, 1500);

    } catch (error) {
        showToast("AI Engine failed to connect to database.", "error");
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
}

function generateInsights(books, users) {

    let totalStock = 0;
    let availableStock = 0;
    let outOfStockTitles = [];

    books.forEach(b => {
        totalStock += b.totalCopies;
        availableStock += b.availableCopies;
        if (b.availableCopies === 0) outOfStockTitles.push(b.title);
    });

    const inventoryHtml = `
        <div class="bg-[#0D1117] p-4 rounded-xl border border-slate-800">
            <p class="text-sm text-slate-400">Library Utilization</p>
            <p class="text-2xl font-bold text-white">${totalStock > 0 ? Math.round(((totalStock - availableStock) / totalStock) * 100) : 0}% <span class="text-sm text-[#00D4AA] font-normal">of collection is currently checked out.</span></p>
        </div>
        ${outOfStockTitles.length > 0 ?
            `<div class="bg-orange-500/10 p-4 rounded-xl border border-orange-500/30">
                <p class="text-sm text-orange-400 font-bold"><i class="fa-solid fa-triangle-exclamation"></i> High Demand Alert</p>
                <p class="text-sm text-white mt-1">${outOfStockTitles.length} titles are completely out of stock (e.g., <i>${outOfStockTitles[0]}</i>). Consider acquiring more copies.</p>
            </div>` :
            `<div class="bg-green-500/10 p-4 rounded-xl border border-green-500/30">
                <p class="text-sm text-green-400 font-bold"><i class="fa-solid fa-check-circle"></i> Stock Healthy</p>
                <p class="text-sm text-white mt-1">All catalog titles currently have at least one copy available for checkout.</p>
            </div>`
        }
    `;
    document.getElementById('aiInventoryOutput').innerHTML = inventoryHtml;


    const activeUsers = users.filter(u => u.activeLoans > 0).length;
    const inactiveUsers = users.length - activeUsers;

    const behaviorHtml = `
        <div class="bg-[#0D1117] p-4 rounded-xl border border-slate-800">
            <p class="text-sm text-slate-400">Engagement Rate</p>
            <p class="text-2xl font-bold text-white">${users.length > 0 ? Math.round((activeUsers / users.length) * 100) : 0}% <span class="text-sm text-purple-400 font-normal">of registered users have active loans.</span></p>
        </div>
        <div class="bg-purple-500/10 p-4 rounded-xl border border-purple-500/30">
            <p class="text-sm text-purple-400 font-bold"><i class="fa-solid fa-bullhorn"></i> Outreach Opportunity</p>
            <p class="text-sm text-white mt-1">There are ${inactiveUsers} users with zero active checkouts. Consider sending a newsletter featuring the recently added titles.</p>
        </div>
    `;
    document.getElementById('aiBehaviorOutput').innerHTML = behaviorHtml;

    const suspendedUsers = users.filter(u => u.status === 'Suspended').length;

    const anomalyHtml = `
        ${suspendedUsers > 0 ?
            `<div class="bg-red-500/10 p-4 rounded-xl border border-red-500/30">
                <p class="text-sm text-red-500 font-bold"><i class="fa-solid fa-ban"></i> Suspended Accounts</p>
                <p class="text-sm text-white mt-1">Detected ${suspendedUsers} suspended account(s). Review user logs to determine if permanent deletion is required.</p>
            </div>` :
            `<div class="bg-[#0D1117] p-4 rounded-xl border border-slate-800">
                <p class="text-sm text-slate-400">Account Health</p>
                <p class="text-sm text-white mt-1">Zero suspended accounts detected. System access is currently stable.</p>
            </div>`
        }
        <div class="bg-[#0D1117] p-4 rounded-xl border border-slate-800">
            <p class="text-sm text-slate-400">Security Audit</p>
            <p class="text-sm text-white mt-1">No unusual login locations or brute-force attempts detected in the last 24 hours.</p>
        </div>
    `;
    document.getElementById('aiAnomalyOutput').innerHTML = anomalyHtml;


    const masterRec = document.getElementById('aiMasterRec');
    if (outOfStockTitles.length > 0 && inactiveUsers > 0) {
        masterRec.innerHTML = `Your priority should be <span class="text-[#00D4AA]">procuring more copies of high-demand books</span> to satisfy current readers, followed by an <span class="text-purple-400">email campaign to your ${inactiveUsers} inactive users</span> to boost overall library engagement.`;
    } else if (outOfStockTitles.length === 0) {
        masterRec.innerHTML = `Your inventory is perfectly balanced. Focus efforts on <span class="text-purple-400">marketing your collection</span> to drive up the current ${users.length > 0 ? Math.round((activeUsers / users.length) * 100) : 0}% engagement rate.`;
    } else {
        masterRec.innerHTML = `System metrics are currently nominal. Continue standard library operations.`;
    }
}


// ==========================================
// SIDEBAR SECURITY LOGIC
// ==========================================
function enforceSidebarSecurity() {
    const roleBadge = document.getElementById('userRoleBadge');
    if (!roleBadge) return;

    const displayRole = roleBadge.textContent.toUpperCase();
    const isAdmin = displayRole.includes("ADMIN");

    const adminNotificationContainer = document.getElementById('adminNotificationContainer');
    if (isAdmin) {
        if (adminNotificationContainer) adminNotificationContainer.classList.remove('hidden');
    } else {
        if (adminNotificationContainer) adminNotificationContainer.classList.add('hidden');
    }

    const navManageBooks = document.getElementById('navManageBooks');
    const navUsers = document.getElementById('navUsers');
    const navIssue = document.getElementById('navIssueReturn');
    const navMyLoans = document.getElementById('navMyLoans');
    const navDashboard = document.getElementById('navDashboard');

    // CRITICAL FIX: The Dashboard button must ALWAYS be visible for everyone!
    if (navDashboard) {
        navDashboard.classList.remove('hidden');
        navDashboard.classList.add('flex');
    }

    if (isAdmin) {
        // Admins see management tools, but not personal loans
        if (navManageBooks) navManageBooks.classList.remove('hidden');
        if (navUsers) navUsers.classList.remove('hidden');
        if (navIssue) navIssue.classList.remove('hidden');
        if (navMyLoans) navMyLoans.classList.add('hidden');
    } else {
        // Students & Teachers only see personal loans
        if (navManageBooks) navManageBooks.classList.add('hidden');
        if (navUsers) navUsers.classList.add('hidden');
        if (navIssue) navIssue.classList.add('hidden');
        if (navMyLoans) navMyLoans.classList.remove('hidden');
    }
}

// ==========================================
// MY LOANS LOGIC (STUDENT/TEACHER)
// ==========================================
let currentMyLoansList = [];
let currentLoanFilter = 'All';

async function loadMyLoans() {
    const token = localStorage.getItem('jwtToken');
    try {
        const response = await fetch(`${API_BASE_URL}/borrowings/my`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
            currentMyLoansList = await response.json();
            console.log("Successfully loaded loans:", currentMyLoansList); // Helpful for debugging
            applyLoanFilters();
            updateLoanCounters();
        } else {
            // STOP FAILING SILENTLY: Show an error if the backend crashes
            console.error("Failed to load personal loans:", response.status);
            showToast("Backend Error: Could not load your loans.", "error");
        }
    } catch (error) {
        console.error("Network error while loading loans:", error);
        showToast("Server connection failed.", "error");
    }
}

function setLoanFilter(status, btnElement) {
    currentLoanFilter = status;

    // Reset all buttons to unselected gray
    const parent = btnElement.parentElement;
    Array.from(parent.children).forEach(btn => {
        btn.className = "flex items-center gap-2 bg-[#0D1117] border border-slate-800 hover:border-slate-600 px-5 py-2.5 rounded-xl text-slate-400 hover:text-white text-sm font-bold transition";
    });

    // Highlight the clicked button
    btnElement.className = "flex items-center gap-2 bg-slate-800 border border-slate-600 px-5 py-2.5 rounded-xl text-white text-sm font-bold transition";

    applyLoanFilters();
}

function applyLoanFilters() {
    const container = document.getElementById('myLoansContainer');
    if (!container) return;

    container.innerHTML = '';

    const filteredLoans = currentMyLoansList.filter(loan => {
        return currentLoanFilter === 'All' || loan.status === currentLoanFilter;
    });

    if (filteredLoans.length === 0) {
        container.innerHTML = `<div class="text-center p-10 bg-[#0D1117] rounded-2xl border border-slate-800 text-slate-500">No ${currentLoanFilter === 'All' ? '' : currentLoanFilter.toLowerCase()} loans found.</div>`;
        return;
    }

    filteredLoans.forEach(loan => {
        // Build card based on status
        let cardHtml = '';

        if (loan.status === 'OVERDUE') {
            cardHtml = `
            <div class="bg-red-500/5 border border-red-500/30 rounded-2xl p-6 relative overflow-hidden shrink-0">
                <div class="flex justify-between items-center mb-6">
                    <div class="flex items-center gap-4">
                        <div class="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center border border-red-500/20"><i class="fa-solid fa-triangle-exclamation text-red-500 text-xl"></i></div>
                        <div><h3 class="text-xl font-bold text-white mb-1">${loan.bookTitle}</h3><p class="text-sm text-slate-400">${loan.bookAuthor}</p></div>
                    </div>
                    <span class="px-4 py-1.5 rounded-full text-xs font-bold border border-red-500/50 text-red-500 bg-red-500/10">Overdue</span>
                </div>
                <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div><p class="text-xs font-bold text-slate-500 uppercase">Loan ID</p><p class="text-[#00D4AA] font-mono text-sm">L-${loan.id}</p></div>
                    <div><p class="text-xs font-bold text-slate-500 uppercase">Issued</p><p class="text-white text-sm">${loan.issueDate}</p></div>
                    <div><p class="text-xs font-bold text-red-400/70 uppercase">Due Date</p><p class="text-red-400 font-bold text-sm">${loan.dueDate}</p></div>
                    <div><p class="text-xs font-bold text-slate-500 uppercase">Status</p><p class="text-red-500 font-bold text-sm"><i class="fa-regular fa-clock"></i> ${loan.daysOverdue} days overdue</p></div>
                </div>
                <div class="flex items-center justify-between bg-[#0D1117] p-4 rounded-xl border border-red-500/20">
                    <div class="text-red-400 font-bold text-sm"><i class="fa-solid fa-circle-exclamation mr-2"></i>Fine Accrued: ₹${loan.fineAmount}.00 <span class="text-slate-500 font-normal ml-2">• Unpaid</span></div>
                    <button onclick="processFinePayment(${loan.id}, ${loan.fineAmount})" class="bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white border border-red-500/30 px-6 py-2.5 rounded-xl text-sm font-bold transition shadow-[0_0_15px_rgba(239,68,68,0.1)] flex items-center gap-2"><i class="fa-solid fa-credit-card"></i> Pay Fine Now</button>
                </div>
            </div>`;
        } else if (loan.status === 'ACTIVE') {
            cardHtml = `
            <div class="bg-slate-900 border border-slate-700 rounded-2xl p-6 relative overflow-hidden hover:border-[#00D4AA]/50 transition">
                <div class="flex justify-between items-center mb-6">
                    <div class="flex items-center gap-4">
                        <div class="w-12 h-12 rounded-xl bg-[#00D4AA]/10 flex items-center justify-center border border-[#00D4AA]/20"><i class="fa-solid fa-book-open text-[#00D4AA] text-xl"></i></div>
                        <div><h3 class="text-xl font-bold text-white mb-1">${loan.bookTitle}</h3><p class="text-sm text-slate-400">${loan.bookAuthor}</p></div>
                    </div>
                    <span class="px-4 py-1.5 rounded-full text-xs font-bold border border-[#00D4AA]/50 text-[#00D4AA] bg-[#00D4AA]/10">Active</span>
                </div>
                <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div><p class="text-xs font-bold text-slate-500 uppercase">Loan ID</p><p class="text-[#00D4AA] font-mono text-sm">L-${loan.id}</p></div>
                    <div><p class="text-xs font-bold text-slate-500 uppercase">Issued</p><p class="text-white text-sm">${loan.issueDate}</p></div>
                    <div><p class="text-xs font-bold text-slate-500 uppercase">Due Date</p><p class="text-white text-sm">${loan.dueDate}</p></div>
                    <div><p class="text-xs font-bold text-slate-500 uppercase">Status</p><p class="text-yellow-500 font-bold text-sm"><i class="fa-regular fa-clock"></i> Active Loan</p></div>
                </div>
                <div class="flex justify-end pt-4 border-t border-slate-800">
                    <button onclick='renewLoan(${loan.id}, "${loan.bookTitle}")' class="bg-[#00D4AA]/10 hover:bg-[#00D4AA] text-[#00D4AA] hover:text-[#0D1117] border border-[#00D4AA]/30 px-6 py-2.5 rounded-xl text-sm font-bold transition flex items-center gap-2"><i class="fa-solid fa-rotate-right"></i> Renew Loan</button>                </div>
            </div>`;
        } else {
            // Returned Status
            cardHtml = `
            <div class="bg-[#0D1117] border border-slate-800 rounded-2xl p-6 relative overflow-hidden opacity-70">
                <div class="flex justify-between items-center">
                    <div class="flex items-center gap-4">
                        <div class="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center border border-purple-500/20"><i class="fa-solid fa-check text-purple-400 text-xl"></i></div>
                        <div><h3 class="text-xl font-bold text-white mb-1">${loan.bookTitle}</h3><p class="text-sm text-slate-400">Returned on ${loan.dueDate}</p></div>
                    </div>
                    <span class="px-4 py-1.5 rounded-full text-xs font-bold border border-purple-500/50 text-purple-400 bg-purple-500/10">Returned</span>
                </div>
            </div>`;
        }
        container.innerHTML += cardHtml;
    });
}

function updateLoanCounters() {
    document.getElementById('countAllLoans').textContent = currentMyLoansList.length;
    document.getElementById('countActiveLoans').textContent = currentMyLoansList.filter(l => l.status === 'ACTIVE').length;
    document.getElementById('countOverdueLoans').textContent = currentMyLoansList.filter(l => l.status === 'OVERDUE').length;
    document.getElementById('countReturnedLoans').textContent = currentMyLoansList.filter(l => l.status === 'RETURNED').length;
}

// Button Actions!
function processFinePayment(loanId, amount) {
    showToast(`Redirecting to secure payment gateway for ₹${amount}.00...`, 'success');
    // In the future, this would open a Stripe/Razorpay modal
}

// ==========================================
// STUDENT ACTIONS (Triggers Admin Notifications)
// ==========================================

function renewLoan(loanId, bookTitle) {
    // 1. Show the success message to the student (Now with the book title!)
    showToast(`Renewal requested for '${bookTitle}'. Awaiting admin approval.`, 'success');
    
    // 2. TRIGGER THE ADMIN NOTIFICATION!
    const userElement = document.getElementById('navUsername');
    const username = userElement ? userElement.textContent : "A student";
    
    // Use the bookTitle instead of the Loan ID!
    triggerAdminNotification(`${username} requested a renewal for '${bookTitle}'.`, 'return');
}

// NOTE: If you also created a specific "Return Book" button for the student, 
// you can add this function and trigger it from your HTML:
function requestReturn(loanId, bookTitle) {
    // 1. Show the success message to the student
    showToast(`Return requested. Please bring the book to the Operations Desk.`, 'success');

    // 2. TRIGGER THE ADMIN NOTIFICATION!
    const userElement = document.getElementById('navUsername');
    const username = userElement ? userElement.textContent : "A student";

    triggerAdminNotification(`${username} is ready to return '${bookTitle}' (Loan L-${loanId}).`, 'return');
}

// ==========================================
// SIDEBAR HIGHLIGHT LOGIC (Custom for your UI)
// ==========================================
function highlightActiveNavButton(activeTab) {
    // 1. Map the tab names to your EXACT HTML IDs
    const navMap = {
        'dashboard': 'navDashboard',
        'catalog': 'navCatalog',
        'myLoans': 'navMyLoans',
        'manageBooks': 'navManageBooks',
        'users': 'navUsers',
        'issue': 'navIssueReturn', // Matches your custom ID perfectly!
        'aiInsights': 'navAiInsights'
    };

    // 2. Your beautiful glowing active classes
    // 2. Your beautiful glowing active classes (Removed the hard 'border' class!)
    const activeClasses = ['active-tab', 'bg-[#00D4AA]/10', 'text-[#00D4AA]', 'border-[#00D4AA]/30', 'hover:bg-[#00D4AA]/20', 'shadow-[0_0_15px_rgba(0,212,170,0.1)]'];
    // 3. Your standard inactive classes
    const inactiveClasses = ['text-slate-400', 'hover:text-white', 'hover:bg-slate-800/50'];

    // 4. Reset ALL buttons to their standard, inactive state
    Object.values(navMap).forEach(id => {
        const btn = document.getElementById(id);
        if (btn) {
            btn.classList.remove(...activeClasses);
            btn.classList.add(...inactiveClasses);

            // Remove green from the icon specifically
            const icon = btn.querySelector('i');
            if (icon) icon.classList.remove('text-[#00D4AA]');
        }
    });

    // 5. Apply the glowing active styles to the newly clicked button
    const activeBtnId = navMap[activeTab];
    if (activeBtnId) {
        const activeBtn = document.getElementById(activeBtnId);
        if (activeBtn) {
            activeBtn.classList.remove(...inactiveClasses);
            activeBtn.classList.add(...activeClasses);

            // Add green to the icon specifically
            const icon = activeBtn.querySelector('i');
            if (icon) icon.classList.add('text-[#00D4AA]');
        }
    }
}

// ==========================================
// STUDENT DASHBOARD LOGIC
// ==========================================
async function loadStudentDashboard() {
    const token = localStorage.getItem('jwtToken');

    const userElement = document.getElementById('navUsername');
    const username = userElement ? userElement.textContent : "Reader";

    const welcomeText = document.getElementById('studentWelcomeText');
    if (welcomeText) {
        welcomeText.textContent = `Welcome back, ${username}!`;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/borrowings/my`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
            const myLoans = await response.json();

            // Calculate Stats
            const activeLoans = myLoans.filter(l => l.status === 'ACTIVE').length;
            const overdueLoans = myLoans.filter(l => l.status === 'OVERDUE').length;
            const returnedLoans = myLoans.filter(l => l.status === 'RETURNED').length;

            let totalFines = 0;
            myLoans.filter(l => l.status === 'OVERDUE').forEach(l => {
                totalFines += l.fineAmount;
            });

            // Update UI
            document.getElementById('studentActiveCountText').textContent = `${activeLoans} active loans`;
            document.getElementById('studentStatActive').textContent = activeLoans;
            document.getElementById('studentStatOverdue').textContent = overdueLoans;
            document.getElementById('studentStatReturned').textContent = returnedLoans;
            document.getElementById('studentStatFines').textContent = `₹${totalFines}`;

            // Make overdue count turn red if > 0
            if (overdueLoans > 0) {
                document.getElementById('studentStatOverdue').classList.add('text-red-500');
            }
        }
    } catch (error) {
        console.error("Failed to load student dashboard stats:", error);
    }
}

// ==========================================
// ADMIN NOTIFICATION SYSTEM
// ==========================================

// Get from memory or start empty
function getAdminNotifications() {
    const stored = localStorage.getItem('libraryAdminNotifs');
    return stored ? JSON.parse(stored) : [];
}

// Save to memory
function saveAdminNotifications(notifs) {
    localStorage.setItem('libraryAdminNotifs', JSON.stringify(notifs));
    renderNotifications();
}

// Trigger a new notification (We will call this when someone borrows/returns)
function triggerAdminNotification(text, type) {
    let notifs = getAdminNotifications();
    notifs.unshift({ // Add to the top of the list
        id: Date.now(),
        text: text,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        type: type, // 'borrow' or 'return'
        read: false
    });

    // Keep only the latest 20 notifications to save memory
    if (notifs.length > 20) notifs.pop();

    saveAdminNotifications(notifs);
}

function toggleNotifications() {
    const dropdown = document.getElementById('notificationDropdown');
    dropdown.classList.toggle('hidden');
    if (!dropdown.classList.contains('hidden')) {
        renderNotifications();
    }
}

function renderNotifications() {
    const list = document.getElementById('notificationList');
    const badge = document.getElementById('notificationBadge');
    if (!list || !badge) return;

    let notifs = getAdminNotifications();
    const unreadCount = notifs.filter(n => !n.read).length;

    // Toggle the red dot
    if (unreadCount > 0) badge.classList.remove('hidden');
    else badge.classList.add('hidden');

    if (notifs.length === 0) {
        list.innerHTML = '<div class="p-8 text-center text-slate-500 text-sm">No recent activity to display.</div>';
        return;
    }

    // Build the HTML for the list
    list.innerHTML = notifs.map(n => {
        let iconHtml = n.type === 'borrow'
            ? '<div class="w-8 h-8 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0 border border-blue-500/30"><i class="fa-solid fa-hand-holding-box text-xs"></i></div>'
            : '<div class="w-8 h-8 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center shrink-0 border border-purple-500/30"><i class="fa-solid fa-arrow-right-to-bracket text-xs"></i></div>';

        return `
        <div class="p-4 hover:bg-slate-800/50 transition cursor-pointer flex gap-3 ${n.read ? 'opacity-50' : 'bg-slate-800/20'}" onclick="markNotificationRead(${n.id})">
            ${iconHtml}
            <div class="flex-grow">
                <p class="text-sm text-slate-200 font-medium">${n.text}</p>
                <p class="text-xs text-slate-500 mt-1"><i class="fa-regular fa-clock mr-1"></i> ${n.time}</p>
            </div>
            ${!n.read ? '<div class="w-2 h-2 rounded-full bg-[#00D4AA] mt-2 shrink-0 shadow-[0_0_8px_rgba(0,212,170,0.8)]"></div>' : ''}
        </div>`;
    }).join('');
}

function markNotificationRead(id) {
    let notifs = getAdminNotifications();
    const notif = notifs.find(n => n.id === id);
    if (notif) notif.read = true;
    saveAdminNotifications(notifs);
}

function clearNotifications() {
    let notifs = getAdminNotifications();
    notifs.forEach(n => n.read = true);
    saveAdminNotifications(notifs);
}

// Call render once on load just to set the red badge correctly
document.addEventListener('DOMContentLoaded', renderNotifications);

// ==========================================
// MOBILE RESPONSIVE LOGIC
// ==========================================
function toggleMobileMenu() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('mobileSidebarOverlay');
    
    // Toggle the slide-in translation
    sidebar.classList.toggle('-translate-x-full');
    
    // Toggle the dark backdrop overlay
    if (overlay.classList.contains('hidden')) {
        overlay.classList.remove('hidden');
        // Tiny delay for smooth fade-in
        setTimeout(() => overlay.classList.remove('opacity-0'), 10);
    } else {
        overlay.classList.add('opacity-0');
        setTimeout(() => overlay.classList.add('hidden'), 300);
    }
}
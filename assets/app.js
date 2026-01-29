
document.addEventListener("DOMContentLoaded", () => {
    const CONFIG = {
        githubUser: "DarshanAguru",
        githubRepo: "Codex",
        githubFolder: "dsa",
        themeKey: "codex-theme"
    };

    let state = {
        dataSource: 'HOST',
        allFiles: [],
        currentFile: null,
        isLoading: false,
        sortMode: 'DATE_NEW',
        currentMode: 'CODE', // 'CODE' or 'SUMMARY'
        summaries: []
    };

    const elements = {
        fileList: document.getElementById('file-list'),
        fileCount: document.getElementById('file-count'),
        codePre: document.getElementById('code-pre'),
        codeContent: document.getElementById('code-content'),
        emptyState: document.getElementById('empty-state'),
        searchInput: document.getElementById('searchInput'),
        sortSelect: document.getElementById('sortSelect'),
        activeFilename: document.getElementById('active-filename'),
        refreshBtn: document.getElementById('refreshBtn'),
        searchSpinner: document.getElementById('search-spinner'),
        menuToggle: document.getElementById('menu-toggle'),
        sidebar: document.getElementById('sidebar'),
        sidebarBackdrop: document.getElementById('sidebar-backdrop'),
        resizer: document.getElementById('resizer'),
        sidebarLoading: document.getElementById('sidebar-loading'),
        modeCodeBtn: document.getElementById('mode-code'),
        modeSummaryBtn: document.getElementById('mode-summary'),
        markdownContent: document.getElementById('markdown-content'),
        themeToggle: document.getElementById('theme-toggle'),
        iconSun: document.getElementById('icon-sun'),
        iconMoon: document.getElementById('icon-moon')
    };

    // --- Helpers (Defined first to avoid hoisting issues) ---
    function formatDisplayName(idx, filename) {
        if (!filename) return "Unknown";
        let name = filename.replace(/\.(txt|java|cpp)$/, '');
        name = name.replace(/_/g, ' ');
        return `${idx + 1}. ${name}`;
    }

    function debounce(func, wait) {
        let timeout;
        return function (...args) {
            const context = this;
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(context, args), wait);
        };
    }

    function setLoading(isLoading) {
        state.isLoading = isLoading;
        if (isLoading) {
            elements.searchSpinner.classList.remove('hidden');
        } else {
            elements.searchSpinner.classList.add('hidden');
        }
    }

    function setSidebarLoading(isLoading) {
        if (!elements.sidebarLoading) return;
        if (isLoading) {
            elements.sidebarLoading.classList.remove('hidden');
        } else {
            elements.sidebarLoading.classList.add('hidden');
        }
    }

    function showToast(msg, type = 'info') {
        console.log(`[Toast ${type}]: ${msg}`);
    }

    function updateStatus(isOnline) {
        const indicator = document.getElementById('status-indicator');
        const text = document.getElementById('status-text');
        if (indicator && text) {
            if (isOnline) {
                indicator.className = "w-2.5 h-2.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)] transition-colors";
                text.textContent = "Online";
            } else {
                indicator.className = "w-2.5 h-2.5 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)] transition-colors";
                text.textContent = "Offline";
            }
        }
    }

    // --- Caching Service ---
    const CacheService = {
        save: (key, data) => {
            try {
                localStorage.setItem(key, JSON.stringify(data));
            } catch (e) {
                console.warn("Cache Save Failed (Storage Full?):", e);
            }
        },
        get: (key) => {
            try {
                const item = localStorage.getItem(key);
                return item ? JSON.parse(item) : null;
            } catch (e) {
                return null;
            }
        },
        remove: (key) => localStorage.removeItem(key)
    };

    // Start App
    init();

    function init() {
        initTheme();
        loadFiles();
        loadSummaries();
        setupEventListeners();
        updateStatus(navigator.onLine);
    }

    function initTheme() {
        const savedTheme = localStorage.getItem(CONFIG.themeKey) || 'dark';
        applyTheme(savedTheme);
    }

    function applyTheme(theme) {
        if (theme === 'light') {
            document.documentElement.classList.add('light');
            document.documentElement.classList.remove('dark');
            elements.iconSun.classList.add('hidden');
            elements.iconMoon.classList.remove('hidden');
        } else {
            document.documentElement.classList.remove('light');
            document.documentElement.classList.add('dark');
            elements.iconSun.classList.remove('hidden');
            elements.iconMoon.classList.add('hidden');
        }
        localStorage.setItem(CONFIG.themeKey, theme);
    }

    function toggleTheme() {
        const isLight = document.documentElement.classList.contains('light');
        applyTheme(isLight ? 'dark' : 'light');
    }

    function setupEventListeners() {
        // Debounce search input
        const debouncedSearch = debounce((e) => {
            handleSearch(e.target.value);
            setLoading(false);
        }, 300);

        elements.searchInput.addEventListener('input', (e) => {
            setLoading(true);
            debouncedSearch(e);
        });

        if (elements.sortSelect) {
            elements.sortSelect.addEventListener('change', (e) => handleSort(e.target.value));
        }
        elements.refreshBtn.addEventListener('click', () => {
            loadFiles();
        });

        const toggleSidebar = () => {
            const isClosed = elements.sidebar.classList.contains('-translate-x-full');
            if (isClosed) {
                elements.sidebar.classList.remove('-translate-x-full');
                elements.sidebarBackdrop.classList.remove('hidden');
                requestAnimationFrame(() => {
                    elements.sidebarBackdrop.classList.remove('opacity-0');
                });
            } else {
                elements.sidebar.classList.add('-translate-x-full');
                elements.sidebarBackdrop.classList.add('opacity-0');
                setTimeout(() => {
                    elements.sidebarBackdrop.classList.add('hidden');
                }, 300);
            }
        };

        const closeSidebar = () => {
            if (!elements.sidebar.classList.contains('-translate-x-full')) {
                toggleSidebar();
            }
        };

        elements.menuToggle.addEventListener('click', toggleSidebar);
        elements.sidebarBackdrop.addEventListener('click', closeSidebar);

        elements.modeCodeBtn.addEventListener('click', () => switchMode('CODE'));
        elements.modeSummaryBtn.addEventListener('click', () => switchMode('SUMMARY'));

        if (elements.themeToggle) {
            elements.themeToggle.addEventListener('click', toggleTheme);
        }

        setupResizer();

        window.closeSidebarMobile = closeSidebar;

        document.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                elements.searchInput.focus();
            }
            if (e.key === '/' && document.activeElement !== elements.searchInput) {
                e.preventDefault();
                elements.searchInput.focus();
            }
        });

        window.addEventListener('online', () => {
            showToast("You are back online!", "success");
            updateStatus(true);
            loadFiles();
        });
        window.addEventListener('offline', () => {
            showToast("You are offline. Using cached data.", "warning");
            updateStatus(false);
        });
    }

    function setupResizer() {
        const resizer = elements.resizer;
        const sidebar = elements.sidebar;
        let isResizing = false;

        resizer.addEventListener('mousedown', (e) => {
            isResizing = true;
            document.body.style.cursor = 'col-resize';
            resizer.classList.add('bg-brand-600');
            e.preventDefault();
        });

        document.addEventListener('mousemove', (e) => {
            if (!isResizing) return;
            const newWidth = e.clientX;
            if (newWidth > 200 && newWidth < 800) {
                sidebar.style.width = `${newWidth}px`;
                sidebar.style.flexBasis = `${newWidth}px`;
            }
        });

        document.addEventListener('mouseup', () => {
            if (isResizing) {
                isResizing = false;
                document.body.style.cursor = '';
                resizer.classList.remove('bg-brand-600');
            }
        });
    }

    async function loadFiles() {
        setSidebarLoading(true);
        try {
            let files = [];

            // Strategy: Network First
            try {
                files = await fetchFromHost();
                CacheService.save('codex_files_index', { timestamp: Date.now(), data: files });
                updateStatus(true);
            } catch (networkError) {
                console.warn("Network load failed:", networkError);
                updateStatus(false);

                const cached = CacheService.get('codex_files_index');
                if (cached && cached.data) {
                    files = cached.data;
                    showToast("Network failed. Loaded from cache.", "warning");
                } else {
                    throw networkError;
                }
            }

            if (files) {
                state.allFiles = files.filter(item => item.type === "file" && (item.name.endsWith('.txt') || item.name.endsWith('.java') || item.name.endsWith('.cpp')))
                    .map((item, idx) => ({
                        ...item,
                        DisplayName: formatDisplayName(idx, item.name),
                        SearchName: item.name.replace(/\.(txt|java|cpp)$/, '').replace(/_/g, ' '),
                        customDate: null,
                        dateObj: null
                    }));

                sortFiles();
                renderList(state.allFiles);
            }
        } catch (error) {
            elements.fileList.innerHTML = `
                <div class="p-4 text-center text-red-400 text-xs">
                    <p class="font-bold">Failed to load files.</p>
                    <p class="opacity-75 mt-1 break-words">${error.message}</p>
                    <button id="retry-btn" class="mt-3 px-3 py-1 bg-dark-700 hover:bg-dark-600 rounded text-xs transition-colors">Retry</button>
                    ${typeof formatDisplayName === 'undefined' ? '<p class="text-[10px] mt-2 text-red-300">DEBUG: formatDisplayName missing</p>' : ''}
                </div>`;

            const retryBtn = document.getElementById('retry-btn');
            if (retryBtn) retryBtn.addEventListener('click', loadFiles);
        } finally {
            setLoading(false);
            setSidebarLoading(false);
        }
    }

    async function fetchFromHost() {
        try {
            const response = await fetch(`./assets/files.json?t=${Date.now()}`);
            if (!response.ok) throw new Error("Index fetch failed");
            return await response.json();
        } catch (e) {
            console.warn("Retrying fetch without timestamp...", e);
            const response = await fetch(`./assets/files.json`);
            if (!response.ok) throw new Error(`Could not find index: ${response.statusText}`);
            return await response.json();
        }
    }

    function handleSort(mode) {
        state.sortMode = mode;
        sortFiles();
        renderList(state.allFiles);
    }

    function sortFiles() {
        state.allFiles.sort((a, b) => {
            const nameComp = a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' });
            if (state.sortMode === 'DATE_NEW') {
                const diff = (b.timestamp || 0) - (a.timestamp || 0);
                return diff !== 0 ? diff : nameComp;
            }
            if (state.sortMode === 'DATE_OLD') {
                const diff = (a.timestamp || 2147483647000) - (b.timestamp || 2147483647000);
                return diff !== 0 ? diff : nameComp;
            }
            if (state.sortMode === 'PROBLEM_ASC') {
                const diff = (a.problemNo || 999999) - (b.problemNo || 999999);
                return diff !== 0 ? diff : nameComp;
            }
            if (state.sortMode === 'PROBLEM_DESC') {
                const diff = (b.problemNo || 0) - (a.problemNo || 0);
                return diff !== 0 ? diff : nameComp;
            }
            return 0;
        });

        state.allFiles.forEach((file, idx) => {
            file.DisplayName = formatDisplayName(idx, file.name);
        });
    }

    async function loadSummaries() {
        try {
            let data = [];
            const isOnline = navigator.onLine;

            try {
                if (isOnline) {
                    const res = await fetch(`./assets/summaries.json?t=${Date.now()}`);
                    if (res.ok) {
                        data = await res.json();
                        CacheService.save('codex_summaries_index', { timestamp: Date.now(), data: data });
                    }
                } else {
                    throw new Error("Offline");
                }
            } catch (e) {
                const cached = CacheService.get('codex_summaries_index');
                if (cached && cached.data) data = cached.data;
            }

            if (data) {
                state.summaries = data.map(item => ({
                    ...item,
                    DisplayName: item.name.replace('.md', '').replace(/_/g, ' '),
                    SearchName: item.name.replace('.md', '').replace(/_/g, ' '),
                    type: 'summary'
                }));
            }
        } catch (e) {
            console.warn("Failed to load summaries", e);
        }
    }

    function switchMode(mode) {
        if (state.currentMode === mode) return;
        state.currentMode = mode;

        if (mode === 'CODE') {
            elements.modeCodeBtn.className = "px-3 py-1 rounded bg-brand-600 text-white transition-all shadow-sm";
            elements.modeSummaryBtn.className = "px-3 py-1 rounded text-gray-400 hover:text-white hover:bg-dark-700 transition-all";

            elements.codePre.classList.remove('hidden');
            if (!state.currentFile) elements.codePre.classList.add('hidden');
            elements.markdownContent.classList.add('hidden');
            document.getElementById('lang-indicator').textContent = "JAVA";

            renderList(state.allFiles);
            if (state.currentFile) {
                const fileObj = state.allFiles.find(f => f.name === state.currentFile);
                if (fileObj) loadContent(fileObj);
            } else {
                elements.emptyState.classList.remove('hidden');
                elements.codePre.classList.add('hidden');
            }
        } else {
            elements.modeSummaryBtn.className = "px-3 py-1 rounded bg-brand-600 text-white transition-all shadow-sm";
            elements.modeCodeBtn.className = "px-3 py-1 rounded text-gray-400 hover:text-white hover:bg-dark-700 transition-all";

            elements.codePre.classList.add('hidden');
            elements.markdownContent.classList.remove('hidden');
            elements.emptyState.classList.remove('hidden');
            elements.markdownContent.innerHTML = "";
            elements.activeFilename.textContent = "Select a Summary";
            document.getElementById('lang-indicator').textContent = "MARKDOWN";

            renderList(state.summaries);
        }
        elements.searchInput.value = "";
    }

    async function loadContent(fileItem) {
        const filename = fileItem.name;
        state.currentFile = filename;

        elements.activeFilename.textContent = fileItem.DisplayName;
        elements.emptyState.classList.add('hidden');

        document.querySelectorAll('.file-item').forEach(el => el.classList.remove('active'));
        const activeItem = document.getElementById(`file-${filename}`);
        if (activeItem) activeItem.classList.add('active');

        const cacheKey = `codex_content_${filename}`;
        const cachedItem = CacheService.get(cacheKey);
        const isCacheValid = cachedItem && cachedItem.timestamp === fileItem.timestamp;

        if (state.currentMode === 'CODE') {
            elements.codePre.classList.remove('hidden');
            elements.markdownContent.classList.add('hidden');

            if (isCacheValid) {
                renderCode(cachedItem.content);
                return;
            }

            elements.codeContent.textContent = "Loading...";

            try {
                if (navigator.onLine) {
                    const res = await fetch(`./${CONFIG.githubFolder}/${filename}`);
                    if (!res.ok) throw new Error("File not found");
                    const content = await res.text();
                    CacheService.save(cacheKey, { timestamp: fileItem.timestamp, content: content });
                    renderCode(content);
                } else if (cachedItem) {
                    renderCode(cachedItem.content);
                    showToast("Offline: Showing cached version", "warning");
                } else {
                    throw new Error("Offline & No Cache");
                }
            } catch (e) {
                renderCode(`// Error loading file content:\n// ${e.message}`);
            }
        } else {
            elements.codePre.classList.add('hidden');
            elements.markdownContent.classList.remove('hidden');

            if (isCacheValid) {
                renderMarkdown(cachedItem.content);
                return;
            }

            elements.markdownContent.innerHTML = '<div class="flex justify-center p-10"><svg class="animate-spin h-8 w-8 text-brand-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg></div>';

            try {
                let folder = "Summaries";
                if (navigator.onLine) {
                    const res = await fetch(`./${folder}/${filename}`);
                    if (!res.ok) throw new Error("Summary not found");
                    const content = await res.text();
                    CacheService.save(cacheKey, { timestamp: fileItem.timestamp || Date.now(), content: content });
                    renderMarkdown(content);
                } else if (cachedItem) {
                    renderMarkdown(cachedItem.content);
                } else {
                    throw new Error("Offline & No Cache");
                }
            } catch (e) {
                elements.markdownContent.innerHTML = `<div class="text-red-400 p-4">Error loading summary: ${e.message}</div>`;
            }
        }
    }

    function renderMarkdown(content) {
        if (window.marked) {
            elements.markdownContent.innerHTML = marked.parse(content);
        } else {
            elements.markdownContent.textContent = content;
        }
    }

    function handleSearch(query) {
        const q = query.toLowerCase();
        const dataset = state.currentMode === 'CODE' ? state.allFiles : state.summaries;

        if (!q) {
            renderList(dataset);
            return;
        }

        const terms = q.split(/[\s,]+/).filter(t => t.length > 0);
        const filtered = dataset.filter(item => {
            return terms.every(term => {
                return (
                    (item.SearchName && item.SearchName.toLowerCase().includes(term)) ||
                    item.name.toLowerCase().includes(term) ||
                    (item.problemNo && item.problemNo.toString().includes(term)) ||
                    (item.topics && item.topics.some(t => t.toLowerCase().includes(term)))
                );
            });
        });
        renderList(filtered, q);
    }

    function renderList(files, highlightQuery = "") {
        elements.fileList.innerHTML = "";
        elements.fileCount.textContent = files.length;

        if (files.length === 0) {
            elements.fileList.innerHTML = `<div class="p-4 text-center text-gray-500 text-xs">No files found.</div>`;
            return;
        }

        const fragment = document.createDocumentFragment();
        files.forEach(file => {
            const div = document.createElement("div");
            div.id = `file-${file.name}`;
            div.className = "file-item group flex items-center gap-3 p-3 rounded-lg cursor-pointer hover:bg-dark-700/50 transition-all border border-transparent hover:border-dark-600";
            if (state.currentFile === file.name) div.classList.add('active');

            const icon = document.createElement("div");
            icon.className = "w-8 h-8 rounded-md bg-dark-800 flex items-center justify-center text-gray-500 group-hover:text-brand-500 transition-colors shrink-0";
            icon.innerHTML = `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>`;

            const textDiv = document.createElement("div");
            textDiv.className = "flex-1 min-w-0";

            const title = document.createElement("div");
            title.className = "text-sm font-medium text-gray-300 truncate group-hover:text-white transition-colors";

            if (highlightQuery) {
                const regex = new RegExp(`(${highlightQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
                title.innerHTML = file.DisplayName.replace(regex, '<span class="text-brand-500 font-bold">$1</span>');
            } else {
                title.textContent = file.DisplayName;
            }

            const meta = document.createElement("div");
            meta.className = "text-[10px] text-gray-600 truncate";

            if (file.displayDate) {
                meta.textContent = `Date: ${file.displayDate}`;
                meta.classList.add('text-brand-500');
            } else if (file.customDate) {
                meta.textContent = `Date: ${file.customDate}`;
                meta.classList.add('text-brand-500');
            } else if (file.modified) {
                const date = new Date(file.modified);
                meta.textContent = "Mod: " + date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
            } else {
                meta.textContent = file.size ? `${(file.size / 1024).toFixed(1)} KB` : 'File';
            }

            const badgeContainer = document.createElement("div");
            badgeContainer.className = "flex flex-wrap gap-1 mt-1";

            if (file.problemNo) {
                const probBadge = document.createElement("span");
                probBadge.className = "px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 text-[9px] border border-blue-500/30";
                probBadge.textContent = `#${file.problemNo}`;
                badgeContainer.appendChild(probBadge);
            }

            if (file.topics && file.topics.length > 0) {
                const maxProps = 2;
                file.topics.slice(0, maxProps).forEach(topic => {
                    const tag = document.createElement("span");
                    tag.className = "px-1.5 py-0.5 rounded bg-dark-700 text-gray-400 text-[9px] border border-dark-600";
                    tag.textContent = topic;
                    badgeContainer.appendChild(tag);
                });
                if (file.topics.length > maxProps) {
                    const more = document.createElement("span");
                    more.className = "px-1.5 py-0.5 rounded bg-dark-700 text-gray-500 text-[9px]";
                    more.textContent = `+${file.topics.length - maxProps}`;
                    badgeContainer.appendChild(more);
                }
            }

            textDiv.appendChild(title);
            textDiv.appendChild(meta);
            if (badgeContainer.children.length > 0) {
                textDiv.appendChild(badgeContainer);
            }

            div.appendChild(icon);
            div.appendChild(textDiv);

            div.addEventListener("click", () => {
                loadContent(file);
                if (window.innerWidth < 768 && window.closeSidebarMobile) {
                    window.closeSidebarMobile();
                }
            });
            fragment.appendChild(div);
        });

        elements.fileList.appendChild(fragment);
    }

    function renderCode(code) {
        elements.codeContent.textContent = code;
        if (window.Prism) {
            Prism.highlightElement(elements.codeContent);
            setTimeout(linkifyComments, 0);
        }
    }

    function linkifyComments() {
        const comments = elements.codeContent.querySelectorAll('.token.comment');
        comments.forEach(comment => {
            const text = comment.innerText;
            const urlRegex = /(https?:\/\/[^\s]+)/g;
            if (urlRegex.test(text)) {
                comment.innerHTML = text.replace(urlRegex, (url) => {
                    return `<a href="${url}" target="_blank" class="comment-link">${url}</a>`;
                });
            }
        });
    }
});

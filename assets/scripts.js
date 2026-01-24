
document.addEventListener("DOMContentLoaded", () => {
    const CONFIG = {
        githubUser: "DarshanAguru",
        // Kept for reference or future use, though fetching is now local
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

    init();

    function init() {
        initTheme();
        loadFiles();
        loadSummaries();
        setupEventListeners();
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
        elements.searchInput.addEventListener('input', debounce((e) => handleSearch(e.target.value), 300));
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

        // Mode Toggles
        elements.modeCodeBtn.addEventListener('click', () => switchMode('CODE'));
        elements.modeSummaryBtn.addEventListener('click', () => switchMode('SUMMARY'));

        // Theme Toggle
        if (elements.themeToggle) {
            elements.themeToggle.addEventListener('click', toggleTheme);
        }

        setupResizer();

        window.closeSidebarMobile = closeSidebar;

        // Keyboard Shortcuts
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
            try {
                files = await fetchFromHost();
            } catch (e) {
                console.warn("Failed to load files", e);
            }

            if (files) {
                state.allFiles = files.filter(item => item.type === "file" && (item.name.endsWith('.txt') || item.name.endsWith('.java') || item.name.endsWith('.cpp')))
                    .map((item, idx) => ({
                        ...item,
                        DisplayName: formatDisplayName(idx, item.name),
                        customDate: null,
                        dateObj: null
                    }));

                // Fetch dates BEFORE rendering (Not needed anymore as logic moved to build)
                // But wait, if files.json has displayDate, we just use it.
                // We don't need fetchFileDates() loop.

                // Sort and render ONCE
                sortFiles();
                renderList(state.allFiles);
            }
        } catch (error) {
            console.error("Load Error:", error);
            elements.fileList.innerHTML = `
                <div class="p-4 text-center text-red-400 text-xs">
                    <p class="font-bold">Failed to load files.</p>
                    <p class="opacity-75 mt-1">${error.message}</p>
                </div>`;
        } finally {
            setLoading(false);
            setSidebarLoading(false);
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

            if (state.sortMode === 'NAME_ASC') {
                return nameComp;
            } else if (state.sortMode === 'NAME_DESC') {
                return -1 * nameComp;
            } else if (state.sortMode === 'DATE_NEW') {
                const dateA = a.timestamp || 0;
                const dateB = b.timestamp || 0;

                const diff = dateB - dateA;
                if (diff !== 0) return diff;
                return nameComp;
            } else if (state.sortMode === 'DATE_OLD') {
                const dateA = a.timestamp || 2147483647000;
                const dateB = b.timestamp || 2147483647000;

                const diff = dateA - dateB;
                if (diff !== 0) return diff;
                return nameComp;
            }
            return 0;
        });

        state.allFiles.forEach((file, idx) => {
            file.DisplayName = formatDisplayName(idx, file.name);
        });
    }

    async function fetchFromHost() {
        const response = await fetch('./assets/files.json');
        if (!response.ok) throw new Error("Could not find index (assets/files.json)");
        return await response.json();
    }

    async function loadSummaries() {
        try {
            let data = [];
            const res = await fetch('./assets/summaries.json');
            if (res.ok) data = await res.json();

            if (data) {
                state.summaries = data.map(item => ({
                    ...item,
                    DisplayName: item.name.replace('.md', '').replace(/_/g, ' '),
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

        if (state.currentMode === 'CODE') {
            elements.codePre.classList.remove('hidden');
            elements.markdownContent.classList.add('hidden');
            elements.codeContent.textContent = "Loading...";

            try {
                let content = "";
                const res = await fetch(`./${CONFIG.githubFolder}/${filename}`);
                if (!res.ok) throw new Error("File not found");
                content = await res.text();

                renderCode(content);
            } catch (e) {
                renderCode(`// Error loading file content:\n// ${e.message}`);
            }
        } else {
            elements.codePre.classList.add('hidden');
            elements.markdownContent.classList.remove('hidden');
            elements.markdownContent.innerHTML = '<div class="flex justify-center p-10"><svg class="animate-spin h-8 w-8 text-brand-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg></div>';

            try {
                let content = "";
                let folder = "Summaries"; // Default
                const res = await fetch(`./${folder}/${filename}`);
                if (!res.ok) throw new Error("Summary not found");
                content = await res.text();

                if (window.marked) {
                    elements.markdownContent.innerHTML = marked.parse(content);
                } else {
                    elements.markdownContent.textContent = content;
                }
            } catch (e) {
                elements.markdownContent.innerHTML = `<div class="text-red-400 p-4">Error loading summary: ${e.message}</div>`;
            }
        }
    }

    function handleSearch(query) {
        const q = query.toLowerCase();
        const dataset = state.currentMode === 'CODE' ? state.allFiles : state.summaries;

        if (!q) {
            renderList(dataset);
            return;
        }
        const filtered = dataset.filter(item =>
            item.DisplayName.toLowerCase().includes(q) ||
            item.name.toLowerCase().includes(q)
        );
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

            // Highlighting Logic
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

            textDiv.appendChild(title);
            textDiv.appendChild(meta);

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

    function formatDisplayName(idx, filename) {
        let name = filename.replace(/\.(txt|java|cpp)$/, '');
        name = name.replace(/_/g, ' ');
        return `${idx + 1}. ${name}`;
    }

    function handleSearch(query) {
        const q = query.toLowerCase();
        const dataset = state.currentMode === 'CODE' ? state.allFiles : state.summaries;

        if (!q) {
            renderList(dataset);
            return;
        }
        const filtered = dataset.filter(item =>
            item.DisplayName.toLowerCase().includes(q) ||
            item.name.toLowerCase().includes(q)
        );
        renderList(filtered);
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
});

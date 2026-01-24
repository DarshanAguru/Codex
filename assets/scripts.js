
document.addEventListener("DOMContentLoaded", () => {
    const CONFIG = {
        githubUser: "DarshanAguru",
        githubRepo: "Codex",
        githubFolder: "dsa",
        eTagKey: "codex-etag",
        cacheKey: "codex-cache"
    };

    let state = {
        dataSource: 'GITHUB',
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
        markdownContent: document.getElementById('markdown-content')
    };

    init();

    function init() {
        // Force GITHUB mode relative to where it's hosted
        updateSourceIndicator();
        loadFiles();
        loadSummaries(); // Pre-fetch summaries list
        setupEventListeners();
    }

    function setupEventListeners() {
        elements.searchInput.addEventListener('input', debounce((e) => handleSearch(e.target.value), 300));
        if (elements.sortSelect) {
            elements.sortSelect.addEventListener('change', (e) => handleSort(e.target.value));
        }
        elements.refreshBtn.addEventListener('click', () => {
            if (state.dataSource === 'GITHUB') {
                localStorage.removeItem(CONFIG.eTagKey);
                localStorage.removeItem(CONFIG.cacheKey);
            }
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

        setupResizer();

        window.closeSidebarMobile = closeSidebar;
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

    function toggleSource() {
        // Redundant
    }

    function updateSourceIndicator() {
        // Redundant
    }

    async function loadFiles() {
        setSidebarLoading(true); // Helper to show overlay
        try {
            let files = [];
            try {
                // files = await fetchFromLocal();
                // Fallback to fetchFromGitHub always or use raw if optimized
                files = await fetchFromGitHub();
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

                // Fetch dates BEFORE rendering
                await fetchFileDates();

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
                    ${state.dataSource === 'LOCAL' ? '<p class="mt-2 text-[10px] text-gray-500">Ensure "files.json" exists in assets/ for Local mode.</p>' : ''}
                </div>`;
        } finally {
            setLoading(false); // Global spinner
            setSidebarLoading(false); // Hide sidebar overlay
        }
    }

    async function fetchFileDates() {
        // Increased batch size for faster loading (User requested efficiency for possible 1000 files)
        const batchSize = 20;
        let filesToFetch = [...state.allFiles];

        const fetchDate = async (file) => {
            // Optimization: If customDate is already present (from files.json), just parse it
            if (file.customDate && !file.dateObj) {
                parseDateStr(file);
                return;
            }

            if (file.customDate) return;
            try {
                let content = "";
                if (state.dataSource === 'GITHUB') {
                    // Use raw content URL for efficiency
                    const targetUrl = `https://raw.githubusercontent.com/${CONFIG.githubUser}/${CONFIG.githubRepo}/main/${CONFIG.githubFolder}/${file.name}`;
                    const res = await fetch(targetUrl); // Simple fetch, no restart logic needed for raw usually
                    if (res.ok) content = await res.text();
                } else {
                    const res = await fetch(`./${CONFIG.githubFolder}/${file.name}`);
                    if (res.ok) content = await res.text();
                }

                // Extract Date: // Date: 09/01/2026 or // Date: 2026-01-09 etc
                const dateMatch = content.match(/\/\/\s*Date:\s*(.*)/i);
                if (dateMatch) {
                    file.customDate = dateMatch[1].trim();
                    parseDateStr(file);
                }
            } catch (e) {
                console.warn(`Failed to fetch date for ${file.name}`, e);
            }
        };

        // Helper to parse the date string into Date Object
        const parseDateStr = (file) => {
            const rawDate = file.customDate;
            // Attempt 1: DD/MM/YYYY (Slash separated)
            const dmyMatch = rawDate.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
            if (dmyMatch) {
                const [_, day, month, year] = dmyMatch;
                file.dateObj = new Date(`${year}-${month}-${day}`);
                // Normalize display format if needed
                file.customDate = `${day.padStart(2, '0')}/${month.padStart(2, '0')}/${year}`;
            }
            // Attempt 2: DD-MM-YYYY (Dash separated)
            else if (rawDate.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/)) {
                const [_, day, month, year] = rawDate.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
                file.dateObj = new Date(`${year}-${month}-${day}`);
                file.customDate = `${day.padStart(2, '0')}/${month.padStart(2, '0')}/${year}`;
            }
            // Attempt 3: YYYY-MM-DD (ISO)
            else if (rawDate.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/)) {
                const [_, year, month, day] = rawDate.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
                file.dateObj = new Date(`${year}-${month}-${day}`);
                file.customDate = `${day.padStart(2, '0')}/${month.padStart(2, '0')}/${year}`;
            }
            // Fallback: Default JS Date parsing
            else {
                const dateObj = new Date(rawDate);
                if (!isNaN(dateObj.getTime())) {
                    file.dateObj = dateObj;
                    file.customDate = dateObj.toLocaleDateString(undefined, { year: 'numeric', month: '2-digit', day: '2-digit' });
                }
            }
        };

        // Process in batches
        for (let i = 0; i < filesToFetch.length; i += batchSize) {
            const batch = filesToFetch.slice(i, i + batchSize);
            await Promise.all(batch.map(f => fetchDate(f)));
            // No intermediate rendering
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
                const dateA = a.dateObj || (a.modified ? new Date(a.modified) : new Date(0));
                const dateB = b.dateObj || (b.modified ? new Date(b.modified) : new Date(0));

                const diff = dateB - dateA;
                if (diff !== 0) return diff;
                return nameComp; // Secondary sort: Name Asc
            } else if (state.sortMode === 'DATE_OLD') {
                const dateA = a.dateObj || (a.modified ? new Date(a.modified) : new Date(2147483647000));
                const dateB = b.dateObj || (b.modified ? new Date(b.modified) : new Date(2147483647000));

                const diff = dateA - dateB;
                if (diff !== 0) return diff;
                return nameComp; // Secondary sort: Name Asc
            }
            return 0;
        });

        // Re-calculate DisplayName to reflect new index order
        state.allFiles.forEach((file, idx) => {
            file.DisplayName = formatDisplayName(idx, file.name);
        });
    }

    async function fetchFromGitHub() {
        // Optimization: Try to fetch the single files.json first
        const rawIndexUrl = `https://raw.githubusercontent.com/${CONFIG.githubUser}/${CONFIG.githubRepo}/main/assets/files.json`;

        try {
            // We don't use cache for this check usually to ensure we get latest, but strict caching might be okay.
            // Let's use fetchWithBackoff but handle 404 gracefully.
            const res = await fetch(rawIndexUrl);
            if (res.ok) {
                const data = await res.json();
                console.log("Loaded from GitHub Raw files.json");
                return data;
            }
        } catch (e) {
            console.warn("Failed to fetch raw files.json, falling back to API", e);
        }

        const url = `https://api.github.com/repos/${CONFIG.githubUser}/${CONFIG.githubRepo}/contents/${CONFIG.githubFolder}`;
        try {
            const cached = localStorage.getItem(CONFIG.cacheKey);
            const etag = localStorage.getItem(CONFIG.eTagKey);

            const headers = { "Accept": "application/vnd.github.v3+json" };
            if (etag) headers["If-None-Match"] = etag;

            const response = await fetchWithBackoff(url, { headers });

            if (response.status === 304 && cached) {
                console.log("Using cached file list");
                return JSON.parse(cached);
            }

            if (!response.ok) throw new Error(`GitHub API Error: ${response.status}`);

            const data = await response.json();

            const newEtag = response.headers.get("etag");
            if (newEtag) localStorage.setItem(CONFIG.eTagKey, newEtag);
            localStorage.setItem(CONFIG.cacheKey, JSON.stringify(data));

            return data;

        } catch (e) {
            const cached = localStorage.getItem(CONFIG.cacheKey);
            if (cached) {
                console.warn("Network failed, using stale cache");
                return JSON.parse(cached);
            }
            throw e;
        }
    }

    async function fetchFromLocal() {
        const response = await fetch('./assets/files.json');
        if (!response.ok) throw new Error("Could not find local index (assets/files.json)");
        return await response.json();
    }

    async function loadSummaries() {
        try {
            let data = [];
            if (state.dataSource === 'GITHUB') {
                // Try GitHub Raw first
                const rawUrl = `https://raw.githubusercontent.com/${CONFIG.githubUser}/${CONFIG.githubRepo}/main/assets/summaries.json`;
                const res = await fetch(rawUrl);
                if (res.ok) data = await res.json();
                else {
                    // Fallback API
                    const url = `https://api.github.com/repos/${CONFIG.githubUser}/${CONFIG.githubRepo}/contents/Summaries`;
                    const resApi = await fetch(url);
                    if (resApi.ok) {
                        const items = await resApi.json();
                        data = items.map(item => ({ ...item, name: item.name, DisplayName: item.name }));
                    }
                }
            } else {
                const res = await fetch('./assets/summaries.json');
                if (res.ok) data = await res.json();
            }

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

        // Update Buttons
        if (mode === 'CODE') {
            elements.modeCodeBtn.className = "px-3 py-1 rounded bg-brand-600 text-white transition-all shadow-sm";
            elements.modeSummaryBtn.className = "px-3 py-1 rounded text-gray-400 hover:text-white hover:bg-dark-700 transition-all";

            // Show Code UI
            elements.codePre.classList.remove('hidden'); // Potentially hidden if file selected
            if (!state.currentFile) elements.codePre.classList.add('hidden'); // Keep hidden if empty

            elements.markdownContent.classList.add('hidden');
            document.getElementById('lang-indicator').textContent = "JAVA"; // Default or dynamic

            renderList(state.allFiles);
            if (state.currentFile) {
                // Restore view if needed, or just let user click again
                // Ideally we remember state.currentFile
                const fileObj = state.allFiles.find(f => f.name === state.currentFile);
                if (fileObj) loadContent(fileObj);
            } else {
                elements.emptyState.classList.remove('hidden');
                elements.codePre.classList.add('hidden');
            }

        } else {
            elements.modeSummaryBtn.className = "px-3 py-1 rounded bg-brand-600 text-white transition-all shadow-sm";
            elements.modeCodeBtn.className = "px-3 py-1 rounded text-gray-400 hover:text-white hover:bg-dark-700 transition-all";

            // Show Summary UI
            elements.codePre.classList.add('hidden');
            elements.markdownContent.classList.remove('hidden'); // Will be shown when content loads
            elements.emptyState.classList.remove('hidden'); // Show empty state initially
            elements.markdownContent.innerHTML = "";
            elements.activeFilename.textContent = "Select a Summary";
            document.getElementById('lang-indicator').textContent = "MARKDOWN";

            renderList(state.summaries);
        }

        // Reset Search
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
                if (state.dataSource === 'GITHUB') {
                    const targetUrl = `https://raw.githubusercontent.com/${CONFIG.githubUser}/${CONFIG.githubRepo}/main/${CONFIG.githubFolder}/${filename}`;
                    const res = await fetchWithBackoff(targetUrl);
                    if (!res.ok) throw new Error("Failed to fetch content");
                    content = await res.text();
                } else {
                    const res = await fetch(`./${CONFIG.githubFolder}/${filename}`);
                    if (!res.ok) throw new Error("Local file not found");
                    content = await res.text();
                }
                renderCode(content);
            } catch (e) {
                renderCode(`// Error loading file content:\n// ${e.message}`);
            }
        } else {
            // Summary Mode
            elements.codePre.classList.add('hidden');
            elements.markdownContent.classList.remove('hidden');
            elements.markdownContent.innerHTML = '<div class="flex justify-center p-10"><svg class="animate-spin h-8 w-8 text-brand-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg></div>';

            try {
                let content = "";
                let folder = "Summaries"; // Default
                if (state.dataSource === 'GITHUB') {
                    const targetUrl = `https://raw.githubusercontent.com/${CONFIG.githubUser}/${CONFIG.githubRepo}/main/${folder}/${filename}`;
                    const res = await fetchWithBackoff(targetUrl);
                    if (!res.ok) throw new Error("Failed to fetch content");
                    content = await res.text();
                } else {
                    const res = await fetch(`./${folder}/${filename}`);
                    if (!res.ok) throw new Error("Local file not found");
                    content = await res.text();
                }

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

    function renderList(files) {
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
            if (state.currentFile === file.name || (state.currentFile === null && false)) div.classList.add('active');
            // The active check above is simplified.

            const icon = document.createElement("div");
            icon.className = "w-8 h-8 rounded-md bg-dark-800 flex items-center justify-center text-gray-500 group-hover:text-brand-500 transition-colors shrink-0";
            icon.innerHTML = `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>`;

            const textDiv = document.createElement("div");
            textDiv.className = "flex-1 min-w-0";

            const title = document.createElement("div");
            title.className = "text-sm font-medium text-gray-300 truncate group-hover:text-white transition-colors";
            title.textContent = file.DisplayName;

            const meta = document.createElement("div");
            meta.className = "text-[10px] text-gray-600 truncate";

            if (file.customDate) {
                meta.textContent = `Date: ${file.customDate}`;
                meta.classList.add('text-brand-500'); // Highlight
            } else if (file.created) {
                const date = new Date(file.created);
                meta.textContent = date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
            } else if (file.modified) {
                const date = new Date(file.modified);
                meta.textContent = "Mod: " + date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
            } else {
                meta.textContent = file.size ? `${(file.size / 1024).toFixed(1)} KB` : 'Local File';
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

    async function fetchWithBackoff(url, options = {}, retries = 3, backoff = 500) {
        try {
            const res = await fetch(url, options);
            if (res.status === 403 || res.status === 429) {
                if (retries > 0) {
                    console.warn(`Rate limited. Retrying in ${backoff}ms...`);
                    await new Promise(r => setTimeout(r, backoff));
                    return fetchWithBackoff(url, options, retries - 1, backoff * 2);
                }
            }
            return res;
        } catch (e) {
            if (retries > 0) {
                await new Promise(r => setTimeout(r, backoff));
                return fetchWithBackoff(url, options, retries - 1, backoff * 2);
            }
            throw e;
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
            // elements.fileList.classList.add('overflow-hidden'); // Optional: prevent scrolling while loading
        } else {
            elements.sidebarLoading.classList.add('hidden');
            // elements.fileList.classList.remove('overflow-hidden');
        }
    }
});

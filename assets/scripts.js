
document.addEventListener("DOMContentLoaded", () => {
    const CONFIG = {
        githubUser: "DarshanAguru",
        githubRepo: "Codex",
        githubFolder: "dsa",
        eTagKey: "codex-etag",
        cacheKey: "codex-cache",
        dataSourceKey: "codex-source"
    };

    let state = {
        dataSource: localStorage.getItem(CONFIG.dataSourceKey) || 'GITHUB',
        allFiles: [],
        currentFile: null,
        isLoading: false,
        sortMode: 'NAME_ASC'
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
        sourceToggle: document.getElementById('source-toggle'),
        menuToggle: document.getElementById('menu-toggle'),
        sidebar: document.getElementById('sidebar'),
        sidebarBackdrop: document.getElementById('sidebar-backdrop'),
        resizer: document.getElementById('resizer')
    };

    init();

    function init() {
        if (window.location.hostname.includes("github.io")) {
            elements.sourceToggle.style.display = 'none';
            state.dataSource = 'GITHUB';
        }

        updateSourceIndicator();
        loadFiles();
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

        elements.sourceToggle.addEventListener('click', toggleSource);

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
        state.dataSource = state.dataSource === 'GITHUB' ? 'LOCAL' : 'GITHUB';
        localStorage.setItem(CONFIG.dataSourceKey, state.dataSource);
        updateSourceIndicator();

        state.allFiles = [];
        renderList([]);
        loadFiles();
    }

    function updateSourceIndicator() {
        elements.sourceToggle.textContent = state.dataSource;
        elements.sourceToggle.className = state.dataSource === 'GITHUB'
            ? "px-2 py-1 rounded bg-dark-700 text-gray-300 hover:bg-dark-600 transition-colors cursor-pointer border border-transparent"
            : "px-2 py-1 rounded bg-brand-600/20 text-brand-500 border border-brand-500/50 hover:bg-brand-600/30 transition-colors cursor-pointer";
    }

    async function loadFiles() {
        setLoading(true);
        try {
            let files = [];
            try {
                files = await fetchFromLocal();
            } catch (e) {
                console.warn("Failed to load static index, falling back to GitHub API", e);
                if (state.dataSource === 'GITHUB') {
                    files = await fetchFromGitHub();
                }
            }

            if (files) {
                state.allFiles = files.filter(item => item.type === "file" && (item.name.endsWith('.txt') || item.name.endsWith('.java') || item.name.endsWith('.cpp')))
                    .map((item, idx) => ({
                        ...item,
                        DisplayName: formatDisplayName(idx, item.name),
                        customDate: null,
                        dateObj: null
                    }));

                // Sort initially by name
                sortFiles();
                renderList(state.allFiles);

                // Fetch dates in background
                fetchFileDates();
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
            setLoading(false);
        }
    }

    async function fetchFileDates() {
        // Limit concurrency to avoid overwhelming
        const batchSize = 5;
        let filesToFetch = [...state.allFiles];

        const fetchDate = async (file) => {
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

                // Extract Date: // Date: 09/01/2026
                const dateMatch = content.match(/\/\/\s*Date:\s*(\d{2}\/\d{2}\/\d{4})/);
                if (dateMatch) {
                    file.customDate = dateMatch[1];
                    const parts = file.customDate.split('/');
                    // MM/DD/YYYY -> YYYY-MM-DD
                    file.dateObj = new Date(`${parts[2]}-${parts[0]}-${parts[1]}`);
                }
            } catch (e) {
                console.warn(`Failed to fetch date for ${file.name}`, e);
            }
        };

        // Process in batches
        for (let i = 0; i < filesToFetch.length; i += batchSize) {
            const batch = filesToFetch.slice(i, i + batchSize);
            await Promise.all(batch.map(f => fetchDate(f)));

            // Re-sort and render if needed
            if (state.sortMode.includes('DATE')) {
                sortFiles();
                renderList(state.allFiles);
            } else {
                // Even if name sort, we might want to show the extracted date in the list text
                renderList(state.allFiles);
            }
        }

        sortFiles();
        renderList(state.allFiles);
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

    async function loadContent(fileItem) {
        const filename = fileItem.name;
        state.currentFile = filename;

        elements.activeFilename.textContent = fileItem.DisplayName;
        elements.emptyState.classList.add('hidden');
        elements.codePre.classList.remove('hidden');
        elements.codeContent.textContent = "Loading...";

        document.querySelectorAll('.file-item').forEach(el => el.classList.remove('active'));
        const activeItem = document.getElementById(`file-${filename}`);
        if (activeItem) activeItem.classList.add('active');

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
        if (!q) {
            renderList(state.allFiles);
            return;
        }
        const filtered = state.allFiles.filter(item =>
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
});

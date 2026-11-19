
/* =====================================
   VIDEO VAULT — ПАНЕЛЬ КЕРУВАННЯ
===================================== */

(function () {
    "use strict";

    const CATEGORY_STORAGE = "videoVaultCategories";

    const defaultCategories = [
        "Програмування",
        "Frappe / CRM",
        "Power BI",
        "Англійська",
        "Інше"
    ];

    let categories = [];

    /* =====================================
       1. ЗАВАНТАЖЕННЯ КАТЕГОРІЙ
    ===================================== */

    function loadCategories() {
        try {
            const saved = localStorage.getItem(CATEGORY_STORAGE);

            if (saved === null) {
                categories = [
                    ...defaultCategories,
                    ...videos.map(video => video.category)
                ];
            } else {
                categories = JSON.parse(saved);

                if (!Array.isArray(categories)) {
                    categories = [];
                }

                categories = [
                    ...categories,
                    ...videos.map(video => video.category)
                ];
            }
        } catch {
            categories = [...defaultCategories];
        }

        categories = [...new Set(
            categories
                .filter(Boolean)
                .map(category => String(category).trim())
                .filter(Boolean)
        )];

        saveCategories();
    }

    function saveCategories() {
        localStorage.setItem(
            CATEGORY_STORAGE,
            JSON.stringify(categories)
        );
    }

    /* =====================================
       2. ОНОВЛЕНА ФУНКЦІЯ КАТЕГОРІЙ
    ===================================== */

    window.getCategories = function () {
        const videoCategories = videos
            .map(video => video.category)
            .filter(Boolean);

        return [...new Set([
            ...categories,
            ...videoCategories
        ])].sort((a, b) => a.localeCompare(b, "uk"));
    };

    /* =====================================
       3. ОНОВЛЕННЯ СПИСКІВ КАТЕГОРІЙ
    ===================================== */

    const originalRefreshCategoryFilter =
        window.refreshCategoryFilter;

    window.refreshCategoryFilter = function () {
        if (typeof originalRefreshCategoryFilter === "function") {
            originalRefreshCategoryFilter();
        }

        const categorySelect = document.getElementById("videoCategory");
        const categoryFilter = document.getElementById("categoryFilter");

        const allCategories = window.getCategories();

        if (categorySelect) {
            const selected = categorySelect.value;

            categorySelect.innerHTML =
                '<option value="">Оберіть категорію</option>';

            allCategories.forEach(category => {
                const option = document.createElement("option");
                option.value = category;
                option.textContent = category;
                categorySelect.appendChild(option);
            });

            if (allCategories.includes(selected)) {
                categorySelect.value = selected;
            }
        }

        if (categoryFilter) {
            const selected = categoryFilter.value;

            categoryFilter.innerHTML =
                '<option value="">Усі категорії</option>';

            allCategories.forEach(category => {
                const option = document.createElement("option");
                option.value = category;
                option.textContent = category;
                categoryFilter.appendChild(option);
            });

            if (allCategories.includes(selected)) {
                categoryFilter.value = selected;
            }
        }
    };

    /* =====================================
       4. СТВОРЕННЯ ПАНЕЛІ
    ===================================== */

    function createManagementPanel() {
        const navActions = document.querySelector(".nav-actions");

        if (!navActions) return;

        const button = document.createElement("button");
        button.className = "management-button";
        button.innerHTML = "⚙ Керування";

        navActions.insertBefore(button, navActions.firstChild);

        const overlay = document.createElement("div");
        overlay.className = "management-overlay";
        overlay.id = "managementOverlay";

        overlay.innerHTML = `
            <aside class="management-sidebar">

                <div class="management-header">
                    <h2>Керування</h2>
                    <button class="management-close" id="managementClose">
                        ✕
                    </button>
                </div>

                <div class="management-section">

                    <h3>Категорії</h3>

                    <form id="addCategoryForm" class="management-add-form">
                        <input
                            type="text"
                            id="newCategoryInput"
                            placeholder="Назва категорії"
                            maxlength="40"
                            required
                        >

                        <button type="submit">+</button>
                    </form>

                    <div id="managementCategories"></div>

                </div>

                <div class="management-divider"></div>

                <div class="management-section">

                    <h3>Теги</h3>

                    <p class="management-description">
                        Усі теги, які використовуються у відео
                    </p>

                    <div id="managementTags"></div>

                </div>

            </aside>
        `;

        document.body.appendChild(overlay);

        button.addEventListener("click", openPanel);

        document
            .getElementById("managementClose")
            .addEventListener("click", closePanel);

        overlay.addEventListener("click", function (event) {
            if (event.target === overlay) {
                closePanel();
            }
        });

        document.addEventListener("keydown", function (event) {
            if (
                event.key === "Escape" &&
                overlay.classList.contains("active")
            ) {
                closePanel();
            }
        });

        document
            .getElementById("addCategoryForm")
            .addEventListener("submit", addCategory);

        renderManagement();
    }

    function openPanel() {
        document
            .getElementById("managementOverlay")
            .classList.add("active");

        renderManagement();
    }

    function closePanel() {
        document
            .getElementById("managementOverlay")
            .classList.remove("active");
    }

    /* =====================================
       5. ДОДАВАННЯ КАТЕГОРІЇ
    ===================================== */

    function addCategory(event) {
        event.preventDefault();

        const input = document.getElementById("newCategoryInput");
        const name = input.value.trim();

        if (!name) return;

        const exists = window.getCategories().some(category =>
            category.toLowerCase() === name.toLowerCase()
        );

        if (exists) {
            alert("Така категорія вже існує.");
            return;
        }

        categories.push(name);

        saveCategories();

        input.value = "";

        window.refreshCategoryFilter();
        window.renderVideos();
        window.updateStatistics();

        renderManagement();
    }

    /* =====================================
       6. ВИДАЛЕННЯ КАТЕГОРІЇ
    ===================================== */

    function deleteCategory(category) {
        const confirmed = confirm(
            `Видалити категорію "${category}"?\n\n` +
            "Категорію буде прибрано з усіх відео, " +
            "але самі відео залишаться."
        );

        if (!confirmed) return;

        categories = categories.filter(
            item => item !== category
        );

        videos.forEach(video => {
            if (video.category === category) {
                video.category = "";
            }
        });

        saveCategories();
        saveVideos();

        window.refreshCategoryFilter();
        window.renderVideos();
        window.updateStatistics();

        renderManagement();
    }

    /* =====================================
       7. ОТРИМАННЯ ВСІХ ТЕГІВ
    ===================================== */

    function getAllTags() {
        const tagMap = new Map();

        videos.forEach(video => {
            let videoTags = video.tags || [];

            if (typeof videoTags === "string") {
                videoTags = videoTags
                    .split(",")
                    .map(tag => tag.trim());
            }

            if (!Array.isArray(videoTags)) return;

            videoTags.forEach(tag => {
                const cleanTag = String(tag).trim();

                if (!cleanTag) return;

                const key = cleanTag.toLowerCase();

                if (!tagMap.has(key)) {
                    tagMap.set(key, {
                        name: cleanTag,
                        count: 0
                    });
                }

                tagMap.get(key).count++;
            });
        });

        return [...tagMap.values()].sort((a, b) =>
            a.name.localeCompare(b.name, "uk")
        );
    }

    /* =====================================
       8. ВИДАЛЕННЯ ТЕГУ
    ===================================== */

    function deleteTag(tagName) {
        const confirmed = confirm(
            `Видалити тег "${tagName}" з усіх відео?`
        );

        if (!confirmed) return;

        videos.forEach(video => {
            if (!Array.isArray(video.tags)) return;

            video.tags = video.tags.filter(tag =>
                String(tag).trim().toLowerCase() !==
                tagName.toLowerCase()
            );
        });

        saveVideos();

        window.renderVideos();
        renderManagement();
    }

    /* =====================================
       9. ВІДОБРАЖЕННЯ ПАНЕЛІ
    ===================================== */

    function renderManagement() {
        const categoryContainer =
            document.getElementById("managementCategories");

        const tagContainer =
            document.getElementById("managementTags");

        if (!categoryContainer || !tagContainer) return;

        const allCategories = window.getCategories();

        // Відображення категорій
        if (allCategories.length === 0) {
            categoryContainer.innerHTML =
                '<p class="management-empty">Категорій поки немає</p>';
        } else {
            categoryContainer.innerHTML = allCategories.map(category => {
                const count = videos.filter(
                    video => video.category === category
                ).length;

                return `
                    <div class="management-item">
                        <div class="management-item-info">
                            <span>${escapeHTML(category)}</span>
                            <small>${count} відео</small>
                        </div>

                        <button
                            class="management-delete"
                            data-category="${escapeHTML(category)}"
                            title="Видалити категорію"
                        >
                            ✕
                        </button>
                    </div>
                `;
            }).join("");
        }

        // Відображення тегів
        const allTags = getAllTags();

        if (allTags.length === 0) {
            tagContainer.innerHTML =
                '<p class="management-empty">Тегів поки немає</p>';
        } else {
            tagContainer.innerHTML = allTags.map(tag => `
                <div class="management-item">

                    <div class="management-item-info">
                        <button
                            type="button"
                            class="management-tag-open"
                            data-open-tag="${escapeHTML(tag.name)}"
                        >
                            #${escapeHTML(tag.name)}
                        </button>

                        <small>${tag.count} використань</small>
                    </div>

                    <button
                        class="management-delete"
                        data-delete-tag="${escapeHTML(tag.name)}"
                        title="Видалити тег"
                    >
                        ✕
                    </button>

                </div>
            `).join("");
        }

        // Видалення категорій
        categoryContainer
            .querySelectorAll("[data-category]")
            .forEach(button => {
                button.addEventListener("click", function () {
                    deleteCategory(this.dataset.category);
                });
            });

        // Натискання на назву тегу — показуємо відповідні відео
        tagContainer
            .querySelectorAll("[data-open-tag]")
            .forEach(button => {
                button.addEventListener("click", function () {
                    const tagName = this.dataset.openTag;

                    changePage("library");

                    currentSearch = tagName;

                    if (searchInput) {
                        searchInput.value = tagName;
                    }

                    renderVideos();

                    closePanel();
                });
            });

        // Видалення тегів
        tagContainer
            .querySelectorAll("[data-delete-tag]")
            .forEach(button => {
                button.addEventListener("click", function () {
                    deleteTag(this.dataset.deleteTag);
                });
            });
    }

    /* =====================================
       10. ЗАПУСК
    ===================================== */

    loadCategories();

    window.refreshCategoryFilter();

    createManagementPanel();

})();

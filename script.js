
/* =====================================
   1. ЕЛЕМЕНТИ СТОРІНКИ
===================================== */

// Навігація та пошук
const navLinks = document.querySelectorAll(".nav-link");
const searchInput = document.getElementById("searchInput");

// Основні секції
const recentSection = document.getElementById("recentSection");
const favoritesSection = document.getElementById("favoritesSection");
const librarySection = document.getElementById("librarySection");
const categoriesSection = document.getElementById("categoriesSection");
const emptyLibrary = document.getElementById("emptyLibrary");

// Контейнери відео
const videoRow = document.querySelector("#recentSection .video-row");
const favoriteRow = document.getElementById("favoriteRow");
const libraryRow = document.getElementById("libraryRow");
const categoriesGrid = document.getElementById("categoriesGrid");

// Фільтри
const categoryFilter = document.getElementById("categoryFilter");
const sortVideos = document.getElementById("sortVideos");

// Модальне вікно додавання
const videoModal = document.getElementById("videoModal");
const videoForm = document.getElementById("videoForm");

const closeModal = document.getElementById("closeModal");
const cancelModal = document.getElementById("cancelModal");

const addVideoButton = document.querySelector(
    ".nav-actions .add-button"
);

// Поля форми
const videoUrl = document.getElementById("videoUrl");
const videoTitle = document.getElementById("videoTitle");
const videoCategory = document.getElementById("videoCategory");
const videoNotes = document.getElementById("videoNotes");
const videoTags = document.getElementById("videoTags");

// Детальне вікно відео
const videoDetailModal = document.getElementById("videoDetailModal");
const closeDetailModal = document.getElementById("closeDetailModal");

const detailTitle = document.getElementById("detailTitle");
const detailCategory = document.getElementById("detailCategory");
const detailNotes = document.getElementById("detailNotes");
const detailTags = document.getElementById("detailTags");
const detailVideoLink = document.getElementById("detailVideoLink");
const detailPlayer = document.getElementById("detailPlayer");


/* =====================================
   2. ЗБЕРІГАННЯ ДАНИХ
===================================== */

let videos = [];

try {
    const savedVideos = JSON.parse(
        localStorage.getItem("videoVaultVideos") || "[]"
    );

    videos = Array.isArray(savedVideos) ? savedVideos : [];

} catch (error) {
    console.error("Помилка читання бібліотеки:", error);
    videos = [];
}

let editingVideoId = null;

let currentPage = "home";
let currentSearch = "";
let selectedCategory = "";

let selectedCoverImage = null;
let removeCoverImage = false;

/* =====================================
   3. ЗБЕРЕЖЕННЯ БІБЛІОТЕКИ
===================================== */

function saveVideos() {
    try {
        localStorage.setItem(
            "videoVaultVideos",
            JSON.stringify(videos)
        );

    } catch (error) {
        console.error("Помилка збереження:", error);

        alert(
            "Не вдалося зберегти бібліотеку. " +
            "Можливо, у браузері недостатньо місця."
        );
    }
}


/* =====================================
   4. ДОПОМІЖНІ ФУНКЦІЇ
===================================== */

// Захист тексту від HTML-коду
function escapeHTML(value) {

    return String(value ?? "").replace(/[&<>"']/g, function(character) {

        const entities = {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#039;"
        };

        return entities[character];
    });
}


// Перевірка посилання
function isValidVideoUrl(value) {

    try {
        const url = new URL(value);

        return (
            url.protocol === "https:" ||
            url.protocol === "http:"
        );

    } catch (error) {
        return false;
    }
}


// Безпечне отримання посилання
function getSafeUrl(value) {

    if (!isValidVideoUrl(value)) {
        return "#";
    }

    return escapeHTML(value);
}


// Отримання списку категорій
function getCategories() {

    return [...new Set(
        videos
            .map(video => (video.category || "").trim())
            .filter(Boolean)
    )].sort((a, b) => a.localeCompare(b, "uk"));
}


// Порівняння дат
function getVideoDate(video) {

    const date = new Date(video.date || 0);

    return Number.isNaN(date.getTime()) ? 0 : date.getTime();
}


/* =====================================
   5. МОДАЛЬНЕ ВІКНО ДОДАВАННЯ
===================================== */

function openModal() {

    if (!videoModal) return;

    videoModal.classList.add("active");
}


function closeVideoModal() {

    if (!videoModal) return;

    videoModal.classList.remove("active");

    if (videoForm) {
        videoForm.reset();
    }

    editingVideoId = null;

    const modalTitle = videoModal.querySelector(".modal-header h2");

    if (modalTitle) {
        modalTitle.textContent = "Додати відео";
    }
}


// Відкриття вікна
if (addVideoButton) {
    addVideoButton.addEventListener("click", openModal);
}


// Закриття вікна
if (closeModal) {
    closeModal.addEventListener("click", closeVideoModal);
}

if (cancelModal) {
    cancelModal.addEventListener("click", closeVideoModal);
}


// Закриття при натисканні на затемнений фон
if (videoModal) {

    videoModal.addEventListener("click", function(event) {

        if (event.target === videoModal) {
            closeVideoModal();
        }

    });
}


// Кнопка додавання у порожній бібліотеці
if (emptyLibrary) {

    const emptyAddButton = emptyLibrary.querySelector(".add-button");

    if (emptyAddButton) {
        emptyAddButton.addEventListener("click", openModal);
    }
}



/* =====================================
   6. ДОДАВАННЯ ТА РЕДАГУВАННЯ
===================================== */

if (videoForm) {

    videoForm.addEventListener("submit", async function(event) {

        event.preventDefault();

        const videoData = {
            title: videoTitle.value.trim(),
            url: videoUrl.value.trim(),
            category: videoCategory.value.trim(),
            notes: videoNotes.value.trim(),

            tags: videoTags.value
                .split(",")
                .map(tag => tag.trim())
                .filter(tag => tag !== "")
        };


        if (!videoData.title) {
            alert("Введіть назву відео!");
            return;
        }

        if (!videoData.url || !isValidVideoUrl(videoData.url)) {
            alert("Введіть правильне посилання на відео!");
            return;
        }


        // Зберігаємо стару обкладинку під час редагування
        const existingVideo = editingVideoId !== null
            ? videos.find(item => item.id === editingVideoId)
            : null;

        let coverImage = existingVideo?.coverImage || "";


        // Якщо користувач вирішив видалити стару обкладинку
        if (removeCoverImage) {
            coverImage = "";
        }


        // Якщо вибрано нове фото — стискаємо його
        if (selectedCoverImage) {

            try {

                coverImage = await compressCoverImage(selectedCoverImage);

            } catch (error) {

                console.error("Помилка обробки фото:", error);

                alert("Не вдалося обробити фотографію. Спробуй інше зображення.");

                return;
            }

        }


        videoData.coverImage = coverImage;


        // РЕДАГУВАННЯ
        if (editingVideoId !== null) {

            const video = videos.find(
                item => item.id === editingVideoId
            );

            if (video) {
                Object.assign(video, videoData);
            }

        } else {

            // ДОДАВАННЯ
            const newVideo = {
                id: Date.now(),
                ...videoData,
                favorite: false,
                date: new Date().toISOString()
            };

            videos.unshift(newVideo);
        }


        selectedCoverImage = null;
        removeCoverImage = false;

        saveVideos();

        refreshCategoryFilter();
        renderVideos();

        closeVideoModal();
        showCoverPreview("");

    });

}




/* =====================================
   7. РЕДАГУВАННЯ ВІДЕО
===================================== */

function editVideo(id) {

    const video = videos.find(
        item => item.id === id
    );

    if (!video) return;

    editingVideoId = id;

    videoTitle.value = video.title || "";
    videoUrl.value = video.url || "";
    videoCategory.value = video.category || "";
    videoNotes.value = video.notes || "";

    videoTags.value = (video.tags || []).join(", ");

    selectedCoverImage = null;
    removeCoverImage = false;

    const modalTitle = videoModal.querySelector(".modal-header h2");

    if (modalTitle) {
        modalTitle.textContent = "Редагувати відео";
    }

    openModal();

    // Показуємо поточну обкладинку
    showCoverPreview(video.coverImage || "");

}



/* =====================================
   8. ВИДАЛЕННЯ ВІДЕО
===================================== */

function deleteVideo(id) {

    const confirmed = confirm(
        "Точно хочеш видалити це відео?"
    );

    if (!confirmed) return;

    videos = videos.filter(
        item => item.id !== id
    );

    saveVideos();

    refreshCategoryFilter();
    renderVideos();
}


/* =====================================
   9. ОБРАНЕ
===================================== */

function toggleFavorite(id) {

    const video = videos.find(
        item => item.id === id
    );

    if (!video) return;

    video.favorite = !video.favorite;

    saveVideos();
    renderVideos();
}


/* =====================================
   10. ОТРИМАННЯ YOUTUBE ID
===================================== */

function getYouTubeId(url) {

    try {

        const parsedUrl = new URL(url);

        const hostname = parsedUrl.hostname
            .replace(/^www\./, "")
            .toLowerCase();

        let videoId = null;


        // youtube.com
        if (
            hostname === "youtube.com" ||
            hostname === "m.youtube.com"
        ) {

            videoId = parsedUrl.searchParams.get("v");

            if (!videoId) {

                const match = parsedUrl.pathname.match(
                    /^\/(?:embed|shorts|live)\/([^/]+)/
                );

                if (match) {
                    videoId = match[1];
                }
            }
        }


        // youtu.be
        if (hostname === "youtu.be") {
            videoId = parsedUrl.pathname.split("/")[1];
        }


        // Перевірка ID
        if (
            videoId &&
            /^[a-zA-Z0-9_-]{11}$/.test(videoId)
        ) {
            return videoId;
        }

        return null;

    } catch (error) {

        return null;

    }
}


/* =====================================
   11. ВИЗНАЧЕННЯ ВІДЕОПЛАТФОРМИ
===================================== */

function getVideoPlatform(url) {

    try {

        const hostname = new URL(url).hostname
            .replace(/^www\./, "")
            .toLowerCase();


        if (
            hostname === "youtube.com" ||
            hostname === "m.youtube.com" ||
            hostname === "youtu.be"
        ) {
            return "youtube";
        }


        if (
            hostname === "vimeo.com" ||
            hostname === "player.vimeo.com"
        ) {
            return "vimeo";
        }


        if (
            hostname === "dailymotion.com" ||
            hostname === "dai.ly"
        ) {
            return "dailymotion";
        }


        return "external";

    } catch (error) {

        return "external";

    }
}


/* =====================================
   12. ЗОВНІШНІЙ ПЛЕЄР
===================================== */

function showExternalPlayer() {

    if (!detailPlayer) return;

    detailPlayer.innerHTML = `
        <div class="player-placeholder">
            <span>↗</span>

            <p>
                Цей сайт не підтримує вбудований перегляд
            </p>

            <small>
                Скористайся кнопкою нижче, щоб відкрити відео
            </small>
        </div>
    `;
}


/* =====================================
   13. ВІДТВОРЕННЯ ВІДЕО
===================================== */

function renderVideoPlayer(url) {

    if (!detailPlayer) return;

    detailPlayer.innerHTML = "";

    const platform = getVideoPlatform(url);


    // YOUTUBE
    if (platform === "youtube") {

        const id = getYouTubeId(url);

        if (!id) {
            showExternalPlayer();
            return;
        }

        const iframe = document.createElement("iframe");

        iframe.src = `https://www.youtube-nocookie.com/embed/${id}`;

        iframe.title = "YouTube video player";

        iframe.allow =
            "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";

        iframe.allowFullscreen = true;

        iframe.referrerPolicy = "strict-origin-when-cross-origin";

        detailPlayer.appendChild(iframe);

        return;
    }


    // VIMEO
    if (platform === "vimeo") {

        let match = url.match(
            /vimeo\.com\/(?:video\/)?(\d+)/
        );

        if (!match) {
            showExternalPlayer();
            return;
        }

        const iframe = document.createElement("iframe");

        iframe.src = `https://player.vimeo.com/video/${match[1]}`;

        iframe.title = "Vimeo video player";

        iframe.allow =
            "autoplay; fullscreen; picture-in-picture";

        iframe.allowFullscreen = true;

        detailPlayer.appendChild(iframe);

        return;
    }


    // DAILYMOTION
    if (platform === "dailymotion") {

        const match = url.match(
            /(?:dailymotion\.com\/video\/|dai\.ly\/)([a-zA-Z0-9]+)/
        );

        if (!match) {
            showExternalPlayer();
            return;
        }

        const iframe = document.createElement("iframe");

        iframe.src =
            `https://www.dailymotion.com/embed/video/${match[1]}`;

        iframe.title = "Dailymotion video player";

        iframe.allow =
            "autoplay; fullscreen; picture-in-picture";

        iframe.allowFullscreen = true;

        detailPlayer.appendChild(iframe);

        return;
    }


    // ІНШІ САЙТИ
    showExternalPlayer();
}


/* =====================================
   14. СТВОРЕННЯ КАРТКИ ВІДЕО
===================================== */

function createVideoCard(video) {

    console.log("Обкладинка відео:", video.coverImage);

    const card = document.createElement("div");

    card.className = "video-card";

    const youtubeId = getYouTubeId(video.url);

    let thumbnailHTML = "";

    // Спочатку перевіряємо власну обкладинку
    if (video.coverImage) {

        thumbnailHTML = `
            <img
                src="${video.coverImage}"
                alt="${escapeHTML(video.title)}"
                class="custom-video-cover"
            >
        `;

    }

    // Якщо власної обкладинки немає — беремо YouTube
    else if (youtubeId) {

        thumbnailHTML = `
            <img
                src="https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg"
                alt="${escapeHTML(video.title)}"
                class="custom-video-cover"
            >
        `;

    }


    // Теги
    const tagsHTML = (video.tags || [])
        .map(tag => `
            <span class="video-tag">
                #${escapeHTML(tag)}
            </span>
        `)
        .join("");


    // Посилання
    const safeUrl = getSafeUrl(video.url);


    card.innerHTML = `

        <a
            href="${safeUrl}"
            target="_blank"
            rel="noopener noreferrer"
            class="video-thumbnail"
            aria-label="Відкрити відео"
        >
            ${thumbnailHTML}
            <span class="play-icon">▶</span>
        </a>


        <div class="video-info">

            <h3>${escapeHTML(video.title)}</h3>

            <p class="video-category">
                ${escapeHTML(video.category || "Без категорії")}
            </p>

            ${video.notes ? `
                <p class="video-notes">
                    ${escapeHTML(video.notes)}
                </p>
            ` : ""}

            <div class="video-tags">
                ${tagsHTML}
            </div>


            <div class="video-actions">

                <button
                    class="favorite-button ${video.favorite ? "active" : ""}"
                    data-action="favorite"
                    data-id="${video.id}"
                >
                    ${video.favorite ? "♥ В обраному" : "♡ В обране"}
                </button>


                <button
                    class="edit-button"
                    data-action="edit"
                    data-id="${video.id}"
                    title="Редагувати"
                >
                    ✎
                </button>


                <button
                    class="delete-button"
                    data-action="delete"
                    data-id="${video.id}"
                    title="Видалити"
                >
                    ✕
                </button>

            </div>

        </div>

    `;


    // Відкриття детального вікна
    card.addEventListener("click", function(event) {

        // Не відкриваємо деталі при натисканні на кнопки
        if (event.target.closest("button")) return;

        // Не перехоплюємо натискання на посилання
        if (event.target.closest("a")) return;

        openVideoDetails(video.id);

    });


    // Обробка кнопок
    card.querySelectorAll("[data-action]").forEach(button => {

        button.addEventListener("click", function(event) {

            event.stopPropagation();

            const action = this.dataset.action;
            const id = Number(this.dataset.id);

            if (action === "favorite") {
                toggleFavorite(id);
            }

            if (action === "edit") {
                editVideo(id);
            }

            if (action === "delete") {
                deleteVideo(id);
            }

        });

    });


    return card;
}


/* =====================================
   15. ДЕТАЛЬНА ІНФОРМАЦІЯ ПРО ВІДЕО
===================================== */

function openVideoDetails(id) {

    const video = videos.find(
        item => item.id === id
    );

    if (!video) return;

    if (!videoDetailModal) return;


    detailTitle.textContent = video.title;

    detailCategory.textContent =
        video.category || "Без категорії";

    detailNotes.textContent =
        video.notes || "Нотаток поки немає.";


    detailVideoLink.href = video.url;

    detailVideoLink.target = "_blank";

    detailVideoLink.rel = "noopener noreferrer";


    // Запускаємо плеєр
    renderVideoPlayer(video.url);


    // Відображення тегів у картці відео
    detailTags.innerHTML = "";

    (video.tags || []).forEach(tag => {

        const tagElement = document.createElement("button");

        tagElement.type = "button";
        tagElement.className = "video-tag video-tag-button";
        tagElement.textContent = `#${tag}`;

        tagElement.addEventListener("click", function (event) {

            event.stopPropagation();

            const tagName = String(tag).trim();

            // Закриваємо картку відео
            closeVideoDetails();

            // Відкриваємо бібліотеку
            changePage("library");

            // Встановлюємо пошук за тегом
            currentSearch = tagName;

            if (searchInput) {
                searchInput.value = tagName;
            }

            // Оновлюємо список відео
            renderVideos();

        });

        detailTags.appendChild(tagElement);

    });


    videoDetailModal.classList.add("active");
}


/* =====================================
   16. ЗАКРИТТЯ ДЕТАЛЬНОГО ВІКНА
===================================== */

function closeVideoDetails() {

    if (!videoDetailModal) return;

    videoDetailModal.classList.remove("active");


    // Зупиняємо відео після закриття
    if (detailPlayer) {
        detailPlayer.innerHTML = "";
    }
}


if (closeDetailModal) {

    closeDetailModal.addEventListener(
        "click",
        closeVideoDetails
    );

}


if (videoDetailModal) {

    videoDetailModal.addEventListener("click", function(event) {

        if (event.target === videoDetailModal) {
            closeVideoDetails();
        }

    });

}


/* =====================================
   17. ПОШУК ВІДЕО
===================================== */

function searchVideos(videoList) {

    if (!currentSearch) {
        return videoList;
    }

    const search = currentSearch.toLowerCase();

    return videoList.filter(video => {

        const title = (video.title || "").toLowerCase();

        const category = (video.category || "").toLowerCase();

        const notes = (video.notes || "").toLowerCase();

        const tags = (video.tags || [])
            .join(" ")
            .toLowerCase();


        return (
            title.includes(search) ||
            category.includes(search) ||
            notes.includes(search) ||
            tags.includes(search)
        );

    });
}


/* =====================================
   18. ФІЛЬТР ЗА КАТЕГОРІЯМИ
===================================== */

function refreshCategoryFilter() {

    if (!categoryFilter) return;

    const currentValue = categoryFilter.value;

    const categories = getCategories();

    categoryFilter.innerHTML = `
        <option value="">Усі категорії</option>
    `;


    categories.forEach(category => {

        const option = document.createElement("option");

        option.value = category;
        option.textContent = category;

        categoryFilter.appendChild(option);

    });


    // Зберігаємо вибрану категорію, якщо вона ще існує
    if (categories.includes(currentValue)) {

        categoryFilter.value = currentValue;

    } else {

        categoryFilter.value = "";
    }
}


/* =====================================
   19. СОРТУВАННЯ ВІДЕО
===================================== */

function sortVideoList(videoList) {

    const sortType = sortVideos ? sortVideos.value : "newest";

    const sorted = [...videoList];


    if (
        sortType === "oldest" ||
        sortType === "date-asc"
    ) {

        sorted.sort(
            (a, b) => getVideoDate(a) - getVideoDate(b)
        );

    } else if (
        sortType === "title-asc" ||
        sortType === "alphabetical"
    ) {

        sorted.sort(
            (a, b) => (a.title || "").localeCompare(b.title || "", "uk")
        );

    } else if (sortType === "title-desc") {

        sorted.sort(
            (a, b) => (b.title || "").localeCompare(a.title || "", "uk")
        );

    } else {

        // За замовчуванням — спочатку нові
        sorted.sort(
            (a, b) => getVideoDate(b) - getVideoDate(a)
        );

    }

    return sorted;
}


/* =====================================
   20. НАВІГАЦІЯ
===================================== */

function changePage(page) {

    const allowedPages = [
        "home",
        "library",
        "favorites",
        "categories"
    ];

    if (!allowedPages.includes(page)) {
        page = "home";
    }

    currentPage = page;

    // При переході на іншу сторінку скидаємо пошук
    currentSearch = "";

    if (searchInput) {
        searchInput.value = "";
    }

    // При переході до бібліотеки скидаємо вибрану категорію
    if (page === "library") {

        selectedCategory = "";

        if (categoryFilter) {
            categoryFilter.value = "";
        }
    }


    navLinks.forEach(link => {

        link.classList.toggle(
            "active",
            link.dataset.page === page
        );

    });


    renderVideos();

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}


// Обробка навігації
navLinks.forEach(link => {

    link.addEventListener("click", function(event) {

        event.preventDefault();

        changePage(this.dataset.page);

    });

});


/* =====================================
   21. ПОШУК У РЕАЛЬНОМУ ЧАСІ
===================================== */

if (searchInput) {

    searchInput.addEventListener("input", function() {

        currentSearch = this.value.trim();

        renderVideos();

    });

}


/* =====================================
   22. ОБРОБКА ФІЛЬТРІВ
===================================== */

if (categoryFilter) {

    categoryFilter.addEventListener("change", function() {

        selectedCategory = this.value;

        renderVideos();

    });

}


if (sortVideos) {

    sortVideos.addEventListener("change", function() {

        renderVideos();

    });

}


/* =====================================
   23. ВІДОБРАЖЕННЯ КАТЕГОРІЙ
===================================== */

function renderCategories() {

    if (!categoriesGrid) return;

    categoriesGrid.innerHTML = "";

    let categories = getCategories();


    // Пошук за назвою категорії
    if (currentSearch) {

        categories = categories.filter(category =>
            category.toLowerCase().includes(
                currentSearch.toLowerCase()
            )
        );

    }


    if (categories.length === 0) {

        categoriesGrid.innerHTML = `
            <p class="empty-message">
                Категорій поки немає.
                Додай відео та вкажи його категорію.
            </p>
        `;

        return;
    }


    categories.forEach(category => {

        const count = videos.filter(
            video => video.category === category
        ).length;


        const button = document.createElement("button");

        button.className = "category-button";

        button.innerHTML = `
            <span>${escapeHTML(category)}</span>

            <small>
                ${count} відео
            </small>
        `;


        button.addEventListener("click", function() {

            selectedCategory = category;

            currentPage = "library";

            currentSearch = "";

            if (searchInput) {
                searchInput.value = "";
            }

            if (categoryFilter) {
                refreshCategoryFilter();
                categoryFilter.value = category;
            }

            navLinks.forEach(link => {

                link.classList.toggle(
                    "active",
                    link.dataset.page === "library"
                );

            });

            renderVideos();

            window.scrollTo({
                top: 0,
                behavior: "smooth"
            });

        });


        categoriesGrid.appendChild(button);

    });

}


/* =====================================
   24. ВІДОБРАЖЕННЯ ВІДЕО
===================================== */

function renderVideos() {

    // Оновлюємо статистику
    updateStatistics();


    // Оновлюємо список категорій
    refreshCategoryFilter();


    // Ховаємо всі основні секції
    if (recentSection) recentSection.style.display = "none";

    if (favoritesSection) favoritesSection.style.display = "none";

    if (librarySection) librarySection.style.display = "none";

    if (categoriesSection) categoriesSection.style.display = "none";

    if (emptyLibrary) emptyLibrary.style.display = "none";


    // =================================
    // ГОЛОВНА
    // =================================

    if (currentPage === "home") {

        if (recentSection) {
            recentSection.style.display = "";
        }

        if (favoritesSection) {
            favoritesSection.style.display = "";
        }


        if (videoRow) {

            videoRow.innerHTML = "";

            const recentVideos = searchVideos(videos)
                .sort((a, b) => getVideoDate(b) - getVideoDate(a))
                .slice(0, 8);


            recentVideos.forEach(video => {
                videoRow.appendChild(createVideoCard(video));
            });


            if (recentVideos.length === 0) {

                videoRow.innerHTML = `
                    <p class="empty-message">
                        ${videos.length === 0
                            ? "Тут поки немає відео. Додай перше!"
                            : "Нічого не знайдено."
                        }
                    </p>
                `;

            }

        }


        if (favoriteRow) {

            favoriteRow.innerHTML = "";

            const favorites = searchVideos(
                videos.filter(video => video.favorite)
            );


            favorites.forEach(video => {
                favoriteRow.appendChild(createVideoCard(video));
            });


            if (favorites.length === 0) {

                if (favoritesSection) {
                    favoritesSection.style.display = "none";
                }

            }

        }

    }


    // =================================
    // МОЯ БІБЛІОТЕКА
    // =================================

    else if (currentPage === "library") {

        if (librarySection) {
            librarySection.style.display = "";
        }


        if (libraryRow) {

            libraryRow.innerHTML = "";

            let filteredVideos = [...videos];


            // Фільтр за категорією
            if (selectedCategory) {

                filteredVideos = filteredVideos.filter(
                    video => video.category === selectedCategory
                );

            }


            // Пошук
            filteredVideos = searchVideos(filteredVideos);


            // Сортування
            filteredVideos = sortVideoList(filteredVideos);


            filteredVideos.forEach(video => {

                libraryRow.appendChild(
                    createVideoCard(video)
                );

            });


            // Порожня бібліотека
            if (videos.length === 0) {

                if (emptyLibrary) {
                    emptyLibrary.style.display = "block";
                }

            }

            // Немає результатів пошуку або фільтра
            else if (filteredVideos.length === 0) {

                libraryRow.innerHTML = `
                    <p class="empty-message">
                        Нічого не знайдено.
                    </p>
                `;

            }

        }

    }


    // =================================
    // ОБРАНЕ
    // =================================

    else if (currentPage === "favorites") {

        if (favoritesSection) {
            favoritesSection.style.display = "";
        }


        if (favoriteRow) {

            favoriteRow.innerHTML = "";

            let favorites = videos.filter(
                video => video.favorite
            );

            favorites = searchVideos(favorites);


            favorites.forEach(video => {

                favoriteRow.appendChild(
                    createVideoCard(video)
                );

            });


            if (favorites.length === 0) {

                favoriteRow.innerHTML = `
                    <p class="empty-message">
                        ${videos.some(video => video.favorite)
                            ? "Нічого не знайдено."
                            : "Тут поки немає обраних відео."
                        }
                    </p>
                `;

            }

        }

    }


    // =================================
    // КАТЕГОРІЇ
    // =================================

    else if (currentPage === "categories") {

        if (categoriesSection) {
            categoriesSection.style.display = "";
        }

        renderCategories();

    }

}


/* =====================================
   25. СТАТИСТИКА
===================================== */

function updateStatistics() {

    const totalElement = document.getElementById("totalVideos");

    const favoriteElement = document.getElementById("totalFavorites");

    const categoryElement = document.getElementById("totalCategories");


    // Загальна кількість відео
    const total = videos.length;


    // Кількість обраних
    const favorites = videos.filter(
        video => video.favorite
    ).length;


    // Кількість категорій
    const categories = getCategories().length;


    if (totalElement) {
        totalElement.textContent = total;
    }

    if (favoriteElement) {
        favoriteElement.textContent = favorites;
    }

    if (categoryElement) {
        categoryElement.textContent = categories;
    }

}


/* =====================================
   26. КНОПКИ ГОЛОВНОГО БАНЕРА
===================================== */

const heroPrimary = document.querySelector(".hero-primary");

const heroSecondary = document.querySelector(".hero-secondary");


if (heroPrimary) {

    heroPrimary.addEventListener("click", function() {

        changePage("library");

    });

}


if (heroSecondary) {

    heroSecondary.addEventListener("click", function() {

        changePage("favorites");

    });

}


/* =====================================
   27. ЗАКРИТТЯ ВІКОН КЛАВІШЕЮ ESC
===================================== */

document.addEventListener("keydown", function(event) {

    if (event.key !== "Escape") return;

    closeVideoModal();

    closeVideoDetails();

});


/* =====================================
   28. ЗАПУСК САЙТУ
===================================== */

// Початковий стан
refreshCategoryFilter();

renderVideos();

console.log("VideoVault успішно запущено!");


/* =====================================
   29. РЕЗЕРВНЕ КОПІЮВАННЯ
===================================== */

// Створюємо панель резервного копіювання
function createBackupControls() {

    const libraryControls = document.querySelector(".library-controls");

    if (!libraryControls) return;

    // Захист від повторного створення кнопок
    if (document.getElementById("backupControls")) return;

    const backupControls = document.createElement("div");

    backupControls.id = "backupControls";

    backupControls.style.display = "flex";
    backupControls.style.gap = "10px";
    backupControls.style.flexWrap = "wrap";
    backupControls.style.marginTop = "12px";

    backupControls.innerHTML = `
        <button
            type="button"
            class="add-button"
            id="exportVideos"
        >
            ↓ Експорт
        </button>

        <button
            type="button"
            class="add-button"
            id="importVideos"
        >
            ↑ Імпорт
        </button>

        <input
            type="file"
            id="importFile"
            accept=".json,application/json"
            style="display: none;"
        >
    `;

    libraryControls.appendChild(backupControls);


    // Кнопки
    const exportButton = document.getElementById("exportVideos");
    const importButton = document.getElementById("importVideos");
    const importFile = document.getElementById("importFile");


    // ЕКСПОРТ
    exportButton.addEventListener("click", exportVideos);


    // Відкриття вибору файлу
    importButton.addEventListener("click", function() {
        importFile.click();
    });


    // ІМПОРТ
    importFile.addEventListener("change", function(event) {

        const file = event.target.files[0];

        if (!file) return;

        importVideosFromFile(file);

        // Дозволяємо повторно вибрати той самий файл
        event.target.value = "";

    });

}


/* =====================================
   30. ЕКСПОРТ БІБЛІОТЕКИ
===================================== */

function exportVideos() {

    if (videos.length === 0) {

        alert("У бібліотеці поки немає відео для експорту.");

        return;
    }


    const backup = {
        application: "VideoVault",
        version: 1,
        exportedAt: new Date().toISOString(),
        videos: videos
    };


    const json = JSON.stringify(backup, null, 4);

    const blob = new Blob(
        [json],
        { type: "application/json;charset=utf-8" }
    );

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");

    const date = new Date().toISOString().slice(0, 10);

    link.href = url;
    link.download = `VideoVault_backup_${date}.json`;

    document.body.appendChild(link);

    link.click();

    link.remove();

    URL.revokeObjectURL(url);


    alert(
        `Резервну копію створено!\n\nЗбережено відео: ${videos.length}`
    );

}


/* =====================================
   31. ПЕРЕВІРКА ФАЙЛУ РЕЗЕРВНОЇ КОПІЇ
===================================== */


function validateBackup(data) {

    let importedVideos;

    if (Array.isArray(data)) {

        importedVideos = data;

    } else if (
        data &&
        data.application === "VideoVault" &&
        Array.isArray(data.videos)
    ) {

        importedVideos = data.videos;

    } else {

        throw new Error("Файл не є резервною копією VideoVault.");

    }


    if (importedVideos.length === 0) {

        throw new Error("У файлі немає відео.");

    }


    const validVideos = importedVideos.map((video, index) => {

        if (
            !video ||
            typeof video !== "object" ||
            typeof video.title !== "string" ||
            typeof video.url !== "string" ||
            !isValidVideoUrl(video.url)
        ) {

            throw new Error(
                `Помилка у записі №${index + 1}. Перевір назву та посилання.`
            );

        }


        return {
            id: video.id ?? Date.now() + index,

            title: video.title,
            url: video.url,

            category: typeof video.category === "string"
                ? video.category
                : "",

            notes: typeof video.notes === "string"
                ? video.notes
                : "",

            tags: Array.isArray(video.tags)
                ? video.tags.filter(tag => typeof tag === "string")
                : [],

            favorite: video.favorite === true,

            coverImage: typeof video.coverImage === "string"
                ? video.coverImage
                : "",

            date: video.date || new Date().toISOString()
        };

    }); // Ось цього закриття не вистачало!


    return validVideos;

}



/* =====================================
   32. ІМПОРТ БІБЛІОТЕКИ
===================================== */

function importVideosFromFile(file) {

    if (!file.name.toLowerCase().endsWith(".json")) {

        alert("Будь ласка, вибери файл формату JSON.");

        return;
    }


    const reader = new FileReader();


    reader.onload = function(event) {

        try {

            const data = JSON.parse(event.target.result);

            const importedVideos = validateBackup(data);


            const confirmed = confirm(
                `У файлі знайдено ${importedVideos.length} відео.\n\n` +
                "Увага! Поточна бібліотека буде замінена даними з файлу.\n\n" +
                "Перед продовженням переконайся, що маєш копію поточної бібліотеки.\n\n" +
                "Продовжити імпорт?"
            );


            if (!confirmed) return;


            // Замінюємо поточну бібліотеку
            videos = importedVideos;


            // Зберігаємо
            saveVideos();


            // Оновлюємо інтерфейс
            selectedCategory = "";
            currentSearch = "";

            if (searchInput) {
                searchInput.value = "";
            }

            if (categoryFilter) {
                categoryFilter.value = "";
            }

            refreshCategoryFilter();

            renderVideos();


            alert(
                `Імпорт успішний!\n\nЗавантажено відео: ${videos.length}`
            );


        } catch (error) {

            console.error("Помилка імпорту:", error);

            alert(
                "Не вдалося імпортувати файл.\n\n" +
                error.message
            );

        }

    };


    reader.onerror = function() {

        alert("Не вдалося прочитати файл.");

    };


    reader.readAsText(file);

}


/* =====================================
   33. ЗАПУСК РЕЗЕРВНОГО КОПІЮВАННЯ
===================================== */

createBackupControls();



/* =====================================
   34. ВИБІР ОБКЛАДИНКИ
===================================== */

let coverPreviewObjectUrl = null;

function createCoverControls() {

    if (!videoForm) return;

    if (document.getElementById("coverImageInput")) return;

    const coverGroup = document.createElement("div");

    coverGroup.className = "form-group";
    coverGroup.style.marginTop = "15px";

    coverGroup.innerHTML = `
        <label for="coverImageInput">
            Обкладинка відео
        </label>

        <input
            type="file"
            id="coverImageInput"
            accept="image/*"
        >

        <small style="display:block; margin-top:6px; color:#999;">
            Можеш завантажити фото з комп'ютера
            або вставити скріншот через Ctrl + V.
        </small>

        <div id="coverPreviewContainer" style="display:none; margin-top:12px;">

            <img
                id="coverPreview"
                alt="Попередній перегляд обкладинки"
                style="
                    width:100%;
                    max-width:300px;
                    height:160px;
                    object-fit:cover;
                    border-radius:10px;
                    display:block;
                "
            >

            <button
                type="button"
                id="removeCoverButton"
                style="
                    margin-top:8px;
                    padding:8px 12px;
                    cursor:pointer;
                "
            >
                Видалити обкладинку
            </button>

        </div>
    `;

    videoForm.appendChild(coverGroup);

    const coverInput = document.getElementById("coverImageInput");
    const removeButton = document.getElementById("removeCoverButton");

    // Обробка вибраного зображення
    function selectCoverFile(file) {

        if (!file || !file.type.startsWith("image/")) {
            alert("Вибери файл зображення.");
            return;
        }

        if (file.size > 10 * 1024 * 1024) {
            alert("Фото завелике. Максимальний розмір — 10 МБ.");
            return;
        }

        selectedCoverImage = file;
        removeCoverImage = false;

        showCoverPreview(URL.createObjectURL(file));
    }

    // Звичайне завантаження фотографії
    coverInput.addEventListener("change", function() {

        const file = this.files[0];

        if (!file) return;

        selectCoverFile(file);

    });

    // Вставлення скріншота через Ctrl + V
    document.addEventListener("paste", function(event) {

        // Працюємо тільки коли відкрите вікно додавання/редагування
        if (!videoModal.classList.contains("active")) return;

        const items = event.clipboardData?.items;

        if (!items) return;

        for (const item of items) {

            if (item.type.startsWith("image/")) {

                const file = item.getAsFile();

                if (!file) continue;

                event.preventDefault();

                selectCoverFile(file);

                // Скидаємо вибір файлу
                coverInput.value = "";

                return;
            }

        }

    });

    // Видалення обкладинки
    removeButton.addEventListener("click", function() {

        selectedCoverImage = null;
        removeCoverImage = true;

        coverInput.value = "";

        showCoverPreview("");

    });

}



/* =====================================
   35. ПОПЕРЕДНІЙ ПЕРЕГЛЯД ФОТО
===================================== */

function showCoverPreview(imageUrl) {

    const container = document.getElementById("coverPreviewContainer");

    const preview = document.getElementById("coverPreview");

    if (!container || !preview) return;


    // Прибираємо попередній тимчасовий URL
    if (coverPreviewObjectUrl) {

        URL.revokeObjectURL(coverPreviewObjectUrl);

        coverPreviewObjectUrl = null;

    }


    if (!imageUrl) {

        container.style.display = "none";

        preview.removeAttribute("src");

        return;
    }


    preview.src = imageUrl;

    container.style.display = "block";


    // Запам'ятовуємо тимчасовий URL лише для вибраного файлу
    if (imageUrl.startsWith("blob:")) {
        coverPreviewObjectUrl = imageUrl;
    }

}


/* =====================================
   36. СТИСНЕННЯ ФОТОГРАФІЇ
===================================== */

function compressCoverImage(file) {

    return new Promise((resolve, reject) => {

        const imageUrl = URL.createObjectURL(file);

        const image = new Image();


        image.onload = function() {

            try {

                const canvas = document.createElement("canvas");

                const maxWidth = 1200;
                const maxHeight = 1200;

                let width = image.width;
                let height = image.height;


                // Зменшуємо великі фотографії
                if (width > maxWidth || height > maxHeight) {

                    const ratio = Math.min(
                        maxWidth / width,
                        maxHeight / height
                    );

                    width = Math.round(width * ratio);

                    height = Math.round(height * ratio);

                }


                canvas.width = width;
                canvas.height = height;

                const context = canvas.getContext("2d");

                if (!context) {
                    throw new Error("Не вдалося обробити фотографію.");
                }

                context.drawImage(
                    image,
                    0,
                    0,
                    width,
                    height
                );


                // Перетворюємо на JPEG і стискаємо
                const compressedImage = canvas.toDataURL(
                    "image/jpeg",
                    0.82
                );


                URL.revokeObjectURL(imageUrl);

                resolve(compressedImage);

            } catch (error) {

                URL.revokeObjectURL(imageUrl);

                reject(error);

            }

        };


        image.onerror = function() {

            URL.revokeObjectURL(imageUrl);

            reject(new Error("Не вдалося відкрити фотографію."));

        };


        image.src = imageUrl;

    });

}


/* =====================================
   37. СКИДАННЯ ВИБРАНОЇ ОБКЛАДИНКИ
===================================== */

function resetCoverSelection() {

    selectedCoverImage = null;

    removeCoverImage = false;

    const coverInput = document.getElementById("coverImageInput");

    if (coverInput) {
        coverInput.value = "";
    }

    showCoverPreview("");

}


// Скидаємо вибір після закриття модального вікна
if (closeModal) {
    closeModal.addEventListener("click", resetCoverSelection);
}

if (cancelModal) {
    cancelModal.addEventListener("click", resetCoverSelection);
}

if (videoModal) {

    videoModal.addEventListener("click", function(event) {

        if (event.target === videoModal) {
            resetCoverSelection();
        }

    });

}


/* =====================================
   38. ЗАПУСК ФУНКЦІЙ ОБКЛАДИНКИ
===================================== */

createCoverControls();

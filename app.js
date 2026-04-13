import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getFirestore, collection, onSnapshot, query, orderBy } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT.appspot.com",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
};

const productGrid = document.getElementById('productGrid');
const searchInput = document.getElementById('searchInput');
const categoryButtons = document.querySelectorAll('.category-btn');
const prevPageBtn = document.getElementById('prevPageBtn');
const nextPageBtn = document.getElementById('nextPageBtn');
const pageInfo = document.getElementById('pageInfo');
const paginationControls = document.getElementById('paginationControls');
const currentDateTime = document.getElementById('currentDateTime');
const countdownTimer = document.getElementById('countdownTimer');
const newsTicker = document.getElementById('newsTicker');
const categoryShowcase = document.getElementById('categoryShowcase');
const flashSaleGrid = document.getElementById('flashSaleGrid');
const topProductsGrid = document.getElementById('topProductsGrid');
const mallGrid = document.getElementById('mallGrid');
const flashCountdown = document.getElementById('flashCountdown');
const topItemsStrip = document.getElementById('topItemsStrip');

const state = {
    searchTerm: '',
    category: 'all',
    products: [],
    filteredProducts: [],
    currentPage: 1,
    pageSize: 10
};

let csvProductsCache = [];

const quickShopeeLinks = [
    'https://s.shopee.ph/9UxUeT7jqW',
    'https://s.shopee.ph/30k0uXgwSb',
    'https://s.shopee.ph/4AvyIhnqqw',
    'https://s.shopee.ph/2qQaiGOgjW',
    'https://s.shopee.ph/1BIMjDOeEL'
];

const demoSeedProducts = [
    { title: 'Oversized Street Tee - Minimal Black', price: 'P349', originalPrice: 'P699', discount: '-50%', sold: '3.2k sold', rating: '4.9', category: 'fashion', merchant: 'Urban Layer PH', image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=1200&auto=format&fit=crop' },
    { title: 'Korean Fit Hoodie Jacket Unisex', price: 'P420', originalPrice: 'P820', discount: '-49%', sold: '2.7k sold', rating: '4.8', category: 'fashion', merchant: 'StreetLab Official', image: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?q=80&w=1200&auto=format&fit=crop' },
    { title: 'Canvas Tote Bag - Personalized', price: 'P76', originalPrice: 'P149', discount: '-49%', sold: '6k sold', rating: '4.9', category: 'fashion', merchant: 'HypeTouch', image: 'https://images.unsplash.com/photo-1591561954557-26941169b49e?q=80&w=1200&auto=format&fit=crop' },
    { title: 'RGB Mechanical Keyboard 87 Keys', price: 'P1,249', originalPrice: 'P1,999', discount: '-37%', sold: '1.8k sold', rating: '4.8', category: 'tech', merchant: 'Keycap Republic', image: 'https://images.unsplash.com/photo-1517336714739-489689fd1ca8?q=80&w=1200&auto=format&fit=crop' },
    { title: 'GaN Fast Charger 65W USB-C', price: 'P799', originalPrice: 'P1,299', discount: '-38%', sold: '12.4k sold', rating: '4.8', category: 'tech', merchant: 'ChargePro Hub', image: 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?q=80&w=1200&auto=format&fit=crop' },
    { title: 'Moissanite Bracelet - Gift Box', price: 'P359', originalPrice: 'P699', discount: '-48%', sold: '290 sold', rating: '4.8', category: 'accessories', merchant: 'CHICHIC Jewelry', image: 'https://images.unsplash.com/photo-1611652022419-a9419f74343d?q=80&w=1200&auto=format&fit=crop' },
    { title: 'Sling Shoulder Bag - Large Capacity', price: 'P79', originalPrice: 'P189', discount: '-58%', sold: '2k sold', rating: '4.8', category: 'lifestyle', merchant: 'Fenshij Store', image: 'https://images.unsplash.com/photo-1524498250077-390f9e378fc0?q=80&w=1200&auto=format&fit=crop' },
    { title: 'Dried Mango Chili Snack', price: 'P120', originalPrice: 'P199', discount: '-40%', sold: '1k sold', rating: '4.8', category: 'lifestyle', merchant: 'Tasty Dried Fruit Food', image: 'https://images.unsplash.com/photo-1559181567-c3190ca9959b?q=80&w=1200&auto=format&fit=crop' }
];

const demoProducts = demoSeedProducts.map((item, index) => ({
    ...item,
    shopeeLink: quickShopeeLinks[index % quickShopeeLinks.length],
    videoUrl: ''
}));

const categoryRules = [
    { category: 'tech', regex: /(charger|keyboard|phone|laptop|gadget|printer|usb|bluetooth|speaker|camera|powerbank|monitor|microphone)/i },
    { category: 'fashion', regex: /(shirt|hoodie|pants|wallet|dress|bag|sando|panty|briefs|underwear|jacket|swim|hat|belt|scarf|shoes|apparel)/i },
    { category: 'accessories', regex: /(bracelet|necklace|earring|ring|jewelry|charms|watch|chain|clip|buckle|eyeglass|sunglass)/i },
    { category: 'lifestyle', regex: /(food|mango|salt|toy|blender|seasoning|home|kitchen|pet|garbage|mirror|aquarium|camp|table|fan|stroller)/i }
];

const showcaseCategories = [
    { name: 'Men Apparel', icon: '👕', filter: 'fashion' },
    { name: 'Mobiles & Gadgets', icon: '📱', filter: 'tech' },
    { name: 'Mobile Accessories', icon: '🔌', filter: 'tech' },
    { name: 'Home Entertainment', icon: '📺', filter: 'tech' },
    { name: 'Babies & Kids', icon: '🍼', filter: 'lifestyle' },
    { name: 'Home & Living', icon: '🏠', filter: 'lifestyle' },
    { name: 'Groceries', icon: '🧺', filter: 'lifestyle' },
    { name: 'Toys, Games', icon: '🧸', filter: 'lifestyle' },
    { name: 'Women Bags', icon: '👜', filter: 'fashion' },
    { name: 'Women Accessories', icon: '🕶️', filter: 'accessories' },
    { name: 'Women Apparel', icon: '👗', filter: 'fashion' },
    { name: 'Health & Care', icon: '🧴', filter: 'lifestyle' },
    { name: 'Makeup', icon: '💄', filter: 'accessories' },
    { name: 'Appliances', icon: '🧃', filter: 'tech' },
    { name: 'Laptops', icon: '💻', filter: 'tech' },
    { name: 'Cameras', icon: '📷', filter: 'tech' },
    { name: 'Sports & Travel', icon: '🥊', filter: 'lifestyle' },
    { name: 'Men Accessories', icon: '⌚', filter: 'fashion' },
    { name: 'Men Shoes', icon: '👟', filter: 'fashion' },
    { name: 'Motors', icon: '🏍️', filter: 'tech' }
];

function isFirebaseConfigured() {
    return Object.values(firebaseConfig).every((value) => typeof value === 'string' && !value.startsWith('YOUR_'));
}

function inferCategory(item) {
    const source = `${item.title || ''} ${item.merchant || ''}`;
    const matched = categoryRules.find((rule) => rule.regex.test(source));
    return matched ? matched.category : 'lifestyle';
}

function toPeso(value) {
    if (value === undefined || value === null || value === '') return 'P0';
    const text = String(value).trim();
    if (/^P/i.test(text)) return text;
    if (/^₱/.test(text)) return text.replace('₱', 'P');
    return `P${text}`;
}

function asHttpUrl(value) {
    if (!value) return '';
    const text = String(value).trim();
    return /^https?:\/\//i.test(text) ? text : '';
}

function createGuaranteedImageUrl(title, category, index) {
    const seed = encodeURIComponent(`${category}-${title}-${index}`);
    return `https://picsum.photos/seed/${seed}/420/420`;
}

function createPlaceholderImage(title, category) {
    const safeTitle = String(title || 'Budolsfind').slice(0, 28);
    const paletteByCategory = {
        tech: ['#1f3a8a', '#2563eb'],
        fashion: ['#9a3412', '#ea580c'],
        accessories: ['#7c2d12', '#f59e0b'],
        lifestyle: ['#14532d', '#22c55e']
    };

    const [start, end] = paletteByCategory[category] || ['#374151', '#9ca3af'];
    const svg = `
        <svg xmlns="http://www.w3.org/2000/svg" width="420" height="420" viewBox="0 0 420 420">
            <defs>
                <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stop-color="${start}" />
                    <stop offset="100%" stop-color="${end}" />
                </linearGradient>
            </defs>
            <rect width="420" height="420" fill="url(#bg)" />
            <text x="24" y="210" fill="#ffffff" font-family="Segoe UI, Arial, sans-serif" font-size="20" font-weight="700">${safeTitle}</text>
            <text x="24" y="244" fill="#ffffff" font-family="Segoe UI, Arial, sans-serif" font-size="16" opacity="0.9">Budolsfind</text>
        </svg>
    `;

    return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function parseCompactNumber(value) {
    if (value === undefined || value === null) return 0;
    const raw = String(value).replace(/,/g, '').replace(/\+/g, '').trim().toUpperCase();
    const matched = raw.match(/([\d.]+)\s*([KMB]?)/);
    if (!matched) return 0;

    const base = Number(matched[1]);
    if (Number.isNaN(base)) return 0;

    const unit = matched[2];
    if (unit === 'K') return base * 1000;
    if (unit === 'M') return base * 1000000;
    if (unit === 'B') return base * 1000000000;
    return base;
}

function normalizeProduct(item, index) {
    const title = item.title || item.name || item.itemName || item['Item Name'] || `Shopee Item #${index + 1}`;
    const merchant = item.merchant || item.shopName || item.storeName || item['Shop Name'] || item.offerName || item['Offer Name'] || 'Top Seller';
    const primaryLink = asHttpUrl(item.shopeeLink || item.link || item.offerLink || item.productLink || item['Trackable Link_short'] || item['Product Link'] || item['Offer Link']) || quickShopeeLinks[index % quickShopeeLinks.length] || 'https://shopee.ph';

    const category = item.category || inferCategory({ title, merchant });
    const remoteImage = asHttpUrl(item.image || item.imageUrl || item.thumbnail || item['Image URL'] || item['Image']);
    const fallbackImage = createPlaceholderImage(title, category);

    return {
        title,
        merchant,
        category,
        price: toPeso(item.price || item.Price),
        originalPrice: item.originalPrice || item.priceBefore || '',
        discount: item.discount || item.commissionRate || item['Commission Rate'] || 'HOT DEAL',
        sold: item.sold || item.sales || item['Sales'] || '1k sold',
        rating: item.rating || '4.8',
        image: remoteImage || createGuaranteedImageUrl(title, category, index),
        hasRealImage: Boolean(remoteImage),
        fallbackImage,
        shopeeLink: primaryLink
    };
}

function parseCsv(text) {
    const rows = [];
    let row = [];
    let field = '';
    let inQuotes = false;

    for (let i = 0; i < text.length; i += 1) {
        const char = text[i];
        const next = text[i + 1];

        if (char === '"') {
            if (inQuotes && next === '"') {
                field += '"';
                i += 1;
            } else {
                inQuotes = !inQuotes;
            }
            continue;
        }

        if (!inQuotes && char === ',') {
            row.push(field.trim());
            field = '';
            continue;
        }

        if (!inQuotes && (char === '\n' || char === '\r')) {
            if (char === '\r' && next === '\n') {
                i += 1;
            }

            if (field.length || row.length) {
                row.push(field.trim());
                rows.push(row);
                row = [];
                field = '';
            }
            continue;
        }

        field += char;
    }

    if (field.length || row.length) {
        row.push(field.trim());
        rows.push(row);
    }

    return rows;
}

async function loadCsvProducts() {
    const csvPaths = [
        './data/products.csv',
        './data/products-2.csv',
        './data/products-3.csv',
        './data/products-4.csv',
        './data/products-5.csv',
        './data/products-6.csv',
        './data/products-7.csv',
        './data/products-8.csv'
    ];

    const all = await Promise.all(csvPaths.map(async (path) => {
        try {
            const response = await fetch(path, { cache: 'no-cache' });
            if (!response.ok) return [];

            const csvText = await response.text();
            const parsed = parseCsv(csvText);
            if (parsed.length < 2) return [];

            const headers = parsed[0];
            const body = parsed.slice(1);

            return body
                .filter((line) => line.some((value) => value !== ''))
                .map((line) => {
                    const entry = {};
                    headers.forEach((header, index) => {
                        entry[header] = line[index] || '';
                    });
                    return entry;
                });
        } catch {
            return [];
        }
    }));

    return all.flat();
}

function syncFilterButtons(filter) {
    categoryButtons.forEach((button) => {
        button.classList.toggle('active', (button.dataset.filter || 'all') === filter);
    });
}

function renderCategoryShowcase(products) {
    if (!categoryShowcase) return;

    categoryShowcase.innerHTML = '';
    const fragment = document.createDocumentFragment();

    showcaseCategories.forEach((entry) => {
        const count = products.filter((item) => item.category === entry.filter).length;
        const tile = document.createElement('button');
        tile.type = 'button';
        tile.className = 'cat-tile';
        tile.title = `${count} products`;
        tile.innerHTML = `
            <span class="cat-icon">${entry.icon}</span>
            <span class="cat-name">${entry.name}</span>
        `;

        tile.addEventListener('click', () => {
            state.category = entry.filter;
            syncFilterButtons(entry.filter);
            applyFilters();
            productGrid.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });

        fragment.appendChild(tile);
    });

    categoryShowcase.appendChild(fragment);
}

function renderDealCards(container, items) {
    if (!container) return;

    container.innerHTML = '';
    const fragment = document.createDocumentFragment();

    items.forEach((item) => {
        const card = document.createElement('article');
        card.className = 'deal-card';
        card.innerHTML = `
            <img class="deal-image" src="${item.image}" alt="${item.title}" loading="lazy" decoding="async" referrerpolicy="no-referrer">
            <div class="deal-content">
                <p class="deal-price">${item.price}</p>
                <div class="deal-sold">${item.sold || 'SELLING FAST'}</div>
                <p class="merchant-name">${item.merchant}</p>
                <a class="deal-link" href="${item.shopeeLink}" target="_blank" rel="noopener noreferrer">Buy Now</a>
            </div>
        `;

        const img = card.querySelector('.deal-image');
        img.addEventListener('error', () => {
            img.src = item.fallbackImage;
        }, { once: true });

        fragment.appendChild(card);
    });

    container.appendChild(fragment);
}

function renderMallCards(products) {
    if (!mallGrid) return;

    const seen = new Set();
    const mallItems = products.filter((item) => {
        const key = `${item.merchant}-${item.shopeeLink}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    }).slice(0, 10);

    mallGrid.innerHTML = '';
    const fragment = document.createDocumentFragment();

    mallItems.forEach((item) => {
        const card = document.createElement('article');
        card.className = 'mall-card';
        card.innerHTML = `
            <img class="mall-img" src="${item.image}" alt="${item.merchant}" loading="lazy" decoding="async" referrerpolicy="no-referrer">
            <a class="mall-link" href="${item.shopeeLink}" target="_blank" rel="noopener noreferrer">Shop Now</a>
        `;

        const img = card.querySelector('.mall-img');
        img.addEventListener('error', () => {
            img.src = item.fallbackImage;
        }, { once: true });

        fragment.appendChild(card);
    });

    mallGrid.appendChild(fragment);
}

function renderTopItemsStrip(products) {
    if (!topItemsStrip) return;

    const bySales = [...products].sort((a, b) => parseCompactNumber(b.sold) - parseCompactNumber(a.sold)).slice(0, 8);
    topItemsStrip.innerHTML = '';
    const fragment = document.createDocumentFragment();

    bySales.forEach((item) => {
        const chip = document.createElement('a');
        chip.className = 'top-item-chip';
        chip.href = item.shopeeLink;
        chip.target = '_blank';
        chip.rel = 'noopener noreferrer';
        chip.innerHTML = `
            <span class="top-item-name">${item.title}</span>
            <span class="top-item-meta">
                <span>${item.price}</span>
                <span>${item.sold || 'fast'}</span>
            </span>
        `;
        fragment.appendChild(chip);
    });

    topItemsStrip.appendChild(fragment);
}

function renderHomepageSections(products) {
    renderCategoryShowcase(products);
    renderTopItemsStrip(products);

    const bySales = [...products].sort((a, b) => parseCompactNumber(b.sold) - parseCompactNumber(a.sold));
    renderDealCards(flashSaleGrid, bySales.slice(0, 6));
    renderDealCards(topProductsGrid, bySales.slice(6, 12));
    renderMallCards(products);
}

function updatePagination(totalItems) {
    const totalPages = Math.max(1, Math.ceil(totalItems / state.pageSize));
    state.currentPage = Math.max(1, Math.min(state.currentPage, totalPages));

    if (prevPageBtn) prevPageBtn.disabled = state.currentPage <= 1;
    if (nextPageBtn) nextPageBtn.disabled = state.currentPage >= totalPages;
    if (pageInfo) pageInfo.textContent = `Page ${state.currentPage} of ${totalPages}`;
    if (paginationControls) paginationControls.style.display = totalItems ? 'flex' : 'none';
}

function getCurrentPageItems(items) {
    const start = (state.currentPage - 1) * state.pageSize;
    return items.slice(start, start + state.pageSize);
}

function renderProducts(items) {
    productGrid.innerHTML = '';

    if (!items.length) {
        if (paginationControls) paginationControls.style.display = 'none';
        const empty = document.createElement('p');
        empty.className = 'empty-state';
        empty.textContent = 'Walang result sa filter mo. Try ibang keyword o category.';
        productGrid.appendChild(empty);
        return;
    }

    updatePagination(items.length);
    const pageItems = getCurrentPageItems(items);

    const fragment = document.createDocumentFragment();
    pageItems.forEach((item) => {
        const card = document.createElement('div');
        card.className = 'card item-card';
        card.innerHTML = `
            <div class="badges">
                <span class="badge badge-discount">${item.discount || 'HOT DEAL'}</span>
                <span class="badge badge-shipping">FREE SHIPPING</span>
            </div>
            <div class="image-container">
                <img src="${item.image}" alt="${item.title}" loading="lazy" decoding="async" referrerpolicy="no-referrer">
            </div>
            <div class="card-content">
                <p class="merchant">${item.merchant}</p>
                <h3 class="card-title">${item.title}</h3>
                <div class="price-section">
                    <span class="current-price">${item.price}</span>
                    ${item.originalPrice ? `<span class="original-price">${item.originalPrice}</span>` : ''}
                </div>
                <div class="meta-row">
                    <span>${item.rating || '4.8'} ⭐</span>
                    <span>${item.sold || '1k sold'}</span>
                </div>
                <a href="${item.shopeeLink}" target="_blank" rel="noopener noreferrer" class="btn-shopee">Buy on Shopee</a>
            </div>
        `;

        const img = card.querySelector('img');
        img.addEventListener('error', () => {
            img.src = item.fallbackImage;
        }, { once: true });

        fragment.appendChild(card);
    });

    productGrid.appendChild(fragment);
}

function applyFilters() {
    const search = state.searchTerm.trim().toLowerCase();
    const filtered = state.products.filter((item) => {
        const categoryMatch = state.category === 'all' || item.category === state.category;
        const titleMatch = (item.title || '').toLowerCase().includes(search);
        return categoryMatch && titleMatch;
    });

    filtered.sort((a, b) => Number(b.hasRealImage) - Number(a.hasRealImage));
    state.filteredProducts = filtered;
    state.currentPage = 1;
    renderProducts(filtered);
}

function setupFilters() {
    searchInput.addEventListener('input', (event) => {
        state.searchTerm = event.target.value;
        applyFilters();
    });

    categoryButtons.forEach((button) => {
        button.addEventListener('click', () => {
            const selected = button.dataset.filter || 'all';
            state.category = selected;
            syncFilterButtons(selected);
            applyFilters();
        });
    });
}

function setupPagination() {
    if (prevPageBtn) {
        prevPageBtn.addEventListener('click', () => {
            if (state.currentPage > 1) {
                state.currentPage -= 1;
                renderProducts(state.filteredProducts);
            }
        });
    }

    if (nextPageBtn) {
        nextPageBtn.addEventListener('click', () => {
            const totalPages = Math.max(1, Math.ceil(state.filteredProducts.length / state.pageSize));
            if (state.currentPage < totalPages) {
                state.currentPage += 1;
                renderProducts(state.filteredProducts);
            }
        });
    }
}

function getNextMegaSaleDate() {
    const now = new Date();
    const next = new Date(now.getFullYear(), now.getMonth(), 15, 0, 0, 0);
    if (now > next) next.setMonth(next.getMonth() + 1);
    return next;
}

function startDateTimeClock() {
    const update = () => {
        const now = new Date();
        if (currentDateTime) {
            currentDateTime.textContent = now.toLocaleString('en-PH', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            });
        }
    };

    update();
    setInterval(update, 1000);
}

function startSaleCountdown() {
    const update = () => {
        const now = new Date();
        const target = getNextMegaSaleDate();
        const diff = Math.max(0, target.getTime() - now.getTime());

        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
        const minutes = Math.floor((diff / (1000 * 60)) % 60);
        const seconds = Math.floor((diff / 1000) % 60);

        if (countdownTimer) {
            countdownTimer.textContent = `${days}d ${hours}h ${minutes}m ${seconds}s`;
        }

        if (flashCountdown) {
            const compactHours = Math.floor(diff / (1000 * 60 * 60));
            flashCountdown.textContent = `${compactHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }
    };

    update();
    setInterval(update, 1000);
}

function startNewsTicker() {
    const newsItems = [
        'Flash deals refreshed from your latest affiliate CSV links.',
        'Category showcase is now optimized for mobile no-zoom viewing.',
        'Top products are ranked by sales to increase click-through.',
        'Mall picks show shop-now cards with your affiliate links.',
        'Countdown and real-time date widgets boost buyer engagement.'
    ];

    let index = 0;
    const update = () => {
        if (newsTicker) {
            newsTicker.textContent = newsItems[index % newsItems.length];
            index += 1;
        }
    };

    update();
    setInterval(update, 4000);
}

function startRealtimeFeed() {
    const fallbackProducts = [...csvProductsCache, ...demoProducts];

    if (!isFirebaseConfigured()) {
        state.products = fallbackProducts.map((item, index) => normalizeProduct(item, index));
        renderHomepageSections(state.products);
        applyFilters();
        return;
    }

    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);
    const q = query(collection(db, 'links'), orderBy('timestamp', 'desc'));

    onSnapshot(q, (snapshot) => {
        const rows = snapshot.docs.map((doc) => doc.data());
        state.products = [...rows, ...csvProductsCache].map((item, index) => normalizeProduct(item, index));
        renderHomepageSections(state.products);
        applyFilters();
    }, () => {
        state.products = fallbackProducts.map((item, index) => normalizeProduct(item, index));
        renderHomepageSections(state.products);
        applyFilters();
    });
}

async function bootstrapData() {
    csvProductsCache = await loadCsvProducts();
    startRealtimeFeed();
}

setupFilters();
setupPagination();
startDateTimeClock();
startSaleCountdown();
startNewsTicker();
bootstrapData();

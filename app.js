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
    { title: 'Cotton Boxer Briefs Women Set', price: 'P150', originalPrice: 'P289', discount: '-48%', sold: '10k sold', rating: '4.8', category: 'fashion', merchant: 'All of me Store', image: 'https://images.unsplash.com/photo-1618886614638-80e3c103d31a?q=80&w=1200&auto=format&fit=crop' },
    { title: 'RGB Mechanical Keyboard 87 Keys', price: 'P1,249', originalPrice: 'P1,999', discount: '-37%', sold: '1.8k sold', rating: '4.8', category: 'tech', merchant: 'Keycap Republic', image: 'https://images.unsplash.com/photo-1517336714739-489689fd1ca8?q=80&w=1200&auto=format&fit=crop' },
    { title: 'GaN Fast Charger 65W USB-C', price: 'P799', originalPrice: 'P1,299', discount: '-38%', sold: '12.4k sold', rating: '4.8', category: 'tech', merchant: 'ChargePro Hub', image: 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?q=80&w=1200&auto=format&fit=crop' },
    { title: 'Wireless Tattoo Stencil Printer', price: 'P698', originalPrice: 'P1,099', discount: '-36%', sold: '1k sold', rating: '4.7', category: 'tech', merchant: 'Phomemo Philippines', image: 'https://images.unsplash.com/photo-1516382799247-87df95d790b7?q=80&w=1200&auto=format&fit=crop' },
    { title: 'Laptop Backpack Waterproof 15.6', price: 'P849', originalPrice: 'P1,499', discount: '-43%', sold: '1k sold', rating: '4.8', category: 'tech', merchant: 'Golden Wolf', image: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=1200&auto=format&fit=crop' },
    { title: 'Moissanite Bracelet - Gift Box', price: 'P359', originalPrice: 'P699', discount: '-48%', sold: '290 sold', rating: '4.8', category: 'accessories', merchant: 'CHICHIC Jewelry', image: 'https://images.unsplash.com/photo-1611652022419-a9419f74343d?q=80&w=1200&auto=format&fit=crop' },
    { title: '925 Sterling Ring Couple Set', price: 'P132', originalPrice: 'P260', discount: '-49%', sold: '2k sold', rating: '4.9', category: 'accessories', merchant: 'Cyimi Custom Jewelry', image: 'https://images.unsplash.com/photo-1617038220319-276d3cfab638?q=80&w=1200&auto=format&fit=crop' },
    { title: 'Gold Butterfly Necklace Gift', price: 'P139', originalPrice: 'P289', discount: '-52%', sold: '1k sold', rating: '4.7', category: 'accessories', merchant: 'Babulin Shine', image: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?q=80&w=1200&auto=format&fit=crop' },
    { title: 'Italian Charm Bracelet Link Set', price: 'P23', originalPrice: 'P59', discount: '-61%', sold: '10k sold', rating: '4.9', category: 'accessories', merchant: 'Bracelet-Fzone', image: 'https://images.unsplash.com/photo-1603561596112-0a132b757442?q=80&w=1200&auto=format&fit=crop' },
    { title: 'Sling Shoulder Bag - Large Capacity', price: 'P79', originalPrice: 'P189', discount: '-58%', sold: '2k sold', rating: '4.8', category: 'lifestyle', merchant: 'Fenshij Store', image: 'https://images.unsplash.com/photo-1524498250077-390f9e378fc0?q=80&w=1200&auto=format&fit=crop' },
    { title: 'Dried Mango Chili Snack', price: 'P120', originalPrice: 'P199', discount: '-40%', sold: '1k sold', rating: '4.8', category: 'lifestyle', merchant: 'Tasty Dried Fruit Food', image: 'https://images.unsplash.com/photo-1559181567-c3190ca9959b?q=80&w=1200&auto=format&fit=crop' },
    { title: 'French Celtic Fine Sea Salt', price: 'P51', originalPrice: 'P99', discount: '-48%', sold: '254 sold', rating: '4.7', category: 'lifestyle', merchant: 'MoHon Food', image: 'https://images.unsplash.com/photo-1514995669114-6081e934b693?q=80&w=1200&auto=format&fit=crop' },
    { title: 'Jenga Classic 54 PCS Hardwood', price: 'P237', originalPrice: 'P399', discount: '-41%', sold: '10k sold', rating: '4.9', category: 'lifestyle', merchant: 'YJJ Merchandise', image: 'https://images.unsplash.com/photo-1610890716171-6b1bb98ffd09?q=80&w=1200&auto=format&fit=crop' },
    { title: 'AAA Premium Polo Shirt Unisex', price: 'P289', originalPrice: 'P420', discount: '-31%', sold: '977 sold', rating: '4.7', category: 'fashion', merchant: 'YJJ Merchandise', image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=1200&auto=format&fit=crop' },
    { title: 'Round Neck T-Shirt AAA Jeans', price: 'P97', originalPrice: 'P169', discount: '-43%', sold: '1k sold', rating: '4.7', category: 'fashion', merchant: 'YJJ Merchandise', image: 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?q=80&w=1200&auto=format&fit=crop' },
    { title: 'Phone Lanyard Holder Set', price: 'P22', originalPrice: 'P55', discount: '-60%', sold: '867 sold', rating: '4.6', category: 'tech', merchant: 'Noor Shop', image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?q=80&w=1200&auto=format&fit=crop' },
    { title: 'Extractor Blender 12 PCS Set', price: 'P1,600', originalPrice: 'P2,200', discount: '-27%', sold: '10k sold', rating: '4.8', category: 'lifestyle', merchant: 'YJJ Merchandise', image: 'https://images.unsplash.com/photo-1570222094114-d054a817e56b?q=80&w=1200&auto=format&fit=crop' }
];

const demoProducts = demoSeedProducts.map((item, index) => ({
    ...item,
    shopeeLink: quickShopeeLinks[index % quickShopeeLinks.length],
    videoUrl: ''
}));

const categoryRules = [
    { category: 'tech', regex: /(charger|keyboard|phone|laptop|gadget|printer|usb|bluetooth|speaker)/i },
    { category: 'fashion', regex: /(shirt|hoodie|pants|wallet|dress|bag|sando|panty|briefs|underwear|jacket|swim|hat|belt|scarf|shoes)/i },
    { category: 'accessories', regex: /(bracelet|necklace|earring|ring|jewelry|charms|watch|chain|clip|buckle)/i },
    { category: 'lifestyle', regex: /(food|mango|salt|toy|blender|seasoning|home|kitchen|pet|garbage|mirror|aquarium|camp|table|fan)/i }
];

function isFirebaseConfigured() {
    return Object.values(firebaseConfig).every((value) => typeof value === 'string' && !value.startsWith('YOUR_'));
}

function loadProducts(items) {
    state.products = items.map((item, index) => normalizeProduct(item, index));
    applyFilters();
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
        shopeeLink: primaryLink,
        videoUrl: asHttpUrl(item.videoUrl || item.video || '')
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
        './data/products-4.csv'
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
                    const item = {};
                    headers.forEach((header, index) => {
                        item[header] = line[index] || '';
                    });
                    return item;
                });
        } catch {
            return [];
        }
    }));

    return all.flat();
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

function gotoPage(page) {
    state.currentPage = page;
    renderProducts(state.filteredProducts);
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
    pageItems.forEach((item) => fragment.appendChild(createCard(item)));
    productGrid.appendChild(fragment);
}

function createCard(item) {
    const card = document.createElement('div');
    card.className = 'card item-card';

    const discountText = item.discount || 'HOT DEAL';
    const hasVideo = Boolean(item.videoUrl);

    card.innerHTML = `
        <div class="badges">
            <span class="badge badge-discount">${discountText}</span>
            <span class="badge badge-shipping">FREE SHIPPING</span>
        </div>
        <div class="image-container">
            <img src="${item.image}" alt="${item.title || 'Product'}" loading="lazy" decoding="async" referrerpolicy="no-referrer">
            ${hasVideo ? `<button type="button" class="play-overlay">
                <span class="play-icon">▶</span>
            </button>` : ''}
        </div>
        <div class="card-content">
            <p class="merchant">${item.merchant || 'Top Seller'}</p>
            <h3 class="card-title">${item.title || 'Untitled Product'}</h3>
            <div class="price-section">
                <span class="current-price">${item.price || 'P0'}</span>
                ${item.originalPrice ? `<span class="original-price">${item.originalPrice}</span>` : ''}
            </div>
            <div class="meta-row">
                <span>${item.rating || '4.8'} ⭐</span>
                <span>${item.sold || '1k sold'}</span>
            </div>
            <a href="${item.shopeeLink || '#'}" target="_blank" rel="noopener noreferrer" class="btn-shopee">Buy on Shopee</a>
        </div>
    `;

    const image = card.querySelector('img');
    image.addEventListener('error', () => {
        image.src = item.fallbackImage || createPlaceholderImage(item.title, item.category);
    }, { once: true });

    const previewButton = card.querySelector('.play-overlay');
    if (previewButton) {
        previewButton.addEventListener('click', () => openVideo(item.videoUrl || ''));
    }

    return card;
}

function setupFilters() {
    searchInput.addEventListener('input', (event) => {
        state.searchTerm = event.target.value;
        applyFilters();
    });

    categoryButtons.forEach((button) => {
        button.addEventListener('click', () => {
            const selected = button.dataset.filter || 'all';
            categoryButtons.forEach((b) => {
                b.classList.toggle('active', (b.dataset.filter || 'all') === selected);
            });
            state.category = selected;
            applyFilters();
        });
    });
}

function setupPagination() {
    if (prevPageBtn) {
        prevPageBtn.addEventListener('click', () => {
            if (state.currentPage > 1) {
                gotoPage(state.currentPage - 1);
            }
        });
    }

    if (nextPageBtn) {
        nextPageBtn.addEventListener('click', () => {
            const totalPages = Math.max(1, Math.ceil(state.filteredProducts.length / state.pageSize));
            if (state.currentPage < totalPages) {
                gotoPage(state.currentPage + 1);
            }
        });
    }
}

const modal = document.getElementById('videoModal');
const iframe = document.getElementById('videoFrame');

function normalizeVideoUrl(url) {
    if (!url) return '';
    if (url.includes('embed/')) return `${url}?autoplay=1`;
    if (url.includes('watch?v=')) return `${url.replace('watch?v=', 'embed/')}?autoplay=1`;
    if (url.includes('youtu.be/')) {
        const id = url.split('youtu.be/')[1]?.split('?')[0];
        return id ? `https://www.youtube.com/embed/${id}?autoplay=1` : '';
    }
    return url;
}

function openVideo(url) {
    const normalized = normalizeVideoUrl(url);
    if (!normalized) return;

    modal.style.display = 'flex';
    iframe.src = normalized;
}

function closeVideoModal() {
    modal.style.display = 'none';
    iframe.src = '';
}

document.querySelector('.close-btn').addEventListener('click', closeVideoModal);
modal.addEventListener('click', (event) => {
    if (event.target === modal) closeVideoModal();
});
document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && modal.style.display === 'flex') {
        closeVideoModal();
    }
});

function startRealtimeFeed() {
    const fallbackProducts = [...csvProductsCache, ...demoProducts];

    if (!isFirebaseConfigured()) {
        loadProducts(fallbackProducts);
        return;
    }

    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);
    const q = query(collection(db, 'links'), orderBy('timestamp', 'desc'));

    onSnapshot(q, (snapshot) => {
        const rows = snapshot.docs.map((doc) => doc.data());
        loadProducts([...rows, ...csvProductsCache]);
    }, () => {
        loadProducts(fallbackProducts);
    });
}

async function bootstrapData() {
    csvProductsCache = await loadCsvProducts();
    startRealtimeFeed();
}

setupFilters();
setupPagination();
bootstrapData();
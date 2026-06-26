// ========================================
// filters.js — КОНФИГУРАЦИЯ ВСЕХ ФИЛЬТРОВ
// ========================================

// ========================================
// 1. КАТЕГОРИИ
// ========================================
const CATEGORIES = [
    { id: 'all', name: 'Все категории', icon: '🎯' },
    { id: 'электроника', name: 'Электроника', icon: '📱' },
    { id: 'одежда', name: 'Одежда', icon: '👕' },
    { id: 'обувь', name: 'Обувь', icon: '👟' },
    { id: 'авто', name: 'Авто', icon: '🚗' },
    { id: 'недвижимость', name: 'Недвижимость', icon: '🏠' },
    { id: 'для дома', name: 'Для дома', icon: '🛋️' },
    { id: 'спорт', name: 'Спорт', icon: '⚽' },
    { id: 'игрушки', name: 'Игрушки', icon: '🧸' },
    { id: 'услуги', name: 'Услуги', icon: '🔧' }
];

// ========================================
// 2. ЦЕНОВЫЕ ДИАПАЗОНЫ
// ========================================
const PRICE_RANGES = [
    { id: 'all', label: 'Все цены' },
    { id: 'free', label: '🎁 Бесплатные' },
    { id: '0-1000', label: 'До 1000 ₽' },
    { id: '1000-5000', label: '1000-5000 ₽' },
    { id: '5000-20000', label: '5000-20000 ₽' },
    { id: '20000-50000', label: '20000-50000 ₽' },
    { id: '50000+', label: 'От 50000 ₽' }
];

// ========================================
// 3. РАЙОНЫ
// ========================================
const DISTRICTS = [
    { id: 'all', label: 'Все районы' },
    { id: 'центр', label: '🏛️ Центр' },
    { id: 'север', label: '⬆️ Север' },
    { id: 'юг', label: '⬇️ Юг' },
    { id: 'восток', label: '➡️ Восток' },
    { id: 'запад', label: '⬅️ Запад' }
];

// ========================================
// 4. ВАРИАНТЫ СОРТИРОВКИ
// ========================================
const SORT_OPTIONS = [
    { id: 'newest', label: '🆕 Сначала новые' },
    { id: 'price-asc', label: '💰 По возрастанию' },
    { id: 'price-desc', label: '💰 По убыванию' },
    { id: 'popular', label: '🔥 Популярные' },
    { id: 'rating', label: '⭐ По рейтингу' },
    { id: 'distance', label: '📏 По расстоянию' }
];

// ========================================
// 5. СОСТОЯНИЕ ТОВАРА
// ========================================
const CONDITIONS = [
    { id: 'all', label: 'Любое состояние' },
    { id: 'new', label: '✨ Новое' },
    { id: 'used', label: '🔄 Б/У' },
    { id: 'refurbished', label: '🛠️ Восстановленное' }
];

// ========================================
// 6. ТИП ДОСТАВКИ
// ========================================
const DELIVERY_TYPES = [
    { id: 'all', label: 'Любая доставка' },
    { id: 'delivery', label: '🚚 С доставкой' },
    { id: 'meeting', label: '🤝 Без доставки' }
];

// ========================================
// 7. СТАТУС ОБЪЯВЛЕНИЯ (для админки)
// ========================================
const LISTING_STATUSES = [
    { id: 'all', label: 'Все статусы' },
    { id: 'active', label: '✅ Активные' },
    { id: 'inactive', label: '⛔ Неактивные' },
    { id: 'pending', label: '⏳ На модерации' },
    { id: 'archived', label: '📦 Архив' },
    { id: 'sold', label: '💰 Проданные' }
];

// ========================================
// 8. РОЛИ ПОЛЬЗОВАТЕЛЕЙ (для админки)
// ========================================
const USER_ROLES = [
    { id: 'all', label: 'Все роли' },
    { id: 'admin', label: '👑 Админ' },
    { id: 'moderator', label: '🛡️ Модератор' },
    { id: 'user', label: '👤 Пользователь' },
    { id: 'banned', label: '⛔ Забанен' }
];

// ========================================
// 9. СТАТУСЫ ЗАКАЗОВ (для админки)
// ========================================
const ORDER_STATUSES = [
    { id: 'all', label: 'Все статусы' },
    { id: 'pending', label: '⏳ Ожидает' },
    { id: 'paid', label: '✅ Оплачен' },
    { id: 'shipped', label: '🚚 Отправлен' },
    { id: 'delivered', label: '📦 Доставлен' },
    { id: 'completed', label: '🎉 Завершён' },
    { id: 'cancelled', label: '❌ Отменён' }
];

// ========================================
// 10. ФУНКЦИИ ДЛЯ РЕНДЕРИНГА ФИЛЬТРОВ
// ========================================

// Рендер категорий
function renderCategories(containerId, selected = 'all') {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = CATEGORIES.map(cat => `
        <button class="filter-category-item ${selected === cat.id ? 'active' : ''}" data-cat="${cat.id}">
            <span>${cat.icon}</span>
            <span class="filter-category-name">${cat.name}</span>
        </button>
    `).join('');

    // Добавляем обработчики
    container.querySelectorAll('.filter-category-item').forEach(btn => {
        btn.onclick = () => {
            container.querySelectorAll('.filter-category-item').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            if (window.onCategoryChange) window.onCategoryChange(btn.dataset.cat);
        };
    });
}

// Рендер выпадающих списков
function renderSelect(selectId, options, selected = 'all') {
    const select = document.getElementById(selectId);
    if (!select) return;

    select.innerHTML = options.map(opt => `
        <option value="${opt.id}" ${selected === opt.id ? 'selected' : ''}>${opt.label}</option>
    `).join('');
}

// Получение выбранного значения
function getSelectValue(selectId) {
    const select = document.getElementById(selectId);
    return select ? select.value : 'all';
}

// ========================================
// 11. ФИЛЬТРАЦИЯ ТОВАРОВ
// ========================================
function applyFilters(listings) {
    const category = getSelectValue('categoryFilter');
    const priceRange = getSelectValue('priceFilter');
    const district = getSelectValue('districtFilter');
    const condition = getSelectValue('conditionFilter');
    const delivery = getSelectValue('deliveryFilter');
    const search = document.getElementById('searchInput')?.value.trim().toLowerCase() || '';
    const sort = getSelectValue('sortFilter');

    let results = [...listings];

    // Поиск
    if (search) {
        results = results.filter(l =>
            l.title.toLowerCase().includes(search) ||
            (l.description && l.description.toLowerCase().includes(search))
        );
    }

    // Категория
    if (category !== 'all') {
        results = results.filter(l => l.category === category);
    }

    // Цена
    if (priceRange !== 'all') {
        if (priceRange === 'free') {
            results = results.filter(l => l.price === 0 || l.price === null);
        } else {
            const [min, max] = priceRange.split('-').map(Number);
            if (max) {
                results = results.filter(l => l.price >= min && l.price <= max);
            } else {
                results = results.filter(l => l.price >= min);
            }
        }
    }

    // Район
    if (district !== 'all') {
        results = results.filter(l => l.district === district);
    }

    // Состояние
    if (condition !== 'all') {
        results = results.filter(l => l.condition === condition);
    }

    // Доставка
    if (delivery !== 'all') {
        results = results.filter(l => l.deliveryType === delivery || l.deliveryType === 'both');
    }

    // Сортировка
    switch (sort) {
        case 'newest':
            results.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            break;
        case 'price-asc':
            results.sort((a, b) => (a.price || 0) - (b.price || 0));
            break;
        case 'price-desc':
            results.sort((a, b) => (b.price || 0) - (a.price || 0));
            break;
        case 'popular':
            results.sort((a, b) => (b.views || 0) - (a.views || 0));
            break;
        case 'rating':
            results.sort((a, b) => (b.sellerRating || 0) - (a.sellerRating || 0));
            break;
        case 'distance':
            // Сортировка по расстоянию (если есть координаты)
            results.sort((a, b) => (a.distance || 0) - (b.distance || 0));
            break;
        default:
            results.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    return results;
}

// ========================================
// 12. СБРОС ВСЕХ ФИЛЬТРОВ
// ========================================
function resetAllFilters() {
    const selects = ['categoryFilter', 'priceFilter', 'districtFilter', 'conditionFilter', 'deliveryFilter', 'sortFilter'];
    selects.forEach(id => {
        const select = document.getElementById(id);
        if (select) select.value = 'all';
    });

    const search = document.getElementById('searchInput');
    if (search) search.value = '';

    // Сброс категорий
    const categoriesContainer = document.getElementById('categoriesContainer');
    if (categoriesContainer) {
        categoriesContainer.querySelectorAll('.filter-category-item').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.cat === 'all');
        });
    }

    if (window.onFiltersReset) window.onFiltersReset();
}

// ========================================
// 13. ЭКСПОРТ (если используется модули)
// ========================================
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        CATEGORIES,
        PRICE_RANGES,
        DISTRICTS,
        SORT_OPTIONS,
        CONDITIONS,
        DELIVERY_TYPES,
        LISTING_STATUSES,
        USER_ROLES,
        ORDER_STATUSES,
        renderCategories,
        renderSelect,
        getSelectValue,
        applyFilters,
        resetAllFilters
    };
}
const HIDDEN_ITEMS_KEY = 'hiddenItems';
const SHOWING_HIDDEN_KEY = 'showingHidden';

const hideAllUsersTextRu = 'Скрыть все объявления пользователя';
const hideAllUsersTextEt = 'Peida kõik kasutaja kuulutused';
const hideTextRu = 'Скрыть';
const hideTextEt = 'Peida';
const unhideTextRu = 'Убрать из скрытых';
const unhideTextEt = 'Eemalda peidust';
const hidingInProcessTextRu = 'Объявления скрываются';
const hidingInProcessTextEt = 'Kulutused eemaldatakse';

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function getLocale() {
    try {
        const parsedUrl = new URL(window.location.href);
        const pathSegments = parsedUrl.pathname.split('/').filter(Boolean);
        if (pathSegments.length > 0 && pathSegments[0] === 'ru') {
            return 'ru';
        }
        return 'ee';
    } catch (e) {
        return 'ee';
    }
}

async function getStorageData(key) {
    const result = await chrome.storage.local.get([key]);
    return result[key];
}

async function getHiddenItems() {
    const result = await chrome.storage.local.get([HIDDEN_ITEMS_KEY]);
    return result[HIDDEN_ITEMS_KEY] || [];
}


function saveHiddenItems(items) {
    return new Promise((resolve) => {
        chrome.storage.local.set({[HIDDEN_ITEMS_KEY]: items}, resolve);
    });
}

function updateTitle(isRemoved) {
    document.querySelectorAll('.item-title').forEach(itemTitle => {
        if (isRemoved) {
            itemTitle.style.color = '#999'
        } else {
            itemTitle.style.color = ''
        }
    });
}

async function hidePageItems(pageUrl) {
    try {
        const response = await fetch(pageUrl);
        const htmlText = await response.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlText, 'text/html');

        const items = doc.querySelectorAll('li.classifieds__item');

        if (!items.length) {
            alert('No items found.');
            return;
        }

        const hiddenItems = await getHiddenItems();
        const updatedItems = [...hiddenItems];

        items.forEach(item => {
            const favBtn = item.querySelector('button.fav-button[data-iid]');
            if (favBtn) {
                const id = favBtn.getAttribute('data-iid');
                if (id && !updatedItems.includes(id)) {
                    updatedItems.push(id);
                }
            }
        });

        await saveHiddenItems(updatedItems);
    } catch (err) {
        alert('Failed to load or parse items: ' + err);
    }
}

const locale = getLocale();
let showingHidden = false;

(async function getShowingHidden() {
    showingHidden = await getStorageData(SHOWING_HIDDEN_KEY) || false;
})();

(async function addHideToggleButton() {
    const match = window.location.pathname.match(/\/item\/[^/]+\/(\d+)\//);
    if (!match) return;

    const itemId = match[1];
    const buttonsContainer = document.querySelector('.item-title__buttons');
    if (!buttonsContainer) return;

    const hiddenItems = await getHiddenItems();
    let isHidden = hiddenItems.includes(itemId);
    updateTitle(isHidden);

    const toggleBtn = document.createElement('button');
    toggleBtn.className = 'ok-round-button ok-round-button--tools';
    toggleBtn.title = isHidden
        ? (locale === 'ru' ? unhideTextRu : unhideTextEt)
        : (locale === 'ru' ? hideTextRu : hideTextEt);
    toggleBtn.textContent = isHidden ? '✚' : '🗙';

    toggleBtn.addEventListener('click', async () => {
        const hiddenItemsSet = new Set(await getHiddenItems());

        if (hiddenItemsSet.has(itemId)) {
            hiddenItemsSet.delete(itemId);
            toggleBtn.textContent = '🗙';
            toggleBtn.title = locale === 'ru' ? hideTextRu : hideTextEt;
            updateTitle(false);
            await saveHiddenItems([...hiddenItemsSet]);
        } else {
            hiddenItemsSet.add(itemId);
            toggleBtn.textContent = '✚';
            toggleBtn.title = locale === 'ru' ? unhideTextRu : unhideTextEt;
            updateTitle(true);
            await saveHiddenItems([...hiddenItemsSet]);
            if (!showingHidden) {
                history.back();
            }
        }

    });

    buttonsContainer.appendChild(toggleBtn);
})();

(function addHideUsersAllItemsButton() {
    const footer = document.querySelector('.user-block__popup-footer');
    const userLink = footer.querySelector('a[href*="/buy/all/"]');
    let baseUrl = userLink.getAttribute('href');
    if (!footer || !userLink || !baseUrl) {
        return;
    }

    let fullUrl = new URL(baseUrl, window.location.origin);
    fullUrl.searchParams.set('pp', '200');

    const userItemsMatch = userLink.textContent.trim().match(/([\d\s]+)/);
    let urls = [];
    if (userItemsMatch) {
        const totalItems = Number(userItemsMatch[1].replace(/\s+/g, ''));
        const pagesAmount = Math.ceil(totalItems / 200);
        for (let i = 1; i <= pagesAmount; i++) {
            fullUrl.searchParams.set('p', i.toString());
            let pageUrl = fullUrl.pathname + '?' + fullUrl.searchParams.toString();
            urls.push(pageUrl);
        }
    } else {
        console.log('Could not determine item count.');
        return;
    }

    const btn = document.createElement('a');
    btn.href = '#';
    btn.textContent = locale === 'ru' ? hideAllUsersTextRu : hideAllUsersTextEt;
    btn.style.display = 'inline-block';
    btn.style.marginTop = '8px';
    btn.style.cursor = 'pointer';

    footer.appendChild(btn);

    btn.addEventListener('click', async function (e) {
        e.preventDefault();
        btn.textContent = locale === 'ru' ? `${hidingInProcessTextRu}...0%` : `${hidingInProcessTextEt}...0%`;
        for (const url of urls) {
            try {
                const percentage = Math.floor((urls.indexOf(url) + 1) / urls.length * 100);
                btn.textContent = locale === 'ru'
                    ? `${hidingInProcessTextRu}...${percentage}%`
                    : `${hidingInProcessTextEt}...${percentage}%`;
                await hidePageItems(url);
                await sleep(500);
            } catch (error) {
                btn.textContent = 'Error processing url';
                await sleep(1000);
            }

        }
        btn.textContent = locale === 'ru' ? hideAllUsersTextRu : hideAllUsersTextEt;
        updateTitle(true);
        if (!showingHidden) {
            history.back();
        }
    });
})()
const locale = getLocale();

const hideAllUsersTextEt = 'Peida kõik kasutaja kuulutused';
const hideAllUsersTextRu = 'Скрыть все объявления пользователя';
const hideTextRu = 'Скрыть';
const hideTextEt = 'Peida';
const unhideTextRu = 'Убрать из скрытых';
const unhideTextEt = 'Eemalda peidust';

const HIDDEN_ITEMS_KEY = 'hiddenItems';
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
function updateTitle(isRemoved) {
    document.querySelectorAll('.item-title').forEach(itemTitle => {
        if (isRemoved) {
            itemTitle.style.color = '#999'
        } else {
            itemTitle.style.color = ''
        }
    });
}

(function addHideToggleButton() {
    const match = window.location.pathname.match(/\/item\/[^/]+\/(\d+)\//);
    if (!match) return;

    const itemId = match[1];
    const buttonsContainer = document.querySelector('.item-title__buttons');
    if (!buttonsContainer) return;

    const hiddenItems = JSON.parse(localStorage.getItem(HIDDEN_ITEMS_KEY) || '[]');
    let isHidden = hiddenItems.includes(itemId);
    updateTitle(isHidden);

    // Create button
    const toggleBtn = document.createElement('button');
    toggleBtn.className = 'ok-round-button ok-round-button--tools';
    toggleBtn.title = isHidden
        ? (locale === 'ru' ? unhideTextRu : unhideTextEt)
        : (locale === 'ru' ? hideTextRu : hideTextEt);
    toggleBtn.textContent = isHidden ? '✚' : '🗙';

    toggleBtn.addEventListener('click', () => {
        const updated = new Set(JSON.parse(localStorage.getItem(HIDDEN_ITEMS_KEY) || '[]'));

        if (updated.has(itemId)) {
            updated.delete(itemId);
            toggleBtn.textContent = '🗙';
            toggleBtn.title = locale === 'ru' ? hideTextRu : hideTextEt;
            updateTitle(false);
        } else {
            updated.add(itemId);
            toggleBtn.textContent = '✚';
            toggleBtn.title = locale === 'ru' ? unhideTextRu : unhideTextEt;
            updateTitle(true);
        }

        localStorage.setItem(HIDDEN_ITEMS_KEY, JSON.stringify([...updated]));
    });

    buttonsContainer.appendChild(toggleBtn);
})();


function hide200Items(url200) {
    fetch(url200)
        .then(resp => resp.text())
        .then(htmlText => {
            const parser = new DOMParser();
            const doc = parser.parseFromString(htmlText, 'text/html');

            const items = doc.querySelectorAll('li.classifieds__item');

            if (!items.length) {
                alert('No items found.');
                return;
            }

            let hiddenItems = [];
            try {
                hiddenItems = JSON.parse(localStorage.getItem(HIDDEN_ITEMS_KEY)) || [];
            } catch {
                hiddenItems = [];
            }

            items.forEach(item => {
                const favBtn = item.querySelector('button.fav-button[data-iid]');
                if (favBtn) {
                    const id = favBtn.getAttribute('data-iid');
                    if (id && !hiddenItems.includes(id)) {
                        hiddenItems.push(id);
                    }
                }
            });

            localStorage.setItem(HIDDEN_ITEMS_KEY, JSON.stringify(hiddenItems));
        })
        .catch(err => {
            alert('Failed to load or parse items: ' + err);
        });
}

function addHideUsersAllItemsButton() {
    const footer = document.querySelector('.user-block__popup-footer');
    if (!footer) return;

    const userLink = footer.querySelector('a[href*="/buy/all/"]');
    if (!userLink) return;

    let baseUrl = userLink.getAttribute('href');
    if (!baseUrl) {
        return;
    }
    let fullUrl = new URL(baseUrl, window.location.origin);
    fullUrl.searchParams.set('pp', '200');

    const userItemsMatch = userLink.textContent.trim().match(/([\d\s]+)/);
    let urls = [];
    if (userItemsMatch) {
        const totalItems = Number(userItemsMatch[1].replace(/\s+/g, ''));
        const pages = Math.ceil(totalItems / 200);
        for (let i = 1; i <= pages; i++) {
            fullUrl.searchParams.set('p', i);
            let pageUrl = fullUrl.pathname + '?' + fullUrl.searchParams.toString();
            urls.push(pageUrl);
        }
    } else {
        console.log('Could not determine item count.');
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
        for (const url of urls) {
            hide200Items(url);
            await sleep(1000);
        }
    });
}
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

addHideUsersAllItemsButton();


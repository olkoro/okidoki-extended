const SHOWING_HIDDEN_KEY = 'showingHidden';
const HIDDEN_ITEMS_KEY = 'hiddenItems';
const locale = getLocale();
const allItemIds = getAllItemIds();
let hidingHistory = []
let showingHidden = false;
const hideItemSvg = `
          <svg class="fav-button__icon" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <line x1="18" y1="6" x2="6" y2="18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            <line x1="6" y1="6" x2="18" y2="18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
        `;

const showItemSvg = `
          <svg class="fav-button__icon" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <line x1="12" y1="5" x2="12" y2="19" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            <line x1="5" y1="12" x2="19" y2="12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
        `;

const hideAgainTextRu = '[Скрыть]';
const hideAgainTextEt = '[Peida]';
const showTextRu = '[Показать скрытые]';
const showTextEt = '[Näita peidetud]';
const cancelTextRu = '[Отменить]';
const cancelTextEt = '[Tühistama]';
const hiddenTextRu = `скрыто`;
const hiddenTextEt = `peidetud`;
const hideTextBtnRu = 'Скрыть';
const hideTextBtnEt = 'Peida';
const unhideTextRu = 'Убрать из скрытых';
const unhideTextEt = 'Eemalda peidust';

async function getStorageData(key) {
    try {
        const result = await chrome.storage.local.get([key]);
        return result[key];
    } catch (error) {
        console.error(`Error getting ${key} from storage:`, error);
        return null;
    }
}

async function setStorageData(key, value) {
    try {
        await chrome.storage.local.set({[key]: value});
    } catch (error) {
        console.error(`Error setting ${key} in storage:`, error);
    }
}

async function initialize() {
    showingHidden = await getStorageData(SHOWING_HIDDEN_KEY) || false;
    await processItems();
    await addHiddenCount();
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

async function addToHiddenItemStorage(itemId) {
    const hiddenItems = await getStorageData(HIDDEN_ITEMS_KEY) || [];
    if (!hiddenItems.includes(itemId)) {
        hiddenItems.push(itemId);
        await setStorageData(HIDDEN_ITEMS_KEY, hiddenItems);
    }
}

async function removeFromHiddenItemsStorage(itemId) {
    const hiddenItems = await getStorageData(HIDDEN_ITEMS_KEY) || [];
    const filtered = hiddenItems.filter(id => id !== itemId);
    await setStorageData(HIDDEN_ITEMS_KEY, filtered);
}

async function isInHiddenItemsStorage(itemId) {
    const hiddenItems = await getStorageData(HIDDEN_ITEMS_KEY) || [];
    return hiddenItems.includes(itemId);
}

async function getAllHiddenItemsStorage() {
    return await getStorageData(HIDDEN_ITEMS_KEY) || [];
}

async function hideItem(content, card, itemId, favDiv) {
    await addToHiddenItemStorage(itemId);
    await applyHiddenStyle(content, card, itemId, favDiv);
    hidingHistory.push(itemId);
    await addHiddenCount();
}

async function showItem(content, card, itemId, favDiv) {
    await removeFromHiddenItemsStorage(itemId);
    await applyShownStyle(content, card, itemId, favDiv);
    hidingHistory = hidingHistory.filter(id => id !== itemId);
    await addHiddenCount();
}

async function addHideToggle(content, card, itemId, favDiv) {
    const oldToggle = document.getElementById(`hide-item-button-${itemId}`);
    if (oldToggle) oldToggle.remove();

    const isHidden = await isInHiddenItemsStorage(itemId);
    const hideBtn = document.createElement('button');
    hideBtn.id = `hide-item-button-${itemId}`;
    hideBtn.textContent = isHidden
        ? (locale === 'ru' ? hideTextBtnRu : hideTextBtnEt)
        : (locale === 'ru' ? unhideTextRu : unhideTextEt);
    hideBtn.type = 'button';
    hideBtn.classList.add("fav-button");
    hideBtn.dataset.iid = itemId;

    hideBtn.innerHTML = isHidden ? showItemSvg : hideItemSvg;

    hideBtn.addEventListener('click', async () => {
        if (isHidden) {
            await showItem(content, card, itemId, favDiv);
        } else {
            await hideItem(content, card, itemId, favDiv);
        }
    });

    favDiv.appendChild(hideBtn);
}

async function applyHiddenStyle(content, card, itemId, favDiv) {
    if (showingHidden) {
        card.style.display = '';
        content.style.color = '#999';
    } else {
        card.style.display = 'none';
        window.dispatchEvent(new Event('scroll'));
    }
    await addHideToggle(content, card, itemId, favDiv);
}

async function applyShownStyle(content, card, itemId, favDiv) {
    card.style.display = '';
    content.style.color = '';
    await addHideToggle(content, card, itemId, favDiv);
}

async function processItems() {
    for (const favDiv of document.querySelectorAll('.horiz-offer-card__actions-item--favorites')) {
        const favButton = favDiv.querySelector('button.fav-button');
        const card = favButton.closest('.classifieds__item');
        let content = favButton.closest('.horiz-offer-card__content');
        if (!card || !favButton || !content) {
            continue;
        }
        const itemId = favButton.getAttribute('data-iid');
        if (await isInHiddenItemsStorage(itemId)) {
            await applyHiddenStyle(content, card, itemId, favDiv);
        } else {
            await applyShownStyle(content, card, itemId, favDiv);
        }
    }
}

function getAllItemIds() {
    let itemIds = [];
    document.querySelectorAll('.horiz-offer-card__actions-item--favorites')
        .forEach(favDiv => {
            const favButton = favDiv.querySelector('button.fav-button');
            const itemId = favButton.getAttribute('data-iid');
            itemIds.push(itemId);
        });
    return itemIds;
}

function hideAds() {
    const wideAds = document.querySelectorAll('.wide-unit');
    const adBlock = document.getElementById('adBlock');
    if (adBlock) {
        adBlock.style.display = 'none';
    }
    wideAds.forEach((ad) => {
        ad.style.display = 'none';
    })
}

function createShowHiddenToggle() {
    const toggleLink = document.createElement('a');
    toggleLink.href = '#';
    toggleLink.textContent = showingHidden
        ? (locale === 'ru' ? hideAgainTextRu : hideAgainTextEt)
        : (locale === 'ru' ? showTextRu : showTextEt);
    toggleLink.style.cursor = 'pointer';
    toggleLink.style.color = '#0073e6';
    toggleLink.style.textDecoration = 'none';
    toggleLink.style.fontSize = '14px';

    toggleLink.addEventListener('mouseenter', () => {
        toggleLink.style.textDecoration = 'underline';
    });
    toggleLink.addEventListener('mouseleave', () => {
        toggleLink.style.textDecoration = 'none';
    });

    toggleLink.addEventListener('click', async (e) => {
        e.preventDefault();
        showingHidden = !showingHidden;
        await setStorageData(SHOWING_HIDDEN_KEY, showingHidden);
        await processItems();
        toggleLink.textContent = showingHidden
            ? (locale === 'ru' ? hideAgainTextRu : hideAgainTextEt)
            : (locale === 'ru' ? showTextRu : showTextEt);
    });
    return toggleLink;
}


function createCancel() {
    const unhideLastLink = document.createElement('a');
    unhideLastLink.href = '#';
    unhideLastLink.textContent = locale === 'ru' ? cancelTextRu : cancelTextEt;
    unhideLastLink.style.cursor = 'pointer';
    unhideLastLink.style.color = '#0073e6';
    unhideLastLink.style.textDecoration = 'none';
    unhideLastLink.style.fontSize = '14px';

    unhideLastLink.addEventListener('mouseenter', () => {
        unhideLastLink.style.textDecoration = 'underline';
    });
    unhideLastLink.addEventListener('mouseleave', () => {
        unhideLastLink.style.textDecoration = 'none';
    });

    unhideLastLink.addEventListener('click', async (e) => {
        e.preventDefault();
        const removed = await getStorageData(HIDDEN_ITEMS_KEY) || [];
        let lastHiddenItemId = removed.pop();
        await removeFromHiddenItemsStorage(lastHiddenItemId);
        hidingHistory = hidingHistory.filter(id => id !== lastHiddenItemId);
        await processItems();
        await addHiddenCount();
    });
    return unhideLastLink;
}

async function addHiddenCount() {
    const topDiv = document.querySelector('.top');
    const viewManageEl = topDiv.querySelector('.view-manage');

    const allHiddenItemIds = await getAllHiddenItemsStorage();
    const count = allHiddenItemIds.filter(id => allItemIds.includes(id)).length;

    const oldCounter = document.getElementById('hidden-counter');
    if (oldCounter) oldCounter.remove();

    const wrapper = document.createElement('div');
    wrapper.id = 'hidden-counter';
    wrapper.style.display = 'flex';
    wrapper.style.alignItems = 'center';
    wrapper.style.gap = '12px';

    const hiddenInfo = document.createElement('span');
    hiddenInfo.textContent = `${count} ${locale === 'ru' ? hiddenTextRu : hiddenTextEt}`;

    const toggleLink = createShowHiddenToggle();

    wrapper.appendChild(hiddenInfo);
    wrapper.appendChild(toggleLink);

    if (hidingHistory.length > 0) {
        const unhideLastLink = createCancel();
        wrapper.appendChild(unhideLastLink);
    }

    topDiv.insertBefore(wrapper, viewManageEl);
}

hideAds();

(async () => {
    hideAds();
    await initialize();
})().catch(error => {
    console.error('Initialization failed:', error);
});
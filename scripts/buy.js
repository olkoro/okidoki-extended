console.log("content script running");
let hiddenCount = 0;
let showingHidden = JSON.parse(localStorage.getItem('showingHidden')) || false;
const HIDDEN_ITEMS_KEY = 'hiddenItems';

function addUnhideButton(itemId, card, removed, favDiv) {
    const unhideBtn = document.createElement('button');
    unhideBtn.textContent = 'Readd';
    unhideBtn.type = 'button';
    unhideBtn.classList.add("fav-button");
    unhideBtn.dataset.iid = itemId;

    unhideBtn.innerHTML = `
              <svg class="fav-button__icon" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <line x1="12" y1="5" x2="12" y2="19" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                <line x1="5" y1="12" x2="19" y2="12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              </svg>
            `;

    unhideBtn.addEventListener('click', (e) => {
        removed = removed.filter(id => id !== itemId);
        localStorage.setItem(HIDDEN_ITEMS_KEY, JSON.stringify(removed));
        unhideBtn.remove();
        addRemoveButton(itemId, card, removed, favDiv);
    });

    favDiv.appendChild(unhideBtn);
    return removed;
}

function addRemoveButton(itemId, card, removed, favDiv) {
    const removeBtn = document.createElement('button');
    removeBtn.textContent = 'Remove';
    removeBtn.type = 'button';
    removeBtn.classList.add("fav-button");
    removeBtn.dataset.iid = itemId;

    removeBtn.innerHTML = `
          <svg class="fav-button__icon" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <line x1="18" y1="6" x2="6" y2="18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            <line x1="6" y1="6" x2="18" y2="18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
        `;

    removeBtn.addEventListener('click', (e) => {
        if (!showingHidden) {
            card.style.display = 'none';
        }
        removeBtn.remove();
        addUnhideButton(itemId, card, removed, favDiv);
        if (!removed.includes(itemId)) {
            removed.push(itemId);
            localStorage.setItem(HIDDEN_ITEMS_KEY, JSON.stringify(removed));
            hiddenCount++;
            insertHiddenCount(hiddenCount);
        }
    });

    favDiv.appendChild(removeBtn);
}

function processItems() {
    let removed = JSON.parse(localStorage.getItem(HIDDEN_ITEMS_KEY) || '[]');

    document.querySelectorAll('.horiz-offer-card__actions-item--favorites')
        .forEach(favDiv => {
        const favButton = favDiv.querySelector('button.fav-button');
        const card = favButton.closest('.classifieds__item');
        if (!card || !favButton) {
            return;
        }
        const itemId = favButton.getAttribute('data-iid');
        if (removed.includes(itemId)) {
            hiddenCount++;
            if (showingHidden) {
                removed = addUnhideButton(itemId, card, removed, favDiv);
                let content = favButton.closest('.horiz-offer-card__content');
                if (content) {
                    content.style.color = '#999';
                }
            } else {
                card.style.display = 'none';
            }
        } else {
            addRemoveButton(itemId, card, removed, favDiv);
        }
        });
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

function applyHiddenToggle() {
    const removed = JSON.parse(localStorage.getItem(HIDDEN_ITEMS_KEY) || '[]');
    document.querySelectorAll('.horiz-offer-card__actions-item--favorites').forEach(favDiv => {
        const favButton = favDiv.querySelector('button.fav-button');
        const card = favDiv.closest('.classifieds__item');
        if (!card || !favButton) return;

        const itemId = favButton.getAttribute('data-iid');
        if (removed.includes(itemId)) {
            card.style.display = showingHidden ? 'none' : '';
            let content = favButton.closest('.horiz-offer-card__content');
            if (content) {
                content.style.color = '#999';
            }
        }
    });
}

function insertHiddenCount(count) {
    const topDiv = document.querySelector('.top');
    const viewManageEl = topDiv.querySelector('.view-manage');

    // Remove old counter if it exists
    const oldCounter = document.getElementById('hidden-counter');
    if (oldCounter) oldCounter.remove();

    // Create wrapper
    const wrapper = document.createElement('div');
    wrapper.id = 'hidden-counter';
    wrapper.style.display = 'flex';
    wrapper.style.alignItems = 'center';
    wrapper.style.gap = '12px';

    // Create text
    const hiddenInfo = document.createElement('span');
    hiddenInfo.textContent = `${count} скрыто на этой странице`;

    // Create link toggle
    const toggleLink = document.createElement('a');
    toggleLink.href = '#';
    toggleLink.textContent = showingHidden ? '[Скрыть снова]' : '[Показать скрытые]';
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

    toggleLink.addEventListener('click', (e) => {
        e.preventDefault();
        console.log('clicked')
        applyHiddenToggle();
        showingHidden = !showingHidden;
        localStorage.setItem('showingHidden', JSON.stringify(showingHidden));
        toggleLink.textContent = showingHidden ? '[Скрыть снова]' : '[Показать скрытые]';
    });

    wrapper.appendChild(hiddenInfo);
    wrapper.appendChild(toggleLink);

    // Insert before view-manage block
    topDiv.insertBefore(wrapper, viewManageEl);
}


hideAds();
processItems();
insertHiddenCount(hiddenCount);

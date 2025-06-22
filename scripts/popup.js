async function updateCounter() {
    try {
        const result = await chrome.storage.local.get('hiddenItems');
        const hiddenItems = result.hiddenItems || [];
        document.getElementById('hiddenCount').textContent = hiddenItems.length;
    } catch (error) {
        console.error('Error updating counter:', error);
    }
}

async function clearHiddenItems() {
    try {
        await chrome.storage.local.set({ 'hiddenItems': [] });
        await updateCounter();
        const button = document.getElementById('clearHidden');
        const originalText = button.textContent;
        button.textContent = 'Cleared!';
        setTimeout(() => {
            button.textContent = originalText;
        }, 1500);
    } catch (error) {
        console.error('Error clearing items:', error);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    updateCounter().catch(error => console.error('Error updating counter:', error));
    document.getElementById('clearHidden').addEventListener('click', clearHiddenItems);
});
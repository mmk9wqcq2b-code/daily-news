let newsData = null;
let currentFilter = 'Alle';
let searchTerm = '';
let readIds = new Set(JSON.parse(localStorage.getItem('josi-read') || '[]'));
let bookmarkedIds = new Set(JSON.parse(localStorage.getItem('josi-bookmarks') || '[]'));
let displayedCount = 0;
const PAGE_SIZE = 8;

const feed = document.getElementById('feed');
const lastUpdatedEl = document.getElementById('last-updated');
const updateNote = document.getElementById('update-note');
const searchInput = document.getElementById('search');
const banner = document.getElementById('new-items-banner');

function saveState() {
  localStorage.setItem('josi-read', JSON.stringify([...readIds]));
  localStorage.setItem('josi-bookmarks', JSON.stringify([...bookmarkedIds]));
}

function formatDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString('de-CH', { day: 'numeric', month: 'short', year: 'numeric' });
}

function renderItems(reset = false) {
  if (reset) {
    feed.innerHTML = '';
    displayedCount = 0;
  }
  if (!newsData) return;

  let items = newsData.items;
  if (currentFilter === 'X') {
    items = items.filter(i => i.hasX === true);
  } else if (currentFilter !== 'Alle') {
    items = items.filter(i => i.category === currentFilter);
  }
  if (searchTerm) {
    const t = searchTerm.toLowerCase();
    items = items.filter(i => 
      i.title.toLowerCase().includes(t) || 
      i.summary.toLowerCase().includes(t) ||
      (i.whyImportant || '').toLowerCase().includes(t)
    );
  }

  // Sort newest first
  items.sort((a, b) => new Date(b.publishedAt || b.eventDate) - new Date(a.publishedAt || a.eventDate));

  const slice = items.slice(displayedCount, displayedCount + PAGE_SIZE);
  slice.forEach(item => {
    const card = document.createElement('article');
    card.className = 'card';
    card.dataset.id = item.id;
    if (readIds.has(item.id)) card.style.opacity = '0.75';

    const badges = [];
    if (item.status) badges.push(`<span class="badge">${item.status}</span>`);
    if (item.hasX) badges.push(`<span class="badge x-badge">X</span>`);

    card.innerHTML = `
      <div class="card-header">
        <span class="category">${item.category}</span>
        <div class="badges">${badges.join('')}</div>
      </div>
      <h2>${item.title}</h2>
      <p class="summary">${item.summary}</p>
      <p class="why"><strong>Warum das wichtig ist:</strong> ${item.whyImportant}</p>
      <div class="meta">
        <div>
          <div>Ereignis: ${formatDate(item.eventDate)}</div>
          <div class="sources">${item.sources.map(s => `<a href="${s.url}" target="_blank" rel="noopener">${s.name}</a>`).join('')}</div>
        </div>
        <div class="actions">
          <button class="bookmark" data-id="${item.id}" title="Lesezeichen">${bookmarkedIds.has(item.id) ? '★' : '☆'}</button>
          <button class="mark-read" data-id="${item.id}" title="Gelesen">${readIds.has(item.id) ? '✓' : '○'}</button>
        </div>
      </div>
    `;
    feed.appendChild(card);
  });
  displayedCount += slice.length;

  // Attach events
  feed.querySelectorAll('.bookmark').forEach(btn => {
    btn.onclick = (e) => {
      e.stopPropagation();
      const id = btn.dataset.id;
      if (bookmarkedIds.has(id)) bookmarkedIds.delete(id); else bookmarkedIds.add(id);
      saveState();
      btn.textContent = bookmarkedIds.has(id) ? '★' : '☆';
    };
  });
  feed.querySelectorAll('.mark-read').forEach(btn => {
    btn.onclick = (e) => {
      e.stopPropagation();
      const id = btn.dataset.id;
      if (readIds.has(id)) readIds.delete(id); else readIds.add(id);
      saveState();
      const card = btn.closest('.card');
      card.style.opacity = readIds.has(id) ? '0.75' : '1';
      btn.textContent = readIds.has(id) ? '✓' : '○';
    };
  });
}

async function loadNews() {
  try {
    const res = await fetch('news.json?t=' + Date.now());
    if (!res.ok) throw new Error('Fetch failed');
    const data = await res.json();
    const isNew = newsData && data.lastUpdated !== newsData.lastUpdated;
    newsData = data;
    lastUpdatedEl.textContent = 'Stand: ' + new Date(data.lastUpdated).toLocaleString('de-CH', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' });
    updateNote.textContent = data.updateFrequency || 'Automatisch aktualisiert';
    if (isNew) {
      banner.classList.remove('hidden');
    } else {
      renderItems(true);
    }
  } catch (e) {
    feed.innerHTML = '<p style="text-align:center;color:var(--muted)">Nachrichten konnten nicht geladen werden. Bitte später erneut versuchen.</p>';
    console.error(e);
  }
}

// Filters
document.getElementById('filters').addEventListener('click', (e) => {
  if (e.target.tagName !== 'BUTTON') return;
  document.querySelectorAll('#filters button').forEach(b => b.classList.remove('active'));
  e.target.classList.add('active');
  currentFilter = e.target.dataset.cat;
  renderItems(true);
});

// Search
searchInput.addEventListener('input', () => {
  searchTerm = searchInput.value.trim();
  renderItems(true);
});

// Theme
const themeToggle = document.getElementById('theme-toggle');
function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  themeToggle.textContent = theme === 'dark' ? '☀️' : '🌙';
  localStorage.setItem('josi-theme', theme);
}
themeToggle.onclick = () => {
  const current = document.documentElement.getAttribute('data-theme') || 'light';
  applyTheme(current === 'dark' ? 'light' : 'dark');
};
applyTheme(localStorage.getItem('josi-theme') || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'));

// Infinite scroll
window.addEventListener('scroll', () => {
  if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 400) {
    renderItems(false);
  }
});

// Banner
banner.onclick = () => {
  banner.classList.add('hidden');
  renderItems(true);
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

// Initial load
loadNews();

// Periodic check (client-side, for visibility; real updates come from server/bot)
setInterval(loadNews, 5 * 60 * 1000);

// Service worker registration for PWA
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}

const API_BASE = window.API_BASE || "https://services-ads-backend.onrender.com";
const ADS_ENDPOINT = API_BASE + "/api/ads";

async function loadAds() {
  try {
    const res = await fetch(ADS_ENDPOINT);
    const data = await res.json();
    renderAds(Array.isArray(data) ? data : []);
  } catch (err) {
    document.getElementById('adsList').innerHTML = `<div class="error">Ошибка загрузки объявлений: ${err.message}</div>`;
  }
}

function renderAds(ads) {
  const container = document.getElementById('adsList');
  const empty = document.getElementById('empty');
  if (!container) return;
  container.innerHTML = '';
  if (!ads || ads.length === 0) {
    empty.style.display = 'block';
    return;
  }
  empty.style.display = 'none';
  ads.forEach(ad => {
    const card = document.createElement('article');
    card.className = 'card';
    const img = document.createElement('img');
    img.alt = ad.title || 'Фото';
    img.src = ad.imageUrl || 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="200"><rect width="100%" height="100%" fill="%23EEE"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="%23999">No image</text></svg>';
    const body = document.createElement('div');
    body.className = 'card-body';
    body.innerHTML = `<h3>${escapeHtml(ad.title || '')}</h3>
                      <p class="desc">${escapeHtml(ad.description || '')}</p>
                      <p class="meta">${ad.username ? escapeHtml(ad.username) + ' • ' : ''}${ad.price ? ad.price + ' ₽' : ''}</p>
                      <p class="contacts">📞 ${escapeHtml(ad.contacts || 'Контакты не указаны')}</p>
                      <time>${new Date(ad.created_at || ad.createdAt || Date.now()).toLocaleString()}</time>`;
    card.appendChild(img);
    card.appendChild(body);
    container.appendChild(card);
  });
}

function escapeHtml(s){ return String(s).replace(/[&<>"']/g, function(m){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]; }); }

async function fileToDataURL(file) {
  return new Promise((res, rej) => {
    if (!file) return res(null);
    const reader = new FileReader();
    reader.onload = () => res(reader.result);
    reader.onerror = err => rej(err);
    reader.readAsDataURL(file);
  });
}

async function handleAddForm(e) {
  e.preventDefault();
  const form = e.target;
  const status = document.getElementById('status');
  status.textContent = 'Отправка...';
  const title = form.title.value.trim();
  const description = form.description.value.trim();
  const price = form.price.value ? parseFloat(form.price.value) : null;
  const contacts = form.contacts.value.trim(); // ← ДОБАВЛЕНО
  const file = form.image.files[0];
  try {
    const imageUrl = await fileToDataURL(file);
    const payload = { title, description, price, contacts, imageUrl }; // ← ДОБАВЛЕНО contacts
    const res = await fetch(ADS_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const err = await res.json().catch(()=>({message: res.statusText}));
      throw new Error(err.message || 'Ошибка сервера');
    }
    status.textContent = 'Объявление опубликовано!';
    setTimeout(()=> location.href = 'index.html', 800);
  } catch (err) {
    status.textContent = 'Ошибка: ' + err.message;
  }
}

// Auto-run depending on page
document.addEventListener('DOMContentLoaded', () => {
  if (window.PAGE === 'add') {
    const form = document.getElementById('adForm');
    form.addEventListener('submit', handleAddForm);
  } else {
    loadAds();
  }
});

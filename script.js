const API_BASE = window.API_BASE || "https://services-ads-backend.onrender.com";
const ADS_ENDPOINT = API_BASE + "/api/ads";

// Генерация ID автора
function generateAuthorId() {
    return 'user_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
}

// Получить ID автора
function getAuthorId() {
    let authorId = localStorage.getItem('authorId');
    if (!authorId) {
        authorId = generateAuthorId();
        localStorage.setItem('authorId', authorId);
    }
    return authorId;
}

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
    
    const currentAuthorId = getAuthorId();
    
    ads.forEach(ad => {
        const card = document.createElement('article');
        card.className = 'card';
        
        const imgContainer = document.createElement('div');
        imgContainer.className = 'card-image-container';
        
        const img = document.createElement('img');
        img.alt = ad.title || 'Фото';
        img.src = ad.imageUrl || 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="200"><rect width="100%" height="100%" fill="%23EEE"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="%23999">No image</text></svg>';
        
        const isAuthor = currentAuthorId === ad.authorId;
        
        // Добавляем меню в контейнер изображения
        if (isAuthor) {
            const imageMenu = document.createElement('div');
            imageMenu.className = 'image-menu';
            imageMenu.innerHTML = `
                <button class="menu-btn" onclick="toggleMenu('${ad._id}')">⋮</button>
                <div class="menu-dropdown" id="menu-${ad._id}">
                    <button onclick="editAd('${ad._id}')">✏️ Редактировать</button>
                    <button onclick="deleteAd('${ad._id}')">🗑️ Удалить</button>
                </div>
            `;
            imgContainer.appendChild(imageMenu);
        }
        
        imgContainer.appendChild(img);
        
        const body = document.createElement('div');
        body.className = 'card-body';
        body.innerHTML = `<h3>${escapeHtml(ad.title || '')}</h3>
                          <p class="desc">${escapeHtml(ad.description || '')}</p>
                          <p class="meta">${ad.price ? ad.price + ' ₽' : ''}</p>
                          <p class="contacts">📞 ${escapeHtml(ad.contacts || 'Контакты не указаны')}</p>
                          <time>${new Date(ad.createdAt).toLocaleString()}</time>`;
        
        card.appendChild(imgContainer);
        card.appendChild(body);
        container.appendChild(card);
    });
}

// Функции для меню с тремя точками
function toggleMenu(adId) {
    const menu = document.getElementById(`menu-${adId}`);
    const allMenus = document.querySelectorAll('.menu-dropdown');
    
    // Закрываем все другие меню
    allMenus.forEach(m => {
        if (m.id !== `menu-${adId}`) m.style.display = 'none';
    });
    
    // Переключаем текущее меню
    if (menu.style.display === 'block') {
        menu.style.display = 'none';
    } else {
        menu.style.display = 'block';
    }
}

// Закрываем меню при клике вне его
document.addEventListener('click', function(e) {
    if (!e.target.closest('.image-menu')) {
        document.querySelectorAll('.menu-dropdown').forEach(menu => {
            menu.style.display = 'none';
        });
    }
});

// Функция редактирования - переходим на страницу редактирования
function editAd(adId) {
    window.location.href = `edit.html?id=${adId}`;
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
    const contacts = form.contacts.value.trim();
    const file = form.image.files[0];
    const authorId = getAuthorId();
    
    try {
        const imageUrl = await fileToDataURL(file);
        const payload = { title, description, price, contacts, imageUrl, authorId };
        
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

// Удаление объявления
async function deleteAd(adId) {
    if (!confirm('Удалить это объявление?')) return;
    
    try {
        const authorId = getAuthorId();
        const res = await fetch(`${ADS_ENDPOINT}/${adId}`, {
            method: 'DELETE',
            headers: {
                'author-id': authorId
            }
        });
        
        if (res.ok) {
            loadAds();
        } else {
            const error = await res.json();
            alert('Ошибка: ' + error.message);
        }
    } catch (err) {
        alert('Ошибка: ' + err.message);
    }
}

// Функции для страницы редактирования
if (window.PAGE === 'edit') {
    const form = document.getElementById('editForm');
    const adId = window.EDIT_AD_ID;
    
    // Загружаем данные объявления
    loadAdForEdit(adId);
    
    form.addEventListener('submit', handleEditForm);
}

async function loadAdForEdit(adId) {
    try {
        const res = await fetch(`${ADS_ENDPOINT}/${adId}`);
        if (!res.ok) throw new Error('Объявление не найдено');
        
        const ad = await res.json();
        
        // Заполняем форму данными
        document.getElementById('title').value = ad.title || '';
        document.getElementById('description').value = ad.description || '';
        document.getElementById('price').value = ad.price || '';
        document.getElementById('contacts').value = ad.contacts || '';
    } catch (err) {
        alert('Ошибка загрузки: ' + err.message);
        location.href = 'index.html';
    }
}

async function handleEditForm(e) {
    e.preventDefault();
    const form = e.target;
    const status = document.getElementById('status');
    status.textContent = 'Сохранение...';
    
    const title = form.title.value.trim();
    const description = form.description.value.trim();
    const price = form.price.value ? parseFloat(form.price.value) : null;
    const contacts = form.contacts.value.trim();
    const file = form.image.files[0];
    const adId = window.EDIT_AD_ID;
    
    try {
        let imageUrl = undefined;
        if (file) {
            imageUrl = await fileToDataURL(file);
        }
        
        const payload = { title, description, price, contacts };
        if (imageUrl) payload.imageUrl = imageUrl;
        
        const authorId = getAuthorId();
        const res = await fetch(`${ADS_ENDPOINT}/${adId}`, {
            method: 'PUT',
            headers: { 
                'Content-Type': 'application/json',
                'author-id': authorId
            },
            body: JSON.stringify(payload)
        });
        
        if (!res.ok) {
            const err = await res.json().catch(()=>({message: res.statusText}));
            throw new Error(err.message || 'Ошибка сервера');
        }
        
        status.textContent = '✅ Объявление обновлено!';
        setTimeout(() => location.href = 'index.html', 1000);
    } catch (err) {
        status.textContent = '❌ Ошибка: ' + err.message;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    if (window.PAGE === 'add') {
        const form = document.getElementById('adForm');
        form.addEventListener('submit', handleAddForm);
    } else if (window.PAGE !== 'edit') {
        loadAds();
    }
});

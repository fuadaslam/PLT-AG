// Check configuration
if (typeof supabaseClient === 'undefined') {
    alert("Please configure Supabase in assets/js/supabase-config.js first!");
    throw new Error("Supabase not configured");
}

// HTML-escape helper — all DB text inserted into innerHTML must go through this
function esc(s) {
    return (s == null ? '' : String(s))
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

// Validate URLs — only allow http/https
function safeUrl(url) {
    if (!url) return '#';
    try {
        const u = new URL(url);
        return (u.protocol === 'https:' || u.protocol === 'http:') ? url : '#';
    } catch(e) { return '#'; }
}

// DOM Elements - Global
const userEmailSpan = document.getElementById('userEmail');
const logoutBtn = document.getElementById('logoutBtn');
const navItems = document.querySelectorAll('.nav-item');
const viewSections = document.querySelectorAll('.view-section');

// Current State
let currentView = 'products';
let currentProducts = [];
let currentCoreValues = [];
let currentServices = [];
let currentTeam = [];
let currentBenefits = [];
let currentBlogs = [];

// Auth Protection
supabaseClient.auth.getSession().then(({ data: { session } }) => {
    if (!session) {
        window.location.href = 'login.html';
    } else {
        userEmailSpan.textContent = session.user.email;
        switchView('products');
    }
});

supabaseClient.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_OUT' || !session) {
        window.location.href = 'login.html';
    }
});

// Logout
logoutBtn.addEventListener('click', async () => {
    await supabaseClient.auth.signOut();
});

// Navigation
navItems.forEach(item => {
    item.addEventListener('click', (e) => {
        e.preventDefault();
        const viewName = item.getAttribute('data-view');
        switchView(viewName);
    });
});

function switchView(viewName) {
    currentView = viewName;

    // Update Nav
    navItems.forEach(nav => {
        if (nav.getAttribute('data-view') === viewName) nav.classList.add('active');
        else nav.classList.remove('active');
    });

    // Update Views
    viewSections.forEach(section => {
        section.style.display = 'none';
    });
    const activeSection = document.getElementById(`view-${viewName}`);
    if(activeSection) activeSection.style.display = 'block';

    // Load Data based on View
    if (viewName === 'products') loadProducts();
    else if (viewName === 'about') loadAbout();
    else if (viewName === 'core-values') loadCoreValues();
    else if (viewName === 'services') loadServices();
    else if (viewName === 'consultancy') loadConsultancy();
    else if (viewName === 'careers') loadCareers();
    else if (viewName === 'contact') loadContact();
    else if (viewName === 'blogs') loadBlogs();
    else if (viewName === 'certifications') loadCertifications();
    else if (viewName === 'recognitions') loadRecognitions();
    else if (viewName === 'site-settings') loadSiteSettings();
}

// ==========================================
// HELPERS
// ==========================================
function escapeHTML(str) {
    if (!str) return '';
    return str.toString()
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}
async function deleteGeneric(collection, id, reloadFn) {
    try {
        const { error } = await supabaseClient.from(collection).delete().eq('id', id);
        if (error) throw error;
        reloadFn();
    } catch(e) { handleError(e); }
}

async function handleFormSubmit(form, collection, idFieldId, getDataFn, reloadFn, modalId, fileInputId = null, urlInputId = null) {
    const id = document.getElementById(idFieldId).value;
    const btn = form.querySelector('button[type="submit"]');
    const originalText = btn.textContent;
    btn.disabled = true;
    btn.textContent = 'Processing...';

    try {
        // Handle File Upload if present
        if (fileInputId && document.getElementById(fileInputId).files.length > 0) {
             const file = document.getElementById(fileInputId).files[0];
             btn.textContent = 'Uploading...';
             const filePath = `${collection}/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9_.-]/g, '')}`;
             
             // Upload to Supabase Storage 'images' bucket
             const { error: uploadError } = await supabaseClient.storage.from('images').upload(filePath, file);
             if (uploadError) throw uploadError;
             
             const { data: { publicUrl } } = supabaseClient.storage.from('images').getPublicUrl(filePath);
             document.getElementById(urlInputId).value = publicUrl;
        }

        const data = getDataFn();
        
        btn.textContent = 'Saving...';
        if (id) {
            const { error } = await supabaseClient.from(collection).update(data).eq('id', id);
            if (error) throw error;
        } else {
            const { error } = await supabaseClient.from(collection).insert([data]);
            if (error) throw error;
        }
        
        document.getElementById(modalId).classList.remove('active');
        reloadFn();
    } catch (error) {
        handleError(error);
    } finally {
        btn.textContent = originalText;
        btn.disabled = false;
    }
}

function handleError(error) {
    console.error(error);
    alert("Error: " + (error.message || JSON.stringify(error)));
}

// Modal Closers
document.querySelectorAll('.close-modal').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.modal').forEach(m => m.classList.remove('active'));
    });
});

// ==========================================
// 1. PRODUCTS LOGIC
// ==========================================
const productsTableBody = document.getElementById('productsGrid');
const loadingState = document.getElementById('loadingState');
const emptyState = document.getElementById('emptyState');
const productModal = document.getElementById('productModal');
const productForm = document.getElementById('productForm');

async function loadProducts() {
    loadingState.style.display = 'block';
    productsTableBody.innerHTML = '';
    emptyState.style.display = 'none';

    try {
        const { data: snapshot, error } = await supabaseClient.from('products').select('*');
        if (error) throw error;
        
        currentProducts = snapshot || [];
        if (currentProducts.length === 0) {
            loadingState.style.display = 'none';
            emptyState.style.display = 'block';
            return;
        }
        renderProductsTable();
    } catch (error) {
        handleError(error);
    } finally {
        loadingState.style.display = 'none';
    }
}

function renderProductsTable() {
    productsTableBody.innerHTML = '';
    currentProducts.forEach(product => {
        const imgSrc = product.imageToPass
            ? (product.imageToPass.startsWith('http') ? product.imageToPass : '../' + product.imageToPass)
            : 'https://via.placeholder.com/200';
        const card = document.createElement('div');
        card.className = 'admin-card';
        card.innerHTML = `
            <img src="${esc(imgSrc)}" class="admin-card-img" onerror="this.src='https://via.placeholder.com/200'">
            <div class="admin-card-body">
                <h3>${escapeHTML(product.head2)}</h3>
                <p>${escapeHTML(product.text ? product.text.substring(0, 80) : '')}</p>
            </div>
            <div class="admin-card-footer">
                <span class="badge badge-${escapeHTML(product.type)}">${escapeHTML(product.type)}</span>
                <div class="actions">
                    <button class="btn-icon" onclick="editProduct('${esc(String(product.id))}')"><i class='bx bx-edit-alt'></i></button>
                    <button class="btn-icon delete" onclick="deleteProduct('${esc(String(product.id))}')"><i class='bx bx-trash'></i></button>
                </div>
            </div>
        `;
        productsTableBody.appendChild(card);
    });
}

document.getElementById('addProductBtn').addEventListener('click', () => {
    productForm.reset();
    document.getElementById('productId').value = '';
    document.getElementById('modalTitle').textContent = 'Add Product';
    productModal.classList.add('active');
});

window.editProduct = (id) => {
    const product = currentProducts.find(p => p.id == id); // == intentionally as id might be int or string
    if (!product) return;
    document.getElementById('productId').value = id;
    document.getElementById('head2').value = product.head2 || '';
    document.getElementById('type').value = product.type || 'other';
    document.getElementById('imageToPass').value = product.imageToPass || '';
    document.getElementById('text').value = product.text || '';
    document.getElementById('head').value = product.head || '';
    document.getElementById('points').value = product.points || '';
    document.getElementById('modalTitle').textContent = 'Edit Product';
    productModal.classList.add('active');
};

window.deleteProduct = async (id) => {
    if (confirm('Delete this product?')) {
        await deleteGeneric('products', id, loadProducts);
    }
};

productForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    await handleFormSubmit(productForm, 'products', 'productId', () => {
        return {
            head2: document.getElementById('head2').value,
            type: document.getElementById('type').value,
            imageToPass: document.getElementById('imageToPass').value,
            text: document.getElementById('text').value,
            head: document.getElementById('head').value,
            points: document.getElementById('points').value
        };
    }, loadProducts, 'productModal', 'imageFile', 'imageToPass');
});

// Seed Data
document.getElementById('seedDataBtn').addEventListener('click', async () => {
    if (!confirm("This will seed data into Supabase. Continue?")) return;
    
    const btn = document.getElementById('seedDataBtn');
    btn.disabled = true;
    btn.textContent = "Seeding...";

    try {
        const checkEmpty = async (table) => {
            const { data } = await supabaseClient.from(table).select('id').limit(1);
            return !data || data.length === 0;
        };

        if (window.productsData && await checkEmpty('products')) {
           const { error } = await supabaseClient.from('products').insert(window.productsData);
           if (error) throw error;
        }

        if (window.initialSiteData) {
            const d = window.initialSiteData;
            
            const { error: err1 } = await supabaseClient.from('static_content').upsert([
                { id: 'about', data: d.about },
                { id: 'consultancy', data: d.consultancy },
                { id: 'contact', data: d.contact }
            ]);
            if (err1) throw err1;
            
            if (d.coreValues.length > 0 && await checkEmpty('core_values')) {
                const { error } = await supabaseClient.from('core_values').insert(d.coreValues);
                if (error) throw error;
            }
            if (d.services.length > 0 && await checkEmpty('services')) {
                const { error } = await supabaseClient.from('services').insert(d.services);
                if (error) throw error;
            }
            if (d.team.length > 0 && await checkEmpty('team_members')) {
                const { error } = await supabaseClient.from('team_members').insert(d.team);
                if (error) throw error;
            }
            if (d.benefits.length > 0 && await checkEmpty('career_benefits')) {
                const { error } = await supabaseClient.from('career_benefits').insert(d.benefits);
                if (error) throw error;
            }
        }

        alert("All content seeded successfully (existing data was kept safe)!");
        switchView(currentView);

    } catch(e) { console.error(e); alert(e.message); }
    finally { btn.textContent = "Initialize Data"; btn.disabled = false; }
});

// ==========================================
// 2. ABOUT US LOGIC
// ==========================================
async function loadAbout() {
    const container = document.getElementById('aboutFormContainer');
    container.innerHTML = '<p>Loading...</p>';
    
    try {
        const { data: row } = await supabaseClient.from('static_content').select('data').eq('id', 'about').maybeSingle();
        const data = row ? row.data : { title: 'ABOUT US', subtitle: 'Redefining Agricultural Excellence', description: '' };

        container.innerHTML = `
            <form id="aboutForm">
                <div class="form-group">
                    <label>Main Title</label>
                    <input type="text" id="aboutTitle" class="form-control" value="${esc(data.title || '')}">
                </div>
                <div class="form-group">
                    <label>Subtitle</label>
                    <input type="text" id="aboutSubtitle" class="form-control" value="${esc(data.subtitle || '')}">
                </div>
                 <div class="form-group">
                    <label>Description (Main Text)</label>
                    <textarea id="aboutDesc" class="form-control" rows="6">${esc(data.description || '')}</textarea>
                </div>
                <div class="form-group">
                    <label>About Us Image</label>
                    <input type="file" id="aboutImageFile" class="form-control" accept="image/*">
                    <input type="hidden" id="aboutImageToPass" value="${esc(data.image || '')}">
                    ${data.image ? `<img src="${esc(data.image)}" style="max-height:100px; margin-top:10px;">` : ''}
                </div>
            </form>
        `;
    } catch (e) { handleError(e); }
}

document.getElementById('saveAboutBtn').addEventListener('click', async () => {
    if (!document.getElementById('aboutTitle')) { alert('Please wait for the form to load.'); return; }
    const title = document.getElementById('aboutTitle').value;
    const subtitle = document.getElementById('aboutSubtitle').value;
    const description = document.getElementById('aboutDesc').value;
    const btn = document.getElementById('saveAboutBtn');

    btn.textContent = 'Uploading...';
    btn.disabled = true;
    try {
        let imageUrl = document.getElementById('aboutImageToPass').value;
        const fileInput = document.getElementById('aboutImageFile');
        if (fileInput && fileInput.files.length > 0) {
            const file = fileInput.files[0];
            const filePath = `static_content/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9_.-]/g, '')}`;
            const { error: uploadError } = await supabaseClient.storage.from('images').upload(filePath, file);
            if (uploadError) throw uploadError;
            const { data: { publicUrl } } = supabaseClient.storage.from('images').getPublicUrl(filePath);
            imageUrl = publicUrl;
        }
        btn.textContent = 'Saving...';
        const { error } = await supabaseClient.from('static_content').upsert({ id: 'about', data: { title, subtitle, description, image: imageUrl } });
        if (error) throw error;
        alert('About Us saved!');
    } catch(e) { handleError(e); }
    finally { btn.textContent = 'Save Changes'; btn.disabled = false; }
});

// ==========================================
// 3. CORE VALUES LOGIC
// ==========================================
async function loadCoreValues() {
    const list = document.getElementById('coreValuesList');
    list.innerHTML = 'Loading...';
    try {
        const { data: snap, error } = await supabaseClient.from('core_values').select('*');
        if (error) throw error;
        
        currentCoreValues = snap || [];
        list.style.display = 'grid';
        list.innerHTML = '';
        if(currentCoreValues.length === 0) list.innerHTML = '<p>No values added.</p>';

        currentCoreValues.forEach(val => {
            const div = document.createElement('div');
            div.className = 'products-table';
            div.style.padding = '15px';
            div.style.background = 'white';
            div.style.marginBottom = '10px';
            div.innerHTML = `
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <div style="display:flex; gap:10px; align-items:center;">
                        <i class="${esc(val.icon)}" style="font-size:24px; color:#4CAF50;"></i>
                        <div>
                            <strong>${escapeHTML(val.title)}</strong>
                            <p style="margin:0; color:#666; font-size:13px;">${escapeHTML(val.description)}</p>
                        </div>
                    </div>
                     <div class="actions">
                        <button class="btn-icon" onclick="editCoreValue('${esc(String(val.id))}')"><i class='bx bx-edit-alt'></i></button>
                        <button class="btn-icon delete" onclick="deleteCoreValue('${esc(String(val.id))}')"><i class='bx bx-trash'></i></button>
                    </div>
                </div>
            `;
            list.appendChild(div);
        });
    } catch(e) { handleError(e); }
}

const coreValueModal = document.getElementById('coreValueModal');
const coreValueForm = document.getElementById('coreValueForm');

document.getElementById('addValueBtn').addEventListener('click', () => {
    coreValueForm.reset();
    document.getElementById('coreValueId').value = '';
    document.getElementById('coreValueModalTitle').textContent = 'Add Core Value';
    coreValueModal.classList.add('active');
});

window.editCoreValue = (id) => {
    const val = currentCoreValues.find(i => i.id == id);
    if(!val) return;
    document.getElementById('coreValueId').value = id;
    document.getElementById('cvTitle').value = val.title;
    document.getElementById('cvIcon').value = val.icon;
    document.getElementById('cvDesc').value = val.description;
    document.getElementById('coreValueModalTitle').textContent = 'Edit Core Value';
    coreValueModal.classList.add('active');
};

window.deleteCoreValue = async(id) => {
    if(confirm('Delete this value?')) await deleteGeneric('core_values', id, loadCoreValues);
}

coreValueForm.addEventListener('submit', async(e)=>{
    e.preventDefault();
    await handleFormSubmit(coreValueForm, 'core_values', 'coreValueId', () => ({
        title: document.getElementById('cvTitle').value,
        icon: document.getElementById('cvIcon').value,
        description: document.getElementById('cvDesc').value
    }), loadCoreValues, 'coreValueModal');
});

// ==========================================
// 4. SERVICES LOGIC
// ==========================================
async function loadServices() {
    const list = document.getElementById('servicesList');
    list.innerHTML = 'Loading...';
    try {
        const { data: snap, error } = await supabaseClient.from('services').select('*').order('number');
        if (error) throw error;

        currentServices = snap || [];
        list.innerHTML = '';
        if(currentServices.length === 0) list.innerHTML = '<p>No services added.</p>';

        currentServices.forEach(s => {
            const imgSrc = s.image
                ? (s.image.startsWith('http') ? s.image : '../' + s.image)
                : 'https://via.placeholder.com/200';
            const card = document.createElement('div');
            card.className = 'admin-card';
            card.innerHTML = `
                <img src="${esc(imgSrc)}" class="admin-card-img" style="object-fit:cover;" onerror="this.src='https://via.placeholder.com/200'">
                <div class="admin-card-body">
                    <span style="font-size:11px; font-weight:700; color:#4CAF50; letter-spacing:0.5px;">${escapeHTML(String(s.number || ''))}</span>
                    <h3>${escapeHTML(s.title)}</h3>
                    <p>${escapeHTML(s.description ? s.description.substring(0, 80) : '')}</p>
                </div>
                <div class="admin-card-footer">
                    <div class="actions">
                        <button class="btn-icon" onclick="editService('${esc(String(s.id))}')"><i class='bx bx-edit-alt'></i></button>
                        <button class="btn-icon delete" onclick="deleteService('${esc(String(s.id))}')"><i class='bx bx-trash'></i></button>
                    </div>
                </div>
            `;
            list.appendChild(card);
        });
    } catch(e) { handleError(e); }
}

const serviceModal = document.getElementById('serviceModal');
const serviceForm = document.getElementById('serviceForm');

document.getElementById('addServiceBtn').addEventListener('click', () => {
    serviceForm.reset();
    document.getElementById('serviceId').value = '';
    document.getElementById('serviceModalTitle').textContent = 'Add Service';
    serviceModal.classList.add('active');
});

window.editService = (id) => {
    const s = currentServices.find(i => i.id == id);
    if(!s) return;
    document.getElementById('serviceId').value = id;
    document.getElementById('servTitle').value = s.title;
    document.getElementById('servNumber').value = s.number;
    document.getElementById('servIcon').value = s.icon;
    document.getElementById('servImage').value = s.image;
    document.getElementById('servDesc').value = s.description;
    document.getElementById('serviceModalTitle').textContent = 'Edit Service';
    serviceModal.classList.add('active');
};

window.deleteService = async(id) => {
    if(confirm('Delete service?')) await deleteGeneric('services', id, loadServices);
}

serviceForm.addEventListener('submit', async(e)=>{
    e.preventDefault();
    await handleFormSubmit(serviceForm, 'services', 'serviceId', () => ({
        title: document.getElementById('servTitle').value,
        number: document.getElementById('servNumber').value,
        icon: document.getElementById('servIcon').value,
        image: document.getElementById('servImage').value,
        description: document.getElementById('servDesc').value
    }), loadServices, 'serviceModal', 'servImageFile', 'servImage');
});

// ==========================================
// 5. CONSULTANCY LOGIC
// ==========================================
async function loadConsultancy() {
     const container = document.getElementById('consultancyFormContainer');
     try {
        const { data: row } = await supabaseClient.from('static_content').select('data').eq('id', 'consultancy').maybeSingle();
        const data = row ? row.data : {};
        container.innerHTML = `
            <h6 style="margin-bottom:15px;">Hero Section</h6>
            <div class="form-grid">
                <div class="form-group">
                    <label>Hero Title</label>
                    <input type="text" id="consTitle" class="form-control" value="${esc(data.title || '')}">
                </div>
                <div class="form-group">
                    <label>Hero Subtitle</label>
                    <input type="text" id="consSubtitle" class="form-control" value="${esc(data.subtitle || '')}">
                </div>
                <div class="form-group full-width">
                    <label>Hero Description</label>
                    <textarea id="consDesc" class="form-control" rows="2">${esc(data.description || '')}</textarea>
                </div>
            </div>
            <hr style="margin: 20px 0;">
            <h6 style="margin-bottom:15px;">Why Our Agro Advisory? Section</h6>
            <div class="form-grid">
                <div class="form-group full-width">
                    <label>Section Title</label>
                    <input type="text" id="consWhyTitle" class="form-control" value="${esc(data.whyTitle || '')}">
                </div>
                <div class="form-group full-width">
                    <label>Body (one paragraph per line)</label>
                    <textarea id="consWhyBody" class="form-control" rows="5">${esc(data.whyBody || '')}</textarea>
                </div>
            </div>
            <hr style="margin: 20px 0;">
            <h6 style="margin-bottom:15px;">What PLT-AG Provides Section</h6>
            <div class="form-grid">
                <div class="form-group full-width">
                    <label>Section Title</label>
                    <input type="text" id="consProvidesTitle" class="form-control" value="${esc(data.providesTitle || '')}">
                </div>
                <div class="form-group full-width">
                    <label>Body (one paragraph per line)</label>
                    <textarea id="consProvidesBody" class="form-control" rows="5">${esc(data.providesBody || '')}</textarea>
                </div>
            </div>
            <hr style="margin: 20px 0;">
            <h6 style="margin-bottom:15px;">What Agro Advisory Has For You Section</h6>
            <div class="form-grid">
                <div class="form-group full-width">
                    <label>Section Title</label>
                    <input type="text" id="consBenefitsTitle" class="form-control" value="${esc(data.benefitsTitle || '')}">
                </div>
                <div class="form-group full-width">
                    <label>List Items (one item per line)</label>
                    <textarea id="consBenefitsList" class="form-control" rows="8">${esc(data.benefitsList || '')}</textarea>
                </div>
            </div>
            <hr style="margin: 20px 0;">
            <h6 style="margin-bottom:15px;">Info Box</h6>
            <div class="form-grid">
                <div class="form-group full-width">
                    <label>Info Box Text</label>
                    <textarea id="consInfoText" class="form-control" rows="3">${esc(data.infoText || '')}</textarea>
                </div>
            </div>
            <hr style="margin: 20px 0;">
            <h6 style="margin-bottom:15px;">Mid-Section Images</h6>
            <div class="form-grid">
                <div class="form-group">
                    <label>Consultation Image</label>
                    <input type="file" id="consultImg1File" class="form-control" accept="image/*">
                    <input type="hidden" id="consultImg1ToPass" value="${esc(data.consultImage1 || '')}">
                    ${data.consultImage1 ? `<img src="${esc(data.consultImage1)}" style="max-height:100px; margin-top:10px; border-radius:8px;">` : ''}
                </div>
                <div class="form-group">
                    <label>Technology Image</label>
                    <input type="file" id="consultImg2File" class="form-control" accept="image/*">
                    <input type="hidden" id="consultImg2ToPass" value="${esc(data.consultImage2 || '')}">
                    ${data.consultImage2 ? `<img src="${esc(data.consultImage2)}" style="max-height:100px; margin-top:10px; border-radius:8px;">` : ''}
                </div>
            </div>
        `;
    } catch(e) { handleError(e); }

    const list = document.getElementById('teamList');
    list.innerHTML = 'Loading Team...';
    try {
        const { data: snap, error } = await supabaseClient.from('team_members').select('*');
        if (error) throw error;
        currentTeam = snap || [];
        list.innerHTML = '';
        if(currentTeam.length === 0) list.innerHTML = '<p>No team members.</p>';

         currentTeam.forEach(t => {
             const div = document.createElement('div');
            div.className = 'products-table';
            div.style.padding = '15px';
            div.style.background = 'white';
             div.innerHTML = `
                <div style="text-align:center;">
                    <img src="../${esc(t.image || '')}" style="width:80px; height:80px; object-fit:cover; border-radius:50%; border:3px solid #eee;" onerror="this.src='https://via.placeholder.com/80'">
                    <h4 style="margin:10px 0 5px;">${escapeHTML(t.name)}</h4>
                    <p style="margin:0; color:#4CAF50;">${escapeHTML(t.role)}</p>
                    <div class="actions" style="justify-content:center; margin-top:15px;">
                        <button class="btn-icon" onclick="editTeam('${esc(String(t.id))}')"><i class='bx bx-edit-alt'></i></button>
                        <button class="btn-icon delete" onclick="deleteTeam('${esc(String(t.id))}')"><i class='bx bx-trash'></i></button>
                    </div>
                </div>
            `;
            list.appendChild(div);
        });
    }catch(e) { handleError(e); }
}

document.getElementById('saveConsultancyBtn').addEventListener('click', async () => {
    if (!document.getElementById('consTitle')) { alert('Please wait for the form to load.'); return; }
    const title = document.getElementById('consTitle').value;
    const subtitle = document.getElementById('consSubtitle').value;
    const description = document.getElementById('consDesc').value;
    const whyTitle = document.getElementById('consWhyTitle').value;
    const whyBody = document.getElementById('consWhyBody').value;
    const providesTitle = document.getElementById('consProvidesTitle').value;
    const providesBody = document.getElementById('consProvidesBody').value;
    const benefitsTitle = document.getElementById('consBenefitsTitle').value;
    const benefitsList = document.getElementById('consBenefitsList').value;
    const infoText = document.getElementById('consInfoText').value;
    const btn = document.getElementById('saveConsultancyBtn');

    btn.textContent = 'Saving...';
    btn.disabled = true;
    try {
        let consultImage1 = document.getElementById('consultImg1ToPass').value;
        let consultImage2 = document.getElementById('consultImg2ToPass').value;

        async function uploadConsultImg(inputId, folder) {
            const fileInput = document.getElementById(inputId);
            if (fileInput && fileInput.files.length > 0) {
                const file = fileInput.files[0];
                const filePath = `${folder}/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9_.-]/g, '')}`;
                const { error } = await supabaseClient.storage.from('images').upload(filePath, file);
                if (error) throw error;
                const { data: { publicUrl } } = supabaseClient.storage.from('images').getPublicUrl(filePath);
                return publicUrl;
            }
            return null;
        }

        const newImg1 = await uploadConsultImg('consultImg1File', 'consultancy');
        if (newImg1) consultImage1 = newImg1;
        const newImg2 = await uploadConsultImg('consultImg2File', 'consultancy');
        if (newImg2) consultImage2 = newImg2;

        const { error } = await supabaseClient.from('static_content').upsert({
            id: 'consultancy',
            data: {
                title, subtitle, description,
                whyTitle, whyBody,
                providesTitle, providesBody,
                benefitsTitle, benefitsList,
                infoText,
                consultImage1, consultImage2
            }
        });
        if (error) throw error;
        alert('Consultancy content saved!');
        loadConsultancy();
    } catch(e) { handleError(e); }
    finally { btn.innerHTML = '<i class="bx bx-save"></i> Save Texts'; btn.disabled = false; }
});

const teamModal = document.getElementById('teamModal');
const teamForm = document.getElementById('teamForm');

document.getElementById('addTeamBtn').addEventListener('click', () => {
    teamForm.reset();
    document.getElementById('teamId').value = '';
    document.getElementById('teamModalTitle').textContent = 'Add Team Member';
    teamModal.classList.add('active');
});

window.editTeam = (id) => {
    const t = currentTeam.find(i => i.id == id);
    if(!t) return;
    document.getElementById('teamId').value = id;
    document.getElementById('teamName').value = t.name;
    document.getElementById('teamRole').value = t.role;
    document.getElementById('teamPhone').value = t.phone;
    document.getElementById('teamEmail').value = t.email;
    document.getElementById('teamImage').value = t.image;
    document.getElementById('teamModalTitle').textContent = 'Edit Team Member';
    teamModal.classList.add('active');
};

window.deleteTeam = async(id) => {
    if(confirm('Delete member?')) await deleteGeneric('team_members', id, loadConsultancy);
};

teamForm.addEventListener('submit', async(e)=>{
    e.preventDefault();
    await handleFormSubmit(teamForm, 'team_members', 'teamId', () => ({
        name: document.getElementById('teamName').value,
        role: document.getElementById('teamRole').value,
        phone: document.getElementById('teamPhone').value,
        email: document.getElementById('teamEmail').value,
        image: document.getElementById('teamImage').value
    }), loadConsultancy, 'teamModal', 'teamImageFile', 'teamImage');
});

// ==========================================
// 6. CAREERS LOGIC
// ==========================================
async function loadCareers() {
    const list = document.getElementById('benefitsList');
    list.innerHTML = 'Loading Benefits...';
    try {
        const { data: snap, error } = await supabaseClient.from('career_benefits').select('*');
        if (error) throw error;

        currentBenefits = snap || [];
        list.style.display = 'grid';
        list.innerHTML = '';
        if(currentBenefits.length === 0) list.innerHTML = '<p>No benefits added.</p>';

         currentBenefits.forEach(b => {
             const div = document.createElement('div');
            div.className = 'products-table';
            div.style.padding = '15px';
            div.style.background = 'white';
             div.innerHTML = `
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <div style="display:flex; gap:10px; align-items:center;">
                        <i class="${esc(b.icon)}" style="font-size:24px; color:#4CAF50;"></i>
                        <div>
                            <strong>${escapeHTML(b.title)}</strong>
                            <p style="margin:0; color:#666; font-size:13px;">${escapeHTML(b.description)}</p>
                        </div>
                    </div>
                     <div class="actions">
                        <button class="btn-icon" onclick="editBenefit('${esc(String(b.id))}')"><i class='bx bx-edit-alt'></i></button>
                        <button class="btn-icon delete" onclick="deleteBenefit('${esc(String(b.id))}')"><i class='bx bx-trash'></i></button>
                    </div>
                </div>
            `;
            list.appendChild(div);
        });
    } catch(e) { handleError(e); }
}

const benefitModal = document.getElementById('benefitModal');
const benefitForm = document.getElementById('benefitForm');

document.getElementById('addBenefitBtn').addEventListener('click', () => {
    benefitForm.reset();
    document.getElementById('benefitId').value = '';
    document.getElementById('benefitModalTitle').textContent = 'Add Benefit';
    benefitModal.classList.add('active');
});

window.editBenefit = (id) => {
    const b = currentBenefits.find(i => i.id == id);
    if(!b) return;
    document.getElementById('benefitId').value = id;
    document.getElementById('benTitle').value = b.title;
    document.getElementById('benIcon').value = b.icon;
    document.getElementById('benDesc').value = b.description;
    document.getElementById('benefitModalTitle').textContent = 'Edit Benefit';
    benefitModal.classList.add('active');
};

window.deleteBenefit = async(id) => {
    if(confirm('Delete benefit?')) await deleteGeneric('career_benefits', id, loadCareers);
};

benefitForm.addEventListener('submit', async(e)=>{
    e.preventDefault();
    await handleFormSubmit(benefitForm, 'career_benefits', 'benefitId', () => ({
        title: document.getElementById('benTitle').value,
        icon: document.getElementById('benIcon').value,
        description: document.getElementById('benDesc').value
    }), loadCareers, 'benefitModal');
});

// ==========================================
// 7. CONTACT INFO LOGIC
// ==========================================
async function loadContact() {
    const container = document.getElementById('contactFormContainer');
    container.innerHTML = 'Loading...';
    try {
        const { data: row } = await supabaseClient.from('static_content').select('data').eq('id', 'contact').maybeSingle();
        const data = row ? row.data : {};
        
        container.innerHTML = `
            <form id="contactForm">
                <div class="form-grid" style="grid-template-columns: 1fr 1fr; gap:20px;">
                    <div class="form-group">
                        <label>Main Email</label>
                        <input type="email" id="contEmail" class="form-control" value="${esc(data.email || '')}">
                    </div>
                     <div class="form-group">
                        <label>Customer Care Phone</label>
                        <input type="text" id="contPhoneCC" class="form-control" value="${esc(data.phoneCustomerCare || '')}">
                    </div>
                     <div class="form-group">
                        <label>Head Office Phone</label>
                        <input type="text" id="contPhoneHO" class="form-control" value="${esc(data.phoneHeadOffice || '')}">
                    </div>
                     <div class="form-group">
                        <label>B2B Sales Phone</label>
                        <input type="text" id="contPhoneSales" class="form-control" value="${esc(data.phoneSales || '')}">
                    </div>
                     <div class="form-group">
                        <label>Address Line 1</label>
                        <input type="text" id="contAddr1" class="form-control" value="${esc(data.addressLine1 || '')}">
                    </div>
                     <div class="form-group">
                        <label>Address Line 2</label>
                        <input type="text" id="contAddr2" class="form-control" value="${esc(data.addressLine2 || '')}">
                    </div>
                     <div class="form-group">
                        <label>Facebook URL</label>
                        <input type="text" id="contFB" class="form-control" value="${esc(data.facebook || '')}">
                    </div>
                     <div class="form-group">
                        <label>Instagram URL</label>
                        <input type="text" id="contInsta" class="form-control" value="${esc(data.instagram || '')}">
                    </div>
                     <div class="form-group">
                        <label>YouTube URL</label>
                        <input type="text" id="contYT" class="form-control" value="${esc(data.youtube || '')}">
                    </div>
                     <div class="form-group">
                        <label>WhatsApp URL</label>
                        <input type="text" id="contWA" class="form-control" value="${esc(data.whatsapp || '')}">
                    </div>
                </div>
            </form>
        `;
    } catch(e) { handleError(e); }
}

document.getElementById('saveContactBtn').addEventListener('click', async () => {
    if (!document.getElementById('contEmail')) { alert('Please wait for the form to load.'); return; }
    const btn = document.getElementById('saveContactBtn');
    btn.textContent = 'Saving...';
    btn.disabled = true;

    const data = {
        email: document.getElementById('contEmail').value,
        phoneCustomerCare: document.getElementById('contPhoneCC').value,
        phoneHeadOffice: document.getElementById('contPhoneHO').value,
        phoneSales: document.getElementById('contPhoneSales').value,
        addressLine1: document.getElementById('contAddr1').value,
        addressLine2: document.getElementById('contAddr2').value,
        facebook: document.getElementById('contFB').value,
        instagram: document.getElementById('contInsta').value,
        youtube: document.getElementById('contYT').value,
        whatsapp: document.getElementById('contWA').value,
    };

    try {
        const { error } = await supabaseClient.from('static_content').upsert({ id: 'contact', data: data });
        if (error) throw error;
        alert('Contact Info saved!');
    } catch(e) { handleError(e); }
    finally { btn.textContent = 'Save Changes'; btn.innerHTML = '<i class="bx bx-save"></i> Save Changes'; btn.disabled = false; }
});

// ==========================================
// 8. BLOGS LOGIC
// ==========================================
async function loadBlogs() {
    const tableBody = document.getElementById('blogsGrid');
    const loadingState = document.getElementById('blogsLoadingState');
    const emptyState = document.getElementById('blogsEmptyState');

    loadingState.style.display = 'block';
    tableBody.innerHTML = '';
    emptyState.style.display = 'none';

    try {
        const { data: snapshot, error } = await supabaseClient.from('blogs').select('*').order('createdAt', { ascending: false });
        if (error) throw error;
        
        currentBlogs = snapshot || [];
        if (currentBlogs.length === 0) {
            loadingState.style.display = 'none';
            emptyState.style.display = 'block';
            return;
        }
        renderBlogsTable();
    } catch (error) {
        handleError(error);
    } finally {
        loadingState.style.display = 'none';
    }
}

function renderBlogsTable() {
    const grid = document.getElementById('blogsGrid');
    grid.innerHTML = '';
    currentBlogs.forEach(blog => {
        const imgSrc = blog.image
            ? (blog.image.startsWith('http') ? blog.image : '../' + blog.image)
            : 'https://via.placeholder.com/200';
        const videoTag = blog.youtubeUrl
            ? `<a href="${esc(safeUrl(blog.youtubeUrl))}" target="_blank" rel="noopener noreferrer" style="font-size:12px; color:#4CAF50;"><i class='bx bxl-youtube'></i> Watch Video</a>`
            : `<span style="font-size:12px; color:#94a3b8;">No Video</span>`;
        const card = document.createElement('div');
        card.className = 'admin-card';
        card.innerHTML = `
            <img src="${esc(imgSrc)}" class="admin-card-img" onerror="this.src='https://via.placeholder.com/200'" style="object-fit:cover;">
            <div class="admin-card-body">
                <h3>${escapeHTML(blog.title)}</h3>
                <p>${escapeHTML(blog.shortDesc ? blog.shortDesc.substring(0, 80) : '')}</p>
                ${videoTag}
            </div>
            <div class="admin-card-footer">
                <div class="actions">
                    <button class="btn-icon" onclick="editBlog('${esc(String(blog.id))}')"><i class='bx bx-edit-alt'></i></button>
                    <button class="btn-icon delete" onclick="deleteBlog('${esc(String(blog.id))}')"><i class='bx bx-trash'></i></button>
                </div>
            </div>
        `;
        grid.appendChild(card);
    });
}

const blogModal = document.getElementById('blogModal');
const blogForm = document.getElementById('blogForm');

if (document.getElementById('addBlogBtn')) {
    document.getElementById('addBlogBtn').addEventListener('click', () => {
        blogForm.reset();
        document.getElementById('blogId').value = '';
        document.getElementById('blogModalTitle').textContent = 'Add Blog';
        blogModal.classList.add('active');
    });
}

window.editBlog = (id) => {
    const b = currentBlogs.find(i => i.id == id);
    if (!b) return;
    document.getElementById('blogId').value = id;
    document.getElementById('blogTitle').value = b.title || '';
    document.getElementById('blogImageToPass').value = b.image || '';
    document.getElementById('blogYoutubeUrl').value = b.youtubeUrl || '';
    document.getElementById('blogShortDesc').value = b.shortDesc || '';
    document.getElementById('blogContent').value = b.content || '';
    document.getElementById('blogModalTitle').textContent = 'Edit Blog';
    blogModal.classList.add('active');
};

window.deleteBlog = async (id) => {
    if (confirm('Delete this blog post?')) await deleteGeneric('blogs', id, loadBlogs);
};

if (blogForm) {
    blogForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        await handleFormSubmit(blogForm, 'blogs', 'blogId', () => {
            const data = {
                title: document.getElementById('blogTitle').value,
                image: document.getElementById('blogImageToPass').value,
                youtubeUrl: document.getElementById('blogYoutubeUrl').value,
                shortDesc: document.getElementById('blogShortDesc').value,
                content: document.getElementById('blogContent').value
            };
            if (!document.getElementById('blogId').value) {
                data.createdAt = new Date().toISOString();
            }
            return data;
        }, loadBlogs, 'blogModal', 'blogImageFile', 'blogImageToPass');
    });
}


// ==========================================
// 9. CERTIFICATIONS LOGIC
// ==========================================
let currentCertifications = [];
async function loadCertifications() {
    const list = document.getElementById('certList');
    list.innerHTML = 'Loading...';
    try {
        const { data: snap, error } = await supabaseClient.from('certifications').select('*');
        if (error) throw error;
        currentCertifications = snap || [];
        list.innerHTML = '';
        if(currentCertifications.length === 0) list.innerHTML = '<p>No certifications added.</p>';

        currentCertifications.forEach(item => {
            const card = document.createElement('div');
            card.className = 'admin-card';
            card.innerHTML = `
                <img src="${esc(item.image || '')}" class="admin-card-img" style="object-fit:contain; padding:16px;" onerror="this.src='https://via.placeholder.com/200'">
                <div class="admin-card-footer">
                    <span style="font-size:13px; font-weight:600; color:#1e293b;">${escapeHTML(item.name)}</span>
                    <div class="actions">
                        <button class="btn-icon" onclick="editCert('${esc(String(item.id))}')"><i class='bx bx-edit-alt'></i></button>
                        <button class="btn-icon delete" onclick="deleteGeneric('certifications', '${esc(String(item.id))}', loadCertifications)"><i class='bx bx-trash'></i></button>
                    </div>
                </div>
            `;
            list.appendChild(card);
        });
    } catch(e) { handleError(e); }
}

const certModal = document.getElementById('certModal');
const certForm = document.getElementById('certForm');
if(document.getElementById('addCertBtn')) {
    document.getElementById('addCertBtn').addEventListener('click', () => {
        certForm.reset();
        document.getElementById('certId').value = '';
        document.getElementById('certImageToPass').value = '';
        document.getElementById('certModalTitle').textContent = 'Add Certification';
        certModal.classList.add('active');
    });
}
window.editCert = (id) => {
    const item = currentCertifications.find(i => i.id == id);
    if(!item) return;
    document.getElementById('certId').value = id;
    document.getElementById('certName').value = item.name;
    document.getElementById('certImageToPass').value = item.image;
    document.getElementById('certModalTitle').textContent = 'Edit Certification';
    certModal.classList.add('active');
};
if(certForm) {
    certForm.addEventListener('submit', async(e)=>{
        e.preventDefault();
        await handleFormSubmit(certForm, 'certifications', 'certId', () => ({
            name: document.getElementById('certName').value,
            image: document.getElementById('certImageToPass').value
        }), loadCertifications, 'certModal', 'certImageFile', 'certImageToPass');
    });
}

// ==========================================
// 10. RECOGNITIONS LOGIC
// ==========================================
let currentRecognitions = [];
async function loadRecognitions() {
    const list = document.getElementById('recogList');
    list.innerHTML = 'Loading...';
    try {
        const { data: snap, error } = await supabaseClient.from('recognitions').select('*');
        if (error) throw error;
        currentRecognitions = snap || [];
        list.innerHTML = '';
        if(currentRecognitions.length === 0) list.innerHTML = '<p>No recognitions added.</p>';

        currentRecognitions.forEach(item => {
            const card = document.createElement('div');
            card.className = 'admin-card';
            card.innerHTML = `
                <img src="${esc(item.image || '')}" class="admin-card-img" style="object-fit:contain; padding:16px;" onerror="this.src='https://via.placeholder.com/200'">
                <div class="admin-card-footer">
                    <span style="font-size:13px; font-weight:600; color:#1e293b;">${escapeHTML(item.name)}</span>
                    <div class="actions">
                        <button class="btn-icon" onclick="editRecog('${esc(String(item.id))}')"><i class='bx bx-edit-alt'></i></button>
                        <button class="btn-icon delete" onclick="deleteGeneric('recognitions', '${esc(String(item.id))}', loadRecognitions)"><i class='bx bx-trash'></i></button>
                    </div>
                </div>
            `;
            list.appendChild(card);
        });
    } catch(e) { handleError(e); }
}

const recogModal = document.getElementById('recogModal');
const recogForm = document.getElementById('recogForm');
if(document.getElementById('addRecogBtn')) {
    document.getElementById('addRecogBtn').addEventListener('click', () => {
        recogForm.reset();
        document.getElementById('recogId').value = '';
        document.getElementById('recogImageToPass').value = '';
        document.getElementById('recogModalTitle').textContent = 'Add Recognition';
        recogModal.classList.add('active');
    });
}
window.editRecog = (id) => {
    const item = currentRecognitions.find(i => i.id == id);
    if(!item) return;
    document.getElementById('recogId').value = id;
    document.getElementById('recogName').value = item.name;
    document.getElementById('recogImageToPass').value = item.image;
    document.getElementById('recogModalTitle').textContent = 'Edit Recognition';
    recogModal.classList.add('active');
};
if(recogForm) {
    recogForm.addEventListener('submit', async(e)=>{
        e.preventDefault();
        await handleFormSubmit(recogForm, 'recognitions', 'recogId', () => ({
            name: document.getElementById('recogName').value,
            image: document.getElementById('recogImageToPass').value
        }), loadRecognitions, 'recogModal', 'recogImageFile', 'recogImageToPass');
    });
}

// ==========================================
// 11. SITE SETTINGS LOGIC
// ==========================================
async function loadSiteSettings() {
    const container = document.getElementById('siteSettingsContainer');
    container.innerHTML = '<p>Loading...</p>';
    try {
        const { data: row } = await supabaseClient.from('static_content').select('data').eq('id', 'site_images').maybeSingle();
        const data = row ? row.data : {};
        
        container.innerHTML = `
            <form id="siteSettingsForm">
                <h6 style="margin-bottom:15px;">Hero Section Text</h6>
                <div class="form-grid">
                    <div class="form-group full-width">
                        <label>Headline (h1)</label>
                        <input type="text" id="heroHeadline" class="form-control" value="${esc(data.heroHeadline || '')}">
                    </div>
                    <div class="form-group full-width">
                        <label>Sub-headline (h2)</label>
                        <input type="text" id="heroSubheadline" class="form-control" value="${esc(data.heroSubheadline || '')}">
                    </div>
                    <div class="form-group">
                        <label>Feature 1</label>
                        <input type="text" id="heroFeature1" class="form-control" value="${esc(data.heroFeature1 || '')}">
                    </div>
                    <div class="form-group">
                        <label>Feature 2</label>
                        <input type="text" id="heroFeature2" class="form-control" value="${esc(data.heroFeature2 || '')}">
                    </div>
                    <div class="form-group">
                        <label>Feature 3</label>
                        <input type="text" id="heroFeature3" class="form-control" value="${esc(data.heroFeature3 || '')}">
                    </div>
                    <div class="form-group">
                        <label>Hero Logo Image</label>
                        <input type="file" id="heroLogoFile" class="form-control" accept="image/*">
                        <input type="hidden" id="heroLogoToPass" value="${esc(data.heroLogo || '')}">
                        ${data.heroLogo ? `<img src="${esc(data.heroLogo)}" style="max-height:80px; margin-top:10px;">` : ''}
                    </div>
                </div>
                <hr style="margin: 20px 0;">
                <h6 style="margin-bottom:15px;">Site Images</h6>
                <div class="form-grid">
                    <div class="form-group">
                        <label>Home Hero Tagline Image</label>
                        <input type="file" id="heroTaglineFile" class="form-control" accept="image/*">
                        <input type="hidden" id="heroTaglineToPass" value="${esc(data.heroTagline || '')}">
                        ${data.heroTagline ? `<img src="${esc(data.heroTagline)}" style="max-height:60px; margin-top:10px; background:#000;">` : ''}
                    </div>
                    <div class="form-group">
                        <label>Careers Hero Image</label>
                        <input type="file" id="careersHeroFile" class="form-control" accept="image/*">
                        <input type="hidden" id="careersHeroToPass" value="${esc(data.careersHero || '')}">
                        ${data.careersHero ? `<img src="${esc(data.careersHero)}" style="max-height:100px; margin-top:10px;">` : ''}
                    </div>
                </div>
            </form>
        `;
    } catch(e) { handleError(e); }
}

if (document.getElementById('saveSiteSettingsBtn')) {
    document.getElementById('saveSiteSettingsBtn').addEventListener('click', async () => {
        if (!document.getElementById('heroTaglineToPass')) { alert('Please wait for the form to load.'); return; }
        const btn = document.getElementById('saveSiteSettingsBtn');
        btn.textContent = 'Saving...';
        btn.disabled = true;

        try {
            let heroTaglineUrl = document.getElementById('heroTaglineToPass').value;
            let careersHeroUrl = document.getElementById('careersHeroToPass').value;
            let heroLogoUrl = document.getElementById('heroLogoToPass').value;

            const heroHeadline = document.getElementById('heroHeadline').value;
            const heroSubheadline = document.getElementById('heroSubheadline').value;
            const heroFeature1 = document.getElementById('heroFeature1').value;
            const heroFeature2 = document.getElementById('heroFeature2').value;
            const heroFeature3 = document.getElementById('heroFeature3').value;

            // Upload helper
            async function uploadSingleFile(inputId) {
                const fileInput = document.getElementById(inputId);
                if (fileInput && fileInput.files.length > 0) {
                    const file = fileInput.files[0];
                    const filePath = `site_images/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9_.-]/g, '')}`;
                    const { error } = await supabaseClient.storage.from('images').upload(filePath, file);
                    if (error) throw error;
                    const { data: { publicUrl } } = supabaseClient.storage.from('images').getPublicUrl(filePath);
                    return publicUrl;
                }
                return null;
            }

            const newHero = await uploadSingleFile('heroTaglineFile');
            if (newHero) heroTaglineUrl = newHero;

            const newCareers = await uploadSingleFile('careersHeroFile');
            if (newCareers) careersHeroUrl = newCareers;

            const newLogo = await uploadSingleFile('heroLogoFile');
            if (newLogo) heroLogoUrl = newLogo;

            const { error } = await supabaseClient.from('static_content').upsert({
                id: 'site_images',
                data: {
                    heroTagline: heroTaglineUrl,
                    careersHero: careersHeroUrl,
                    heroLogo: heroLogoUrl,
                    heroHeadline,
                    heroSubheadline,
                    heroFeature1,
                    heroFeature2,
                    heroFeature3
                }
            });
            if (error) throw error;

            alert('Site Settings Saved!');
            loadSiteSettings();
        } catch(e) { handleError(e); }
        finally {
            btn.innerHTML = "<i class='bx bx-save'></i> Save Settings";
            btn.disabled = false;
        }
    });
}

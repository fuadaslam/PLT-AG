// Check configuration
if (!window.firebaseConfig || window.firebaseConfig.apiKey === "YOUR_API_KEY") {
    alert("Please configure Firebase in assets/js/firebase-config.js first!");
    throw new Error("Firebase not configured");
}

// Initialize Firebase
if (!firebase.apps.length) {
    firebase.initializeApp(window.firebaseConfig);
}

const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();

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

// Auth Protection
auth.onAuthStateChanged(user => {
    if (!user) {
        window.location.href = 'login.html';
    } else {
        userEmailSpan.textContent = user.email;
        // Load initial view
        switchView('products');
    }
});

// Logout
logoutBtn.addEventListener('click', () => {
    auth.signOut();
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
    document.getElementById(`view-${viewName}`).style.display = 'block';

    // Load Data based on View
    if (viewName === 'products') loadProducts();
    else if (viewName === 'about') loadAbout();
    else if (viewName === 'core-values') loadCoreValues();
    else if (viewName === 'services') loadServices();
    else if (viewName === 'consultancy') loadConsultancy();
    else if (viewName === 'careers') loadCareers();
    else if (viewName === 'contact') loadContact();
}

// ==========================================
// 1. PRODUCTS LOGIC
// ==========================================
const productsTableBody = document.getElementById('productsTableBody');
const loadingState = document.getElementById('loadingState');
const emptyState = document.getElementById('emptyState');
const productModal = document.getElementById('productModal');
const productForm = document.getElementById('productForm');

async function loadProducts() {
    loadingState.style.display = 'block';
    productsTableBody.innerHTML = '';
    emptyState.style.display = 'none';

    try {
        const snapshot = await db.collection('products').get();
        currentProducts = [];
        if (snapshot.empty) {
            loadingState.style.display = 'none';
            emptyState.style.display = 'block';
            return;
        }
        snapshot.forEach(doc => currentProducts.push({ id: doc.id, ...doc.data() }));
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
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>
                <div class="product-cell">
                    <img src="../${product.imageToPass}" class="product-img" onerror="this.src='https://via.placeholder.com/48'">
                    <div class="product-info">
                        <h3>${product.head2}</h3>
                        <span>${product.text ? product.text.substring(0, 50) : ''}...</span>
                    </div>
                </div>
            </td>
            <td><span class="badge badge-${product.type}">${product.type}</span></td>
            <td>
                <div class="actions">
                    <button class="btn-icon" onclick="editProduct('${product.id}')"><i class='bx bx-edit-alt'></i></button>
                    <button class="btn-icon delete" onclick="deleteProduct('${product.id}')"><i class='bx bx-trash'></i></button>
                </div>
            </td>
        `;
        productsTableBody.appendChild(tr);
    });
}

// Add/Edit Product Handlers
document.getElementById('addProductBtn').addEventListener('click', () => {
    productForm.reset();
    document.getElementById('productId').value = '';
    document.getElementById('modalTitle').textContent = 'Add Product';
    productModal.classList.add('active');
});

window.editProduct = (id) => {
    const product = currentProducts.find(p => p.id === id);
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
        await db.collection('products').doc(id).delete();
        loadProducts();
    }
};

productForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    await handleFormSubmit(productForm, 'products', 'productId', () => {
        return {
            head2: document.getElementById('head2').value,
            type: document.getElementById('type').value,
            imageToPass: document.getElementById('imageToPass').value, // Logic handles upload separately
            text: document.getElementById('text').value,
            head: document.getElementById('head').value,
            points: document.getElementById('points').value
        };
    }, loadProducts, 'productModal', 'imageFile', 'imageToPass');
});

// Seed Data
document.getElementById('seedDataBtn').addEventListener('click', async () => {
    // Check if we are in "products" view or if we want to seed everything
    if (!confirm("This will overwrite existing data in Firestore. Continue?")) return;
    
    const btn = document.getElementById('seedDataBtn');
    btn.disabled = true;
    btn.textContent = "Seeding...";
    const batch = db.batch();

    try {
        // 1. Seed Products (from products-data.js)
        if (window.productsData) {
           // We won't delete all explicitly to save reads/writes, but batch set new IDs
           // Ideally we should wipe collection but that is expensive.
           // For now, let's just add/overwrite if we knew IDs. Since we don't, we add new ones.
           // To avoid duplicates, user should clear manually or we implement clear.
           // Let's just add for now as requested.
           
           // Actually, let's use the new site-data structure for consistency if we wanted, 
           // but `productsData` is separate. Let's keep products as is.
           window.productsData.forEach(p => {
                const docRef = db.collection('products').doc();
                batch.set(docRef, p);
           });
        }

        // 2. Seed Site Data (from site-data.js)
        if (window.initialSiteData) {
            const d = window.initialSiteData;
            
            // About
            batch.set(db.collection('content').doc('about'), d.about);
            
            // Consultancy Text
            batch.set(db.collection('content').doc('consultancy'), d.consultancy);

            // Contact Info
            if(d.contact) {
                batch.set(db.collection('content').doc('contact'), d.contact);
            }

            // Contact Info
            if(d.contact) {
                batch.set(db.collection('content').doc('contact'), d.contact);
            }
            
            // Core Values - Add individually
            d.coreValues.forEach(v => {
                const ref = db.collection('core_values').doc();
                batch.set(ref, v);
            });

            // Services
            d.services.forEach(s => {
                const ref = db.collection('services').doc();
                batch.set(ref, s);
            });

             // Team
            d.team.forEach(t => {
                const ref = db.collection('team_members').doc();
                batch.set(ref, t);
            });

             // Benefits
            d.benefits.forEach(b => {
                const ref = db.collection('career_benefits').doc();
                batch.set(ref, b);
            });
        }

        await batch.commit();
        alert("All content seeded successfully!");
        
        // Reload current view
        const currentV = currentView; // stored global
        switchView(currentV);

    } catch(e) { console.error(e); alert(e.message); }
    finally { btn.textContent = "Initialize Data"; btn.disabled = false; }
});

// ==========================================
// 2. ABOUT US LOGIC
// ==========================================
// We will simply build a form dynamically for the single 'about' doc
async function loadAbout() {
    const container = document.getElementById('aboutFormContainer');
    container.innerHTML = '<p>Loading...</p>';
    
    try {
        const doc = await db.collection('content').doc('about').get();
        const data = doc.exists ? doc.data() : {
            title: 'ABOUT US',
            subtitle: 'Redefining Agricultural Excellence',
            description: '',
            features: [] // We could manage features here or in a separate collection. Let's keep it simple for now as text fields.
        };

        // Simple Form Generation
        container.innerHTML = `
            <form id="aboutForm">
                <div class="form-group">
                    <label>Main Title</label>
                    <input type="text" id="aboutTitle" class="form-control" value="${data.title || ''}">
                </div>
                <div class="form-group">
                    <label>Subtitle</label>
                    <input type="text" id="aboutSubtitle" class="form-control" value="${data.subtitle || ''}">
                </div>
                 <div class="form-group">
                    <label>Description (Main Text)</label>
                    <textarea id="aboutDesc" class="form-control" rows="6">${data.description || ''}</textarea>
                </div>
                <!-- Extend with more fields as needed -->
            </form>
        `;
    } catch (e) { handleError(e); }
}

document.getElementById('saveAboutBtn').addEventListener('click', async () => {
    const title = document.getElementById('aboutTitle').value;
    const subtitle = document.getElementById('aboutSubtitle').value;
    const description = document.getElementById('aboutDesc').value;
    const btn = document.getElementById('saveAboutBtn');

    btn.textContent = 'Saving...';
    btn.disabled = true;
    try {
        await db.collection('content').doc('about').set({
            title, subtitle, description
        }, { merge: true });
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
        const snap = await db.collection('core_values').get();
        currentCoreValues = [];
        snap.forEach(doc => currentCoreValues.push({ id: doc.id, ...doc.data() }));
        
        list.style.display = 'grid'; // ensure grid
        list.innerHTML = '';
        if(currentCoreValues.length === 0) list.innerHTML = '<p>No values added.</p>';

        currentCoreValues.forEach(val => {
            const div = document.createElement('div');
            div.className = 'products-table'; // reuse style container
            div.style.padding = '15px';
            div.style.background = 'white';
            div.style.marginBottom = '10px';
            div.innerHTML = `
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <div style="display:flex; gap:10px; align-items:center;">
                        <i class="${val.icon}" style="font-size:24px; color:#4CAF50;"></i>
                        <div>
                            <strong>${val.title}</strong>
                            <p style="margin:0; color:#666; font-size:13px;">${val.description}</p>
                        </div>
                    </div>
                     <div class="actions">
                        <button class="btn-icon" onclick="editCoreValue('${val.id}')"><i class='bx bx-edit-alt'></i></button>
                        <button class="btn-icon delete" onclick="deleteCoreValue('${val.id}')"><i class='bx bx-trash'></i></button>
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
    const val = currentCoreValues.find(i => i.id === id);
    if(!val) return;
    document.getElementById('coreValueId').value = id;
    document.getElementById('cvTitle').value = val.title;
    document.getElementById('cvIcon').value = val.icon;
    document.getElementById('cvDesc').value = val.description;
    document.getElementById('coreValueModalTitle').textContent = 'Edit Core Value';
    coreValueModal.classList.add('active');
};

window.deleteCoreValue = async(id) => {
    if(confirm('Delete this value?')) {
        await db.collection('core_values').doc(id).delete();
        loadCoreValues();
    }
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
        const snap = await db.collection('services').get();
        currentServices = [];
        snap.forEach(doc => currentServices.push({ id: doc.id, ...doc.data() }));
        list.innerHTML = '';
        if(currentServices.length === 0) list.innerHTML = '<p>No services added.</p>';

        currentServices.forEach(s => {
             const div = document.createElement('div');
            div.className = 'products-table';
            div.style.padding = '15px';
            div.style.background = 'white';
            div.style.marginBottom = '10px';
             div.innerHTML = `
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <div style="display:flex; gap:10px; align-items:center;">
                        <img src="../${s.image}" style="width:50px; height:50px; object-fit:cover; border-radius:4px;" onerror="this.src='https://via.placeholder.com/50'">
                        <div>
                            <strong>${s.number} - ${s.title}</strong>
                            <p style="margin:0; color:#666; font-size:13px;">${s.description.substring(0,60)}...</p>
                        </div>
                    </div>
                     <div class="actions">
                        <button class="btn-icon" onclick="editService('${s.id}')"><i class='bx bx-edit-alt'></i></button>
                        <button class="btn-icon delete" onclick="deleteService('${s.id}')"><i class='bx bx-trash'></i></button>
                    </div>
                </div>
            `;
            list.appendChild(div);
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
    const s = currentServices.find(i => i.id === id);
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
    if(confirm('Delete service?')) {
        await db.collection('services').doc(id).delete();
        loadServices();
    }
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
    // 1. Load Text Content
     const container = document.getElementById('consultancyFormContainer');
     try {
        const doc = await db.collection('content').doc('consultancy').get();
        const data = doc.exists ? doc.data() : {};
        container.innerHTML = `
            <div class="form-grid">
                <div class="form-group">
                    <label>Hero Title</label>
                    <input type="text" id="consTitle" class="form-control" value="${data.title || ''}">
                </div>
                <div class="form-group">
                    <label>Hero Subtitle</label>
                    <input type="text" id="consSubtitle" class="form-control" value="${data.subtitle || ''}">
                </div>
                <div class="form-group full-width">
                     <label>Hero Description</label>
                     <textarea id="consDesc" class="form-control" rows="2">${data.description || ''}</textarea>
                </div>
            </div>
        `;
    } catch(e) { handleError(e); }

    // 2. Load Team
    const list = document.getElementById('teamList');
    list.innerHTML = 'Loading Team...';
    try {
        const snap = await db.collection('team_members').get();
        currentTeam = [];
        snap.forEach(doc => currentTeam.push({ id: doc.id, ...doc.data() }));
        list.innerHTML = '';
        if(currentTeam.length === 0) list.innerHTML = '<p>No team members.</p>';

         currentTeam.forEach(t => {
             const div = document.createElement('div');
            div.className = 'products-table';
            div.style.padding = '15px';
            div.style.background = 'white';
             div.innerHTML = `
                <div style="text-align:center;">
                    <img src="../${t.image}" style="width:80px; height:80px; object-fit:cover; border-radius:50%; border:3px solid #eee;" onerror="this.src='https://via.placeholder.com/80'">
                    <h4 style="margin:10px 0 5px;">${t.name}</h4>
                    <p style="margin:0; color:#4CAF50;">${t.role}</p>
                    <div class="actions" style="justify-content:center; margin-top:15px;">
                        <button class="btn-icon" onclick="editTeam('${t.id}')"><i class='bx bx-edit-alt'></i></button>
                        <button class="btn-icon delete" onclick="deleteTeam('${t.id}')"><i class='bx bx-trash'></i></button>
                    </div>
                </div>
            `;
            list.appendChild(div);
        });

    }catch(e) { handleError(e); }
}

document.getElementById('saveConsultancyBtn').addEventListener('click', async () => {
    const title = document.getElementById('consTitle').value;
    const subtitle = document.getElementById('consSubtitle').value;
    const description = document.getElementById('consDesc').value;
    const btn = document.getElementById('saveConsultancyBtn');
    
    btn.textContent = 'Saving...';
    btn.disabled = true;
    try {
        await db.collection('content').doc('consultancy').set({
            title, subtitle, description
        }, { merge: true });
        alert('Consultancy text saved!');
    } catch(e) { handleError(e); }
    finally { btn.textContent = 'Save Texts'; btn.innerHTML = '<i class="bx bx-save"></i> Save Texts'; btn.disabled = false; }
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
    const t = currentTeam.find(i => i.id === id);
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
        const snap = await db.collection('career_benefits').get();
        currentBenefits = [];
        snap.forEach(doc => currentBenefits.push({ id: doc.id, ...doc.data() }));
        list.style.display = 'grid'; // ensure
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
                        <i class="${b.icon}" style="font-size:24px; color:#4CAF50;"></i>
                        <div>
                            <strong>${b.title}</strong>
                            <p style="margin:0; color:#666; font-size:13px;">${b.description}</p>
                        </div>
                    </div>
                     <div class="actions">
                        <button class="btn-icon" onclick="editBenefit('${b.id}')"><i class='bx bx-edit-alt'></i></button>
                        <button class="btn-icon delete" onclick="deleteBenefit('${b.id}')"><i class='bx bx-trash'></i></button>
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
    const b = currentBenefits.find(i => i.id === id);
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
        const doc = await db.collection('content').doc('contact').get();
        const data = doc.exists ? doc.data() : {};
        
        container.innerHTML = `
            <form id="contactForm">
                <div class="form-grid" style="grid-template-columns: 1fr 1fr; gap:20px;">
                    <div class="form-group">
                        <label>Main Email</label>
                        <input type="email" id="contEmail" class="form-control" value="${data.email || ''}">
                    </div>
                     <div class="form-group">
                        <label>Customer Care Phone</label>
                        <input type="text" id="contPhoneCC" class="form-control" value="${data.phoneCustomerCare || ''}">
                    </div>
                     <div class="form-group">
                        <label>Head Office Phone</label>
                        <input type="text" id="contPhoneHO" class="form-control" value="${data.phoneHeadOffice || ''}">
                    </div>
                     <div class="form-group">
                        <label>B2B Sales Phone</label>
                        <input type="text" id="contPhoneSales" class="form-control" value="${data.phoneSales || ''}">
                    </div>
                     <div class="form-group">
                        <label>Address Line 1</label>
                        <input type="text" id="contAddr1" class="form-control" value="${data.addressLine1 || ''}">
                    </div>
                     <div class="form-group">
                        <label>Address Line 2</label>
                        <input type="text" id="contAddr2" class="form-control" value="${data.addressLine2 || ''}">
                    </div>
                     <div class="form-group">
                        <label>Facebook URL</label>
                        <input type="text" id="contFB" class="form-control" value="${data.facebook || ''}">
                    </div>
                     <div class="form-group">
                        <label>Instagram URL</label>
                        <input type="text" id="contInsta" class="form-control" value="${data.instagram || ''}">
                    </div>
                     <div class="form-group">
                        <label>YouTube URL</label>
                        <input type="text" id="contYT" class="form-control" value="${data.youtube || ''}">
                    </div>
                     <div class="form-group">
                        <label>WhatsApp URL</label>
                        <input type="text" id="contWA" class="form-control" value="${data.whatsapp || ''}">
                    </div>
                </div>
            </form>
        `;
    } catch(e) { handleError(e); }
}

document.getElementById('saveContactBtn').addEventListener('click', async () => {
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
        await db.collection('content').doc('contact').set(data, { merge: true });
        alert('Contact Info saved!');
    } catch(e) { handleError(e); }
    finally { btn.textContent = 'Save Changes'; btn.innerHTML = '<i class="bx bx-save"></i> Save Changes'; btn.disabled = false; }
});

// ==========================================
// HELPERS
// ==========================================

async function deleteGeneric(collection, id, reloadFn) {
    try {
        await db.collection(collection).doc(id).delete();
        reloadFn();
    } catch(e) { handleError(e); }
}

// Universal Form Submit Handler with optional Image Upload
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
             const ref = storage.ref(`${collection}/${Date.now()}_${file.name}`);
             await ref.put(file);
             const url = await ref.getDownloadURL();
             // set the url to the hidden or text input
             document.getElementById(urlInputId).value = url;
        }

        const data = getDataFn();
        
        btn.textContent = 'Saving...';
        if (id) {
            await db.collection(collection).doc(id).update(data);
        } else {
            await db.collection(collection).add(data);
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
    if (error.code === 'permission-denied') {
        alert("Permission Denied: Update Firebase Firestore Rules to allow read/write.");
    } else if (error.code === 'storage/unauthorized') {
        alert("Storage Permission Denied: Update Firebase Storage Rules.");
    } else {
        alert("Error: " + error.message);
    }
}

// Modal Closers
document.querySelectorAll('.close-modal').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.modal').forEach(m => m.classList.remove('active'));
    });
});

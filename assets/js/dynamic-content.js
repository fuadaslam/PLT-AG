function esc(s) {
    return (s == null ? '' : String(s))
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function safeUrl(url) {
    if (!url) return '#';
    try {
        const u = new URL(url);
        return (u.protocol === 'https:' || u.protocol === 'http:') ? url : '#';
    } catch(e) { return '#'; }
}

if (typeof supabaseClient !== 'undefined') {

    document.addEventListener('DOMContentLoaded', () => {
        // 1. Index Page
        if (document.getElementById('about')) {
            loadSiteSettings();
            loadAboutUs();
            loadCoreValues();
            loadServices();
            loadCertifications();
            loadRecognitions();
            loadGallery();
            loadCustomerReviews();
        }

        // 2. Consultancy Page
        if (document.getElementById('consultancy')) {
            loadConsultancyPage();
        }

        // 3. Careers Page
        if (document.querySelector('.careers-page-enhanced')) {
            loadCareersPage();
        }
        // 4. Contact Info (Runs everywhere for Footer)
        loadContactInfo();

        // 5. Products Page & Description Page
        if (document.querySelector('.products-page-enhanced') || document.querySelector('.description-page')) {
            loadProductsData();
        }
    });

    // --- About Us ---
    async function loadAboutUs() {
        try {
            const { data: row, error } = await supabaseClient.from('static_content').select('data').eq('id', 'about').maybeSingle();
            if (error || !row || !row.data) return; 
            const data = row.data;

            const sectionTitle = document.querySelector('#about .section-title h2');
            const sectionSubtitle = document.querySelector('#about .section-title p');
            const aboutDesc = document.querySelector('.about-description');

            if (sectionTitle && data.title) sectionTitle.textContent = data.title;
            if (sectionSubtitle && data.subtitle) sectionSubtitle.textContent = data.subtitle;
            
            if (aboutDesc && data.description) {
                const paragraphs = data.description.split('\n').filter(p => p.trim() !== '');
                aboutDesc.innerHTML = paragraphs.map(p => `<p>${esc(p)}</p>`).join('');
            }
            
            if (data.image) {
                const img = document.querySelector('.about-main-image img') || document.querySelector('.about-image-section img');
                if (img) img.src = data.image;
            }
        } catch (e) {
            console.error("Error loading About Us:", e);
        }
    }

    // --- Core Values ---
    async function loadCoreValues() {
        const container = document.querySelector('.our-values-section .row');
        if (!container) return;

        try {
            const { data: snap, error } = await supabaseClient.from('core_values').select('*');
            if (error || !snap || snap.length === 0) return;

            container.innerHTML = ''; // Clear default
            snap.forEach(val => {
                const div = document.createElement('div');
                div.className = 'col-lg-3 col-md-6 col-sm-6';
                div.setAttribute('data-aos', 'flip-left');
                div.innerHTML = `
                    <div class="value-card">
                        <div class="value-icon-wrapper">
                            <i class="${esc(val.icon)}"></i>
                        </div>
                        <h4>${esc(val.title)}</h4>
                        <p>${esc(val.description)}</p>
                    </div>
                `;
                container.appendChild(div);
            });
        } catch (e) { console.error("Error loading values:", e); }
    }

    // --- Services (Index) ---
    async function loadServices() {
        const container = document.querySelector('.services-grid');
        if (!container) return;

        try {
            const { data: services, error } = await supabaseClient.from('services').select('*').order('number', { ascending: true });
            
            if (error || !services) return;

            if (services.length > 0) {
                container.innerHTML = '';
                services.forEach(s => {
                    const div = document.createElement('div');
                    div.className = 'service-card';
                    div.setAttribute('data-aos', 'zoom-in');
                    div.innerHTML = `
                        <div class="service-image-wrapper">
                            <img src="${esc(s.image || 'assets/img/ferlilizer.jpg')}" alt="${esc(s.title)}" class="service-image" onerror="this.src='assets/img/ferlilizer.jpg'"/>
                            <div class="service-overlay">
                                <i class="${esc(s.icon)}"></i>
                            </div>
                        </div>
                        <div class="service-content">
                            <div class="service-number">${esc(s.number || '')}</div>
                            <h4>${esc(s.title)}</h4>
                            <p>${esc(s.description)}</p>
                            <div class="service-link">
                                <a href="#"><i class="icofont-arrow-right"></i> Learn More</a>
                            </div>
                        </div>
                    `;
                    container.appendChild(div);
                });
            }
        } catch(e) { console.error("Error services:", e); }
    }

    // --- Consultancy Page ---
    async function loadConsultancyPage() {
        // Text + Images
        try {
            const { data: row, error } = await supabaseClient.from('static_content').select('data').eq('id', 'consultancy').maybeSingle();
            if (row && row.data) {
                const data = row.data;
                const title = document.querySelector('.consultancy-hero h1');
                const sub = document.querySelector('.consultancy-hero .subtitle');
                const desc = document.querySelector('.consultancy-hero .description');

                if (title && data.title) title.textContent = data.title;
                if (sub && data.subtitle) sub.textContent = data.subtitle;
                if (desc && data.description) desc.textContent = data.description;

                // Mid-section images
                if (data.consultImage1) {
                    const img1 = document.getElementById('consult-img-1');
                    if (img1) img1.src = data.consultImage1;
                }
                if (data.consultImage2) {
                    const img2 = document.getElementById('consult-img-2');
                    if (img2) img2.src = data.consultImage2;
                }

                // "Why Our Agro Advisory?" card
                const whyCard = document.getElementById('consult-why-card');
                if (whyCard) {
                    if (data.whyTitle) whyCard.querySelector('h3').textContent = data.whyTitle;
                    if (data.whyBody) {
                        const paras = data.whyBody.split('\n').filter(p => p.trim());
                        const existing = whyCard.querySelectorAll('p');
                        existing.forEach(p => p.remove());
                        paras.forEach(text => {
                            const p = document.createElement('p');
                            p.textContent = text.trim();
                            whyCard.appendChild(p);
                        });
                    }
                }

                // "What PLT-AG Provides" card
                const providesCard = document.getElementById('consult-provides-card');
                if (providesCard) {
                    if (data.providesTitle) providesCard.querySelector('h3').textContent = data.providesTitle;
                    if (data.providesBody) {
                        const paras = data.providesBody.split('\n').filter(p => p.trim());
                        const existing = providesCard.querySelectorAll('p');
                        existing.forEach(p => p.remove());
                        paras.forEach(text => {
                            const p = document.createElement('p');
                            p.textContent = text.trim();
                            providesCard.appendChild(p);
                        });
                    }
                }

                // "What Agro Advisory Has For You" card
                const benefitsCard = document.getElementById('consult-benefits-card');
                if (benefitsCard) {
                    if (data.benefitsTitle) benefitsCard.querySelector('h3').textContent = data.benefitsTitle;
                    if (data.benefitsList) {
                        const items = data.benefitsList.split('\n').filter(i => i.trim());
                        const ul = benefitsCard.querySelector('ul');
                        if (ul) {
                            ul.innerHTML = '';
                            items.forEach(text => {
                                const li = document.createElement('li');
                                li.textContent = text.trim();
                                ul.appendChild(li);
                            });
                        }
                    }
                }

                // Info box
                if (data.infoText) {
                    const infoBox = document.getElementById('consult-info-box');
                    if (infoBox) {
                        const p = infoBox.querySelector('p');
                        if (p) {
                            const icon = p.querySelector('i');
                            p.textContent = data.infoText;
                            if (icon) p.prepend(icon);
                        }
                    }
                }
            }
        } catch(e) { console.error(e); }

        // Team
        const container = document.querySelector('.team-section .row');
        if (container) {
             try {
                const { data: snap, error } = await supabaseClient.from('team_members').select('*');
                if (snap && snap.length > 0) {
                    container.innerHTML = '';
                    snap.forEach(t => {
                        const div = document.createElement('div');
                        div.className = 'col-lg-4 col-md-6 col-sm-12';
                        div.setAttribute('data-aos', 'zoom-in');
                        div.innerHTML = `
                            <div class="team-card">
                                <div class="team-member-image">
                                    <img src="${esc(t.image)}" alt="${esc(t.name)}" onerror="this.src='assets/img/pltashiq.jpeg'"/>
                                </div>
                                <div class="team-info">
                                    <h6>${esc(t.name)}</h6>
                                    <p>${esc(t.role)}</p>
                                    <a href="tel:${esc(t.phone || '')}">
                                        <i class="bx bx-phone"></i>${esc(t.phone || '')}
                                    </a>
                                    <a href="mailto:${esc(t.email || '')}">
                                        <i class="bx bx-envelope"></i>${esc(t.email || '')}
                                    </a>
                                </div>
                            </div>
                        `;
                        container.appendChild(div);
                    });
                }
             } catch(e) { console.error(e); }
        }
    }

    // --- Careers Page ---
    async function loadCareersPage() {
        // Load hero image
        try {
            const { data: row } = await supabaseClient.from('static_content').select('data').eq('id', 'site_images').maybeSingle();
            if (row && row.data && row.data.careersHero) {
                const heroImg = document.querySelector('.careers-hero-img img, .careers-hero img');
                if (heroImg) { heroImg.src = row.data.careersHero; }
                else {
                    const img = document.querySelector('img[src*="hire.jpeg"]');
                    if(img) img.src = row.data.careersHero;
                }
            }
        } catch(e) { console.error(e); }

        const container = document.querySelector('.benefits-grid');
        if(!container) return;

        try {
             const { data: snap, error } = await supabaseClient.from('career_benefits').select('*');
             if(snap && snap.length > 0) {
                 container.innerHTML = '';
                 snap.forEach(b => {
                     const div = document.createElement('div');
                     div.className = 'benefit-card';
                     div.setAttribute('data-aos', 'fade-up');
                     div.innerHTML = `
                        <div class="benefit-icon">
                            <i class="${esc(b.icon)}"></i>
                        </div>
                        <h3>${esc(b.title)}</h3>
                        <p>${esc(b.description)}</p>
                     `;
                     container.appendChild(div);
                 });
             }
        } catch(e) { console.error(e); }
    }

    // --- Contact Info (Footer & Contact Page) ---
    async function loadContactInfo() {
        try {
            const { data: row, error } = await supabaseClient.from('static_content').select('data').eq('id', 'contact').maybeSingle();
            if (error || !row || !row.data) return;
            const data = row.data;

            // 1. Footer Updates
            if(data.addressLine2) {
                const addrP = document.querySelector('#footer .footer-contact-info .contact-item:nth-child(1) p');
                if(addrP) {
                    addrP.innerHTML = '';
                    addrP.appendChild(document.createTextNode(data.addressLine1 || ''));
                    addrP.appendChild(document.createElement('br'));
                    addrP.appendChild(document.createTextNode(data.addressLine2));
                }
            }

            if(data.email) {
                const emailLink = document.querySelector('#footer .footer-contact-info .contact-item:nth-child(2) a');
                if(emailLink) {
                    emailLink.href = `mailto:${data.email}`;
                    emailLink.textContent = data.email;
                }
                const mobileEmail = document.querySelector('.mobile-contact-info p:nth-child(2)');
                if(mobileEmail) {
                    mobileEmail.innerHTML = '<i class="bx bx-envelope"></i> ';
                    mobileEmail.appendChild(document.createTextNode(data.email));
                }
            }

            if(data.phoneHeadOffice) {
                const phoneHO = document.querySelector('.footer-contact .contact-item:nth-child(1) a');
                if(phoneHO) {
                    phoneHO.href = `tel:${data.phoneHeadOffice.replace(/\D/g,'')}`;
                    phoneHO.textContent = data.phoneHeadOffice;
                }
            }

            if(data.phoneCustomerCare) {
                const phoneCC = document.querySelector('.footer-contact .contact-item:nth-child(2) a');
                if(phoneCC) {
                    phoneCC.href = `tel:${data.phoneCustomerCare.replace(/\D/g,'')}`;
                    phoneCC.textContent = data.phoneCustomerCare;
                }
                const mobilePhone = document.querySelector('.mobile-contact-info p:nth-child(1)');
                if(mobilePhone) {
                    mobilePhone.innerHTML = '<i class="bx bx-phone"></i> ';
                    mobilePhone.appendChild(document.createTextNode(data.phoneCustomerCare));
                }
            }

            if(data.phoneSales) {
                const phoneSales = document.querySelector('.footer-contact .contact-item:nth-child(3) a');
                if(phoneSales) {
                    phoneSales.href = `tel:${data.phoneSales.replace(/\D/g,'')}`;
                    phoneSales.textContent = data.phoneSales;
                }
            }

            // Social Links (Footer) — safeUrl() blocks javascript: URIs
            if(data.facebook) {
                document.querySelectorAll('a.facebook').forEach(a => a.href = safeUrl(data.facebook));
            }
            if(data.instagram) {
                document.querySelectorAll('a.instagram').forEach(a => a.href = safeUrl(data.instagram));
            }
            if(data.youtube) {
                document.querySelectorAll('a.youtube').forEach(a => a.href = safeUrl(data.youtube));
            }
            if(data.whatsapp) {
                document.querySelectorAll('a.whatsapp').forEach(a => a.href = safeUrl(data.whatsapp));
                // Floating WhatsApp button (hardcoded in HTML across all pages)
                document.querySelectorAll('#floating-whatsapp a').forEach(a => a.href = safeUrl(data.whatsapp));
            }

            // 2. Contact Page Specifics
            if(document.querySelector('.contact-page-enhanced')) {
                // Call Us Card (assumes specific structure)
                const callCard = document.querySelector('.contact-info-card-enhanced:nth-child(1)');
                if(callCard && data.phoneCustomerCare) {
                     const detailPs = callCard.querySelectorAll('.info-detail a');
                     if(detailPs.length >= 2) {
                         if(data.phoneCustomerCare) {
                            detailPs[0].href = `tel:${data.phoneCustomerCare.replace(/\D/g,'')}`;
                            detailPs[0].textContent = data.phoneCustomerCare;
                         }
                         if(data.phoneHeadOffice) {
                             detailPs[1].href = `tel:${data.phoneHeadOffice.replace(/\D/g,'')}`;
                             detailPs[1].textContent = data.phoneHeadOffice;
                         }
                     }
                }

                // Email Card
                const emailCard = document.querySelector('.contact-info-card-enhanced:nth-child(2)');
                if(emailCard && data.email) {
                    const emailA = emailCard.querySelector('.info-detail a');
                    if(emailA) {
                        emailA.href = `mailto:${data.email}`;
                        emailA.textContent = data.email;
                    }
                }

                // Visit Us Card
                const visitCard = document.querySelector('.contact-info-card-enhanced:nth-child(3)');
                if(visitCard) {
                     const details = visitCard.querySelectorAll('.info-detail');
                     if(details.length >= 2) {
                         if(data.addressLine1) details[0].textContent = data.addressLine1;
                         if(data.addressLine2) details[1].textContent = data.addressLine2;
                     }
                }
            }

        } catch(e) { console.error("Error loading contact info:", e); }
    }

    // --- Site Settings (Global) ---
    async function loadSiteSettings() {
        try {
            const { data: row } = await supabaseClient.from('static_content').select('data').eq('id', 'site_images').maybeSingle();
            if (!row || !row.data) return;
            const d = row.data;

            if (d.heroTagline) {
                const tagImg = document.querySelector('.hero-tagline');
                if (tagImg) tagImg.src = d.heroTagline;
            }

            // Hero section text
            const h1 = document.querySelector('#hero h1');
            const h2 = document.querySelector('#hero h2');
            if (h1 && d.heroHeadline) h1.textContent = d.heroHeadline;
            if (h2 && d.heroSubheadline) h2.textContent = d.heroSubheadline;

            const featureSpans = document.querySelectorAll('.hero-feature-item span');
            if (featureSpans[0] && d.heroFeature1) featureSpans[0].textContent = d.heroFeature1;
            if (featureSpans[1] && d.heroFeature2) featureSpans[1].textContent = d.heroFeature2;
            if (featureSpans[2] && d.heroFeature3) featureSpans[2].textContent = d.heroFeature3;

            if (d.heroLogo) {
                const logoImg = document.querySelector('.hero-logo');
                if (logoImg) logoImg.src = d.heroLogo;
            }
        } catch(e) { console.error("Error loading site settings:", e); }
    }

    // --- Certifications ---
    async function loadCertifications() {
        const container = document.querySelector('.certifications-grid');
        if (!container) return;

        try {
            const { data: snap, error } = await supabaseClient.from('certifications').select('*');
            if (error || !snap || snap.length === 0) return;

            container.innerHTML = '';
            snap.forEach((cert, idx) => {
                const delay = (idx + 1) * 100;
                const div = document.createElement('div');
                div.className = 'certification-card';
                div.setAttribute('data-aos', 'flip-left');
                div.setAttribute('data-aos-delay', delay.toString());
                div.innerHTML = `
                    <div class="certification-badge">
                        <i class="icofont-ui-rating"></i>
                    </div>
                    <div class="certification-image-wrapper">
                        <img src="${esc(cert.image)}" alt="${esc(cert.name)}" class="certification-image">
                        <div class="certification-hover-overlay">
                            <div class="overlay-content">
                                <i class="icofont-eye"></i>
                                <span>View Certificate</span>
                            </div>
                        </div>
                    </div>
                    <div class="certification-title">
                        <h4>${esc(cert.name)}</h4>
                    </div>
                `;
                container.appendChild(div);
            });
        } catch (e) { console.error("Error loading certifications:", e); }
    }

    // --- Recognitions ---
    async function loadRecognitions() {
        const container = document.querySelector('.recognition-grid');
        if (!container) return;

        try {
            const { data: snap, error } = await supabaseClient.from('recognitions').select('*');
            if (error || !snap || snap.length === 0) return;

            container.innerHTML = '';
            snap.forEach((recog, idx) => {
                const delay = (idx + 1) * 100;
                const div = document.createElement('div');
                div.className = 'recognition-card';
                div.setAttribute('data-aos', 'zoom-in');
                div.setAttribute('data-aos-delay', delay.toString());
                div.innerHTML = `
                    <div class="recognition-card-inner">
                        <div class="recognition-badge">
                            <i class="icofont-star"></i>
                        </div>
                        <div class="recognition-logo">
                            <img src="${esc(recog.image)}" alt="${esc(recog.name)}" class="img-fluid">
                        </div>
                        <div class="recognition-label">
                            <h4>${esc(recog.name)}</h4>
                        </div>
                    </div>
                `;
                container.appendChild(div);
            });
        } catch (e) { console.error("Error loading recognitions:", e); }
    }

    // --- Products ---
    async function loadProductsData() {
        try {
            const { data, error } = await supabaseClient.from('products').select('*');
            if (error) throw error;
            window.productsData = data || [];
            
            // Dispatch event for pages that rely on it
            const event = new Event('productsLoaded');
            window.dispatchEvent(event);
        } catch(e) {
            console.error('Error loading products from Supabase:', e);
            // Dispatch event even on error so pages can show their error/empty state
            window.dispatchEvent(new Event('productsLoaded'));
        }
    }

    // --- Gallery ---
    async function loadGallery() {
        const container = document.getElementById('galleryGrid');
        if (!container) return;
        try {
            const { data: snap, error } = await supabaseClient.from('gallery').select('*').order('sort_order');
            if (error || !snap || snap.length === 0) return;
            container.innerHTML = '';
            snap.forEach((item, idx) => {
                const div = document.createElement('div');
                div.className = 'gallery-item';
                div.setAttribute('data-aos', 'zoom-in');
                div.setAttribute('data-aos-delay', String((idx % 6 + 1) * 50));
                div.innerHTML = `
                    <img src="${esc(item.image)}" alt="${esc(item.alt || 'Gallery Image')}">
                    <div class="gallery-overlay"><i class="icofont-eye"></i></div>
                `;
                container.appendChild(div);
            });
        } catch(e) { console.error("Error loading gallery:", e); }
    }

    // --- Customer Reviews ---
    async function loadCustomerReviews() {
        const container = document.getElementById('reviewsGrid');
        if (!container) return;
        try {
            const { data: snap, error } = await supabaseClient.from('customer_reviews').select('*').order('sort_order');
            if (error || !snap || snap.length === 0) return;
            container.innerHTML = '';
            snap.forEach((item, idx) => {
                const rawUrl = item.youtube_url || '';
                const embedUrl = rawUrl.includes('/embed/')
                    ? rawUrl
                    : rawUrl.replace('watch?v=', 'embed/');
                const div = document.createElement('div');
                div.className = 'review-card';
                div.setAttribute('data-aos', 'flip-up');
                div.setAttribute('data-aos-delay', String(((idx % 3) + 1) * 100));
                div.innerHTML = `
                    <div class="review-video-wrapper">
                        <iframe src="${esc(embedUrl)}" frameborder="0" allowfullscreen></iframe>
                    </div>
                    <div class="review-label">
                        <i class="icofont-quote-left"></i>
                        <span>${esc(item.label || 'Customer Review')}</span>
                    </div>
                `;
                container.appendChild(div);
            });
        } catch(e) { console.error("Error loading reviews:", e); }
    }

} else {
    console.warn("Supabase not configured in dynamic-content.js");
}

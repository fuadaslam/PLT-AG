if (window.firebaseConfig) {
    if (!firebase.apps.length) {
        firebase.initializeApp(window.firebaseConfig);
    }
    const db = firebase.firestore();

    document.addEventListener('DOMContentLoaded', () => {
        // 1. Index Page
        if (document.getElementById('about')) {
            loadAboutUs(db);
            loadCoreValues(db);
            loadServices(db);
        }

        // 2. Consultancy Page
        if (document.getElementById('consultancy')) {
            loadConsultancyPage(db);
        }

        // 3. Careers Page
        if (document.querySelector('.careers-page-enhanced')) {
            loadCareersPage(db);
        }
        // 4. Contact Info (Runs everywhere for Footer)
        loadContactInfo(db);
    });

    // --- About Us ---
    async function loadAboutUs(db) {
        try {
            const doc = await db.collection('content').doc('about').get();
            if (!doc.exists) return; // Use fallback hardcoded HTML
            const data = doc.data();

            const sectionTitle = document.querySelector('#about .section-title h2');
            const sectionSubtitle = document.querySelector('#about .section-title p');
            const aboutDesc = document.querySelector('.about-description');

            if (sectionTitle && data.title) sectionTitle.textContent = data.title;
            if (sectionSubtitle && data.subtitle) sectionSubtitle.textContent = data.subtitle;
            
            if (aboutDesc && data.description) {
                // If description has newlines, maybe wrap in <p>?
                // Or just assume the admin entered HTML or plain text. 
                // For safety, let's just stick it in one P or split by newline.
                // Admin app saves as textarea value. 
                const paragraphs = data.description.split('\n').filter(p => p.trim() !== '');
                aboutDesc.innerHTML = paragraphs.map(p => `<p>${p}</p>`).join('');
            }
        } catch (e) {
            console.error("Error loading About Us:", e);
        }
    }

    // --- Core Values ---
    async function loadCoreValues(db) {
        const container = document.querySelector('.our-values-section .row');
        if (!container) return;

        try {
            const snap = await db.collection('core_values').get();
            if (snap.empty) return; // Keep default if empty

            container.innerHTML = ''; // Clear default
            snap.forEach(doc => {
                const val = doc.data();
                const div = document.createElement('div');
                div.className = 'col-lg-3 col-md-6 col-sm-6';
                div.setAttribute('data-aos', 'flip-left');
                div.innerHTML = `
                    <div class="value-card">
                        <div class="value-icon-wrapper">
                            <i class="${val.icon}"></i>
                        </div>
                        <h4>${val.title}</h4>
                        <p>${val.description}</p>
                    </div>
                `;
                container.appendChild(div);
            });
        } catch (e) { console.error("Error loading values:", e); }
    }

    // --- Services (Index) ---
    async function loadServices(db) {
        const container = document.querySelector('.services-grid');
        if (!container) return;

        try {
            const snap = await db.collection('services').orderBy('number').get(); // Assuming 'number' field
            // Note: need to handle sorting if 'number' is string/number. 
            // If orderBy fails due to missing index, it might throw. Remove orderBy if simple.
            // Let's rely on client sort or default order for now to avoid index errors initially.
            // const snap = await db.collection('services').get(); 
            // Actually, let's keep it simple first.
            
            const services = [];
            snap.forEach(doc => services.push(doc.data()));
            services.sort((a,b) => (a.number || '0') - (b.number || '0'));

             if (services.length > 0) {
                container.innerHTML = '';
                services.forEach(s => {
                    const div = document.createElement('div');
                    div.className = 'service-card';
                    div.setAttribute('data-aos', 'zoom-in');
                    div.innerHTML = `
                        <div class="service-image-wrapper">
                            <img src="${s.image}" alt="${s.title}" class="service-image" onerror="this.src='assets/img/ferlilizer.jpg'"/>
                            <div class="service-overlay">
                                <i class="${s.icon}"></i>
                            </div>
                        </div>
                        <div class="service-content">
                            <div class="service-number">${s.number}</div>
                            <h4>${s.title}</h4>
                            <p>${s.description}</p>
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
    async function loadConsultancyPage(db) {
        // Text
        try {
            const doc = await db.collection('content').doc('consultancy').get();
            if (doc.exists) {
                const data = doc.data();
                const title = document.querySelector('.consultancy-hero h1');
                const sub = document.querySelector('.consultancy-hero .subtitle');
                const desc = document.querySelector('.consultancy-hero .description');
                
                if (title && data.title) title.textContent = data.title;
                if (sub && data.subtitle) sub.textContent = data.subtitle;
                if (desc && data.description) desc.textContent = data.description;
            }
        } catch(e) { console.error(e); }

        // Team
        const container = document.querySelector('.team-section .row');
        if (container) {
             try {
                const snap = await db.collection('team_members').get();
                if (!snap.empty) {
                    container.innerHTML = '';
                    snap.forEach(doc => {
                        const t = doc.data();
                        const div = document.createElement('div');
                        div.className = 'col-lg-4 col-md-6 col-sm-12';
                        div.setAttribute('data-aos', 'zoom-in');
                        div.innerHTML = `
                            <div class="team-card">
                                <div class="team-member-image">
                                    <img src="${t.image}" alt="${t.name}" onerror="this.src='assets/img/pltashiq.jpeg'"/>
                                </div>
                                <div class="team-info">
                                    <h6>${t.name}</h6>
                                    <p>${t.role}</p>
                                    <a href="tel:${t.phone}">
                                        <i class="bx bx-phone"></i>${t.phone}
                                    </a>
                                    <a href="mailto:${t.email}">
                                        <i class="bx bx-envelope"></i>${t.email}
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
    async function loadCareersPage(db) {
        const container = document.querySelector('.benefits-grid');
        if(!container) return;

        try {
             const snap = await db.collection('career_benefits').get();
             if(!snap.empty) {
                 container.innerHTML = '';
                 snap.forEach(doc => {
                     const b = doc.data();
                     const div = document.createElement('div');
                     div.className = 'benefit-card';
                     div.setAttribute('data-aos', 'fade-up');
                     div.innerHTML = `
                        <div class="benefit-icon">
                            <i class="${b.icon}"></i>
                        </div>
                        <h3>${b.title}</h3>
                        <p>${b.description}</p>
                     `;
                     container.appendChild(div);
                 });
             }
        } catch(e) { console.error(e); }
    }

    // --- Contact Info (Footer & Contact Page) ---
    async function loadContactInfo(db) {
        try {
            const doc = await db.collection('content').doc('contact').get();
            if (!doc.exists) return;
            const data = doc.data();

            // 1. Footer Updates
            if(data.addressLine2) {
                // Try to find footer address p
                const addrP = document.querySelector('#footer .footer-contact-info .contact-item:nth-child(1) p');
                if(addrP) addrP.innerHTML = `${data.addressLine1 || ''}<br>${data.addressLine2}`;
            }

            if(data.email) {
                const emailLink = document.querySelector('#footer .footer-contact-info .contact-item:nth-child(2) a');
                if(emailLink) {
                    emailLink.href = `mailto:${data.email}`;
                    emailLink.textContent = data.email;
                }
                const mobileEmail = document.querySelector('.mobile-contact-info p:nth-child(2)');
                if(mobileEmail) mobileEmail.innerHTML = `<i class="bx bx-envelope"></i> ${data.email}`;
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
                if(mobilePhone) mobilePhone.innerHTML = `<i class="bx bx-phone"></i> ${data.phoneCustomerCare}`;
            }

            if(data.phoneSales) {
                const phoneSales = document.querySelector('.footer-contact .contact-item:nth-child(3) a');
                if(phoneSales) {
                    phoneSales.href = `tel:${data.phoneSales.replace(/\D/g,'')}`;
                    phoneSales.textContent = data.phoneSales;
                }
            }

            // Social Links (Footer)
            if(data.facebook) {
                document.querySelectorAll('a.facebook').forEach(a => a.href = data.facebook);
            }
            if(data.instagram) {
                document.querySelectorAll('a.instagram').forEach(a => a.href = data.instagram);
            }
            if(data.youtube) {
                document.querySelectorAll('a.youtube').forEach(a => a.href = data.youtube);
            }
            if(data.whatsapp) {
                document.querySelectorAll('a.whatsapp').forEach(a => a.href = data.whatsapp);
            }

            // 2. Contact Page Specifics
            if(document.querySelector('.contact-page-enhanced')) {
                // Call Us Card (assumes specific structure)
                const callCard = document.querySelector('.contact-info-card-enhanced:nth-child(1)');
                if(callCard && data.phoneCustomerCare) {
                     // Assuming order: CC, HO
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

} else {
    console.warn("Firebase not configured in dynamic-content.js");
}

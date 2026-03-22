document.addEventListener("DOMContentLoaded", () => {

    // Register GSAP ScrollTrigger
    gsap.registerPlugin(ScrollTrigger);

    // ---- DYNAMIC DATA INJECTION ----
    function populateDynamicData() {
        if (typeof DataManager === 'undefined') return;
        const data = DataManager.getData();
        if (!data) return;

        // 1. Students Counter
        const studentsCounter = document.getElementById('students-counter');
        if (studentsCounter) {
            studentsCounter.setAttribute('data-target', data.studentsEnrolled);
            if (studentsCounter.innerHTML !== "0") {
                studentsCounter.innerHTML = data.studentsEnrolled;
            }
        }

        // 2. Teachers
        const teachersGrid = document.getElementById('dynamic-teachers-grid');
        if (teachersGrid) {
            teachersGrid.innerHTML = data.teachers.map(t => `
                <div class="teacher-card glass-card">
                    <div class="img-container">
                        <a href="${t.image}" class="glightbox" data-type="image" data-title="${t.name}">
                            <img src="${t.image}" alt="${t.name}">
                        </a>
                        <div class="subject-badge">${t.experience} Exp</div>
                    </div>
                    <div class="teacher-info">
                        <h3>${t.name}</h3>
                        <p class="role">${t.subject}</p>
                        <p class="desc">${t.description}</p>
                    </div>
                </div>
            `).join('');
        }

        // 3. Programs
        const coursesWrapper = document.getElementById('dynamic-courses-wrapper');
        if (coursesWrapper) {
            coursesWrapper.innerHTML = data.programs.map(p => {
                if (p.isMain) {
                    return `
                        <div class="main-courses glass-card">
                            <div class="course-header">
                                <i class="${p.icon}"></i>
                                <h3>${p.name}</h3>
                            </div>
                            <p class="level">${p.level || ''}</p>
                            <p class="curriculum">${p.curriculum || ''}</p>
                            <div class="subjects-tags">
                                ${(p.tags || []).map(tag => `<span>${tag}</span>`).join('')}
                            </div>
                        </div>
                    `;
                } else {
                    return `
                        <div class="course-card glass-card">
                            <i class="${p.icon}"></i>
                            <h4>${p.name}</h4>
                            <p>${p.description || ''}</p>
                        </div>
                    `;
                }
            }).join('');
        }

        // 4. FAQs
        const faqContainer = document.getElementById('dynamic-faq-container');
        if (faqContainer) {
            faqContainer.innerHTML = data.faqs.map(f => `
                <div class="faq-item">
                    <div class="faq-question">
                        <h3>${f.question}</h3>
                        <i class="fas fa-chevron-down"></i>
                    </div>
                    <div class="faq-answer">
                        <p>${f.answer}</p>
                    </div>
                </div>
            `).join('');

            bindFaqEvents();
        }

        // 5. Dynamic Content (CMS) Text Nodes
        const content = data.content || {};
        const safeSet = (id, html) => { const el = document.getElementById(id); if (el && html) el.innerHTML = html; };

        safeSet('render-hero-badge', content.hero_badge);
        safeSet('render-hero-title', content.hero_title);
        safeSet('render-hero-subtitle', content.hero_subtitle);
        safeSet('render-about-title', content.about_title);
        safeSet('render-about-p1', content.about_p1);
        safeSet('render-about-p2', content.about_p2);

        const contactList = document.querySelector('#contact .footer-contact ul');
        if (contactList && content.contact_address) {
            contactList.innerHTML = `
                <li><i class="fas fa-map-marker-alt"></i> ${content.contact_address}</li>
                <li><i class="fas fa-phone-alt"></i> ${content.contact_phone}</li>
                <li><i class="fas fa-envelope"></i> ${content.contact_email}</li>
            `;
        }
        if (content.contact_address) {
            const epAddress = document.getElementById('enroll-popup-address');
            if (epAddress) epAddress.textContent = content.contact_address;
        }
        if (content.location_link) {
            const epAddressLink = document.getElementById('enroll-popup-address-link');
            if (epAddressLink) epAddressLink.href = content.location_link;
        }
        if (content.contact_phone) {
            const epPhone = document.getElementById('enroll-popup-phone');
            const epPhoneLink = document.getElementById('enroll-popup-phone-link');
            if (epPhone) epPhone.textContent = content.contact_phone;
            if (epPhoneLink) epPhoneLink.href = 'tel:' + content.contact_phone.replace(/[^0-9+]/g, '');
        }
        if (content.contact_email) {
            const epEmail = document.getElementById('enroll-popup-email');
            const epEmailLink = document.getElementById('enroll-popup-email-link');
            if (epEmail) epEmail.textContent = content.contact_email;
            if (epEmailLink) epEmailLink.href = 'mailto:' + content.contact_email;
        }
        if (content.contact_instagram) {
            const epInsta = document.getElementById('enroll-popup-insta');
            const epInstaLink = document.getElementById('enroll-popup-insta-link');
            if (epInsta) epInsta.textContent = content.contact_instagram;
            if (epInstaLink) {
                let instaName = content.contact_instagram.replace('@', '');
                epInstaLink.href = 'https://instagram.com/' + instaName;
            }
        }

        // 6. UI Settings & Visibility
        const ui = data.ui_settings || {};
        const toggleVis = (id, show) => { const el = document.getElementById(id); if (el) el.style.display = show !== false ? '' : 'none'; };

        toggleVis('home', ui.show_hero);
        toggleVis('about', ui.show_about);
        toggleVis('teachers', ui.show_teachers);
        toggleVis('courses', ui.show_courses);
        toggleVis('reviews', ui.show_reviews);
        toggleVis('achievers', ui.show_achievers);
        toggleVis('faq', ui.show_faq);

        const tBtn = document.querySelector('#teachers .view-all-btn');
        if (tBtn && ui.teachers_view_all) {
            tBtn.style.display = ui.teachers_view_all.enabled !== false ? 'inline-block' : 'none';
            tBtn.innerHTML = (ui.teachers_view_all.text || 'See All Teachers') + ' <i class="fas fa-arrow-right"></i>';
        }
        const cBtn = document.querySelector('#courses .view-all-btn');
        if (cBtn && ui.courses_view_all) {
            cBtn.style.display = ui.courses_view_all.enabled !== false ? 'inline-block' : 'none';
            cBtn.innerHTML = (ui.courses_view_all.text || 'See All Courses') + ' <i class="fas fa-arrow-right"></i>';
        }

        // Dynamic result percentage / floating passing icon
        if (data.content) {
            if (data.content.result_percentage) {
                const pctElem = document.getElementById('result-percentage-target');
                if (pctElem) {
                    pctElem.setAttribute('data-target', data.content.result_percentage);
                    pctElem.textContent = "0";
                }
            }
            if (document.getElementById('floating-icon-container') && data.content.floating_icon_image) {
                document.getElementById('floating-icon-container').innerHTML = `<img src="${data.content.floating_icon_image}" style="width:100%; height:100%; object-fit:cover; border-radius:50%;">`;
            } else if (document.getElementById('floating-icon-container')) {
                document.getElementById('floating-icon-container').innerHTML = `<i class="fas fa-award"></i>`;
            }

            if (document.getElementById('floating-passing-text-p') && data.content.floating_icon_text) {
                document.getElementById('floating-passing-text-p').textContent = data.content.floating_icon_text;
            }
        }

        // Render Achievers (Year-wise)
        const achieversGrid = document.getElementById('dynamic-achievers-wrapper');
        const achieversSection = document.getElementById('achievers');
        if (achieversGrid && achieversSection) {
            if (data.achievers && data.achievers.length > 0) {
                achieversSection.style.display = 'block';

                // Group by year
                const achieversByYear = {};
                data.achievers.forEach(a => {
                    const year = a.year || 'Achievements';
                    if (!achieversByYear[year]) achieversByYear[year] = [];
                    achieversByYear[year].push(a);
                });

                // Generate HTML for each year
                let achieversHtml = '';
                Object.keys(achieversByYear).sort((a, b) => b.localeCompare(a)).forEach(year => {
                    achieversHtml += `
                        <div style="width: 100%; margin-bottom: 3rem;">
                            <h3 style="text-align: center; font-size: 2rem; color: var(--primary); margin-bottom: 1.5rem;">${year}</h3>
                            <div style="display:flex; flex-wrap:wrap; justify-content:center; gap:20px;">
                                ${achieversByYear[year].map(a => `
                                    <a href="${a.image}" class="glightbox" data-type="image" data-gallery="achievers-${year}" data-title="Achiever ${year}" style="text-decoration:none;">
                                        <div class="glass-card" style="width:250px; padding:10px; display:flex; flex-direction:column; align-items:center; cursor:pointer; transition:transform 0.3s;" onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
                                            <img src="${a.image}" alt="Achiever" style="width:100%; height:auto; object-fit:contain; border-radius:8px; opacity:0.9; transition:opacity 0.3s;" onmouseover="this.style.opacity='1'" onmouseout="this.style.opacity='0.9'">
                                        </div>
                                    </a>
                                `).join('')}
                            </div>
                        </div>
                    `;
                });

                achieversGrid.innerHTML = achieversHtml;
                achieversGrid.style.display = 'block'; // Make it a block rather than flex-row carousel
                achieversGrid.style.overflowX = 'hidden';
                document.getElementById('achievers-left').style.display = 'none';
                document.getElementById('achievers-right').style.display = 'none';

            } else {
                achieversSection.style.display = 'none';
            }
        }

        // Render Reviews
        const reviewsGrid = document.getElementById('dynamic-reviews-grid');
        const reviewsSection = document.getElementById('reviews');
        if (reviewsGrid && reviewsSection) {
            if (data.reviews && data.reviews.length > 0) {
                reviewsSection.style.display = 'block';
                reviewsGrid.innerHTML = data.reviews.map(r => {
                    const stars = '★'.repeat(r.rating || 5) + '☆'.repeat(5 - (r.rating || 5));
                    const avatarUrl = r.imageBase64 || r.image || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(r.name) + '&background=random';

                    return `
                    <div class="glass-card" style="min-width:320px; max-width:360px; flex-shrink:0; scroll-snap-align:start; display:flex; flex-direction:column; padding:1.5rem; overflow:hidden;">
                        <div style="display:flex; align-items:center; gap:15px; margin-bottom:1rem;">
                            <a href="${avatarUrl}" class="glightbox" data-type="image" data-title="${r.name}'s Profile">
                                <img src="${avatarUrl}" alt="${r.name}" style="width:60px; height:60px; border-radius:50%; object-fit:cover; border:2px solid var(--primary);">
                            </a>
                            <div>
                                <h4 style="margin:0; color:var(--text-main); font-weight:700;">${r.name}</h4>
                                <div style="color:#FBBF24; font-size:1.1rem; margin-top:0.25rem;">${stars}</div>
                            </div>
                        </div>
                        <p style="font-style:italic; color:var(--text-muted); line-height:1.5;">"${r.text}"</p>
                    </div>
                    `;
                }).join('');
                setTimeout(() => checkArrows('dynamic-reviews-grid', 'reviews-left', 'reviews-right'), 100);
            } else {
                reviewsSection.style.display = 'none';
            }
        }

        // 8. Image Gallery
        const galleryContainer = document.getElementById('dynamic-gallery-wrapper');
        const gallerySection = document.getElementById('gallery');
        if (galleryContainer && gallerySection) {
            if (data.gallery_images && data.gallery_images.length > 0) {
                gallerySection.style.display = 'block';
                galleryContainer.innerHTML = data.gallery_images.map(img => `
                    <div class="glass-card" style="min-width:300px; max-width:350px; height:250px; flex-shrink:0; overflow:hidden; border-radius:var(--radius-lg); position:relative; group;">
                        <img src="${img.image}" alt="${img.caption || 'Gallery Image'}" class="glightbox" data-type="image" data-gallery="media-gallery" data-title="${img.caption || ''}" style="width:100%; height:100%; object-fit:cover; transition:transform 0.3s; cursor:pointer;" onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
                        ${img.caption ? `<div style="position:absolute; bottom:0; left:0; right:0; background:rgba(0,0,0,0.6); color:#fff; padding:10px; font-size:0.9rem; text-align:center;">${img.caption}</div>` : ''}
                    </div>
                `).join('');
                setTimeout(() => checkArrows('dynamic-gallery-wrapper', 'gallery-left', 'gallery-right'), 100);
            } else {
                gallerySection.style.display = 'none'; // hide if no images
            }
        }
        // Initialize GLightbox for structural galleries
        if (window.glightboxInstance) {
            window.glightboxInstance.destroy();
        }
        window.glightboxInstance = GLightbox({
            selector: '.glightbox',
            touchNavigation: true,
            loop: true,
            zoomable: true
        });

        // Global fallback: Make literally ANY image on the site clickable if it's not already covered
        if (!window.globalImageClickInitialized) {
            document.body.addEventListener('click', (e) => {
                // If it's an image, and not inside a glightbox anchor, navbar, footer, or loader
                if (e.target.tagName === 'IMG' && 
                    !e.target.closest('.glightbox') && 
                    !e.target.closest('footer') && 
                    !e.target.closest('#navbar') && 
                    !e.target.closest('#loader')) {
                    
                    const src = e.target.src;
                    if (src) {
                        GLightbox({
                            elements: [{ href: src, type: 'image' }],
                            touchNavigation: true,
                            zoomable: true
                        }).open();
                    }
                }
            });
            window.globalImageClickInitialized = true;
        }

        // 9. Enrollment Setup
        const enrollSet = data.enroll_settings || {};
        const enrollBtns = document.querySelectorAll('.open-enroll-modal');
        enrollBtns.forEach(btn => {
            btn.innerHTML = enrollSet.button_text || 'Enroll Today';
        });

        const customFieldsContainer = document.getElementById('enrollment-custom-fields');
        if (customFieldsContainer && enrollSet.custom_fields) {
            customFieldsContainer.innerHTML = enrollSet.custom_fields.map((f, idx) => `
                <div class="form-group" style="margin-bottom:15px;">
                    <label style="display:block; margin-bottom:5px; font-weight:600; font-size:0.9rem; color:var(--text-main);">${f.name}</label>
                    <input type="${f.type || 'text'}" id="enrollment-custom-${idx}" class="form-control" data-name="${f.name}" placeholder="Enter ${f.name}" ${f.required ? 'required' : ''}>
                </div>
            `).join('');
        }

        // 9. Media Injection Removed

        ScrollTrigger.refresh();
    }

    populateDynamicData();
    window.addEventListener('brainyboxDataUpdated', populateDynamicData);

    function bindFaqEvents() {
        const faqs = document.querySelectorAll('.faq-question');
        faqs.forEach(faq => {
            const newFaq = faq.cloneNode(true);
            faq.parentNode.replaceChild(newFaq, faq);

            newFaq.addEventListener('click', () => {
                newFaq.classList.toggle('active');
                const answer = newFaq.nextElementSibling;
                if (newFaq.classList.contains('active')) {
                    answer.classList.add('active');
                } else {
                    answer.classList.remove('active');
                }
            });
        });
    }

    // Global variables for Carousels
    window.scrollCarousel = function (containerId, direction) {
        const container = document.getElementById(containerId);
        if (!container) return;
        let visibleItems = 3;
        if (window.innerWidth <= 992) visibleItems = 2;
        if (window.innerWidth <= 768) visibleItems = 1;
        const scrollAmount = container.clientWidth / visibleItems;
        container.scrollBy({ left: scrollAmount * direction, behavior: 'smooth' });
    };

    window.checkArrows = function (containerId, leftBtnId, rightBtnId) {
        const container = document.getElementById(containerId);
        const leftBtn = document.getElementById(leftBtnId);
        const rightBtn = document.getElementById(rightBtnId);
        if (!container || !leftBtn || !rightBtn) return;

        if (container.scrollLeft <= 10) {
            leftBtn.classList.add('hidden');
        } else {
            leftBtn.classList.remove('hidden');
        }

        // Add 2px tolerance for fractional scrolling
        if (container.scrollLeft + container.clientWidth >= container.scrollWidth - 2) {
            rightBtn.classList.add('hidden');
        } else {
            rightBtn.classList.remove('hidden');
        }
    };

    // 2. CINEMATIC LOADER ANIMATION
    const hasPlayedLoader = sessionStorage.getItem('brainyboxLoaderPlayed');

    function finalizeLoad() {
        const loaderEl = document.getElementById('loader');
        const mainEl = document.getElementById('main-content');
        if (loaderEl) loaderEl.style.display = 'none';
        if (mainEl) {
            mainEl.style.opacity = '1';
            mainEl.style.visibility = 'visible';
        }
        document.body.style.overflow = "auto";
        document.body.style.height = "auto";
        initScrollAnimations();

        // Manually scroll to hash after dynamic heights are rendered
        if (window.location.hash) {
            setTimeout(() => {
                const target = document.querySelector(window.location.hash);
                if (target) target.scrollIntoView({ behavior: 'auto' });
            }, 50);
        }
    }

    if (hasPlayedLoader) {
        finalizeLoad();
    } else {
        const tl = gsap.timeline({
            onComplete: () => {
                sessionStorage.setItem('brainyboxLoaderPlayed', 'true');
                finalizeLoad();
            }
        });

        // Start with overflow hidden
        document.body.style.overflow = "hidden";
        document.body.style.height = "100vh";

        // Subtly float the cubes continuously until separated
        gsap.to(".cubes-wrapper", {
            y: -15, rotationX: 10, rotationY: -10,
            duration: 2, repeat: -1, yoyo: true, ease: "sine.inOut"
        });

        tl.set(".loader-brand-text", { x: -50, opacity: 0 })
            .set(".cube-3d", { scale: 0, rotationZ: -90 })

            // 0.0s: Cubes scale in gracefully
            .to(".cube-3d", { scale: 1, rotationZ: 0, duration: 1.2, stagger: 0.1, ease: "power3.out" }, 0)

            // 0.8s: Cinematic camera zoom in & Text slides right
            .to("#camera", { scale: 1.3, duration: 2, ease: "power2.inOut" }, 0.8)
            .to(".loader-brand-text", { x: 40, opacity: 1, duration: 1.5, ease: "power3.out" }, 1.0)

            // 2.0s: Mechanical shutter twist before bursting
            .to(".cubes-wrapper", { rotation: 135, scale: 0.8, duration: 0.6, ease: "back.in(1.5)" }, 2.0)

            // 2.6s: Cubes separate outward
            .to(".pink-tint", { x: "-200vw", y: "-200vh", duration: 1.5, ease: "power4.inOut" }, 2.6)
            .to(".blue-tint", { x: "200vw", y: "-200vh", duration: 1.5, ease: "power4.inOut" }, 2.6)
            .to(".green-tint", { x: "-200vw", y: "200vh", duration: 1.5, ease: "power4.inOut" }, 2.6)
            .to(".orange-tint", { x: "200vw", y: "200vh", duration: 1.5, ease: "power4.inOut" }, 2.6)

            // Text fades out
            .to(".loader-brand-text", { x: 100, opacity: 0, duration: 0.8, ease: "power2.in" }, 2.6)

            // 2.8s: Light burst & transition
            .to(".light-burst", { scale: 5, opacity: 1, duration: 1, ease: "power2.out" }, 2.8)
            .to("#loader", { opacity: 0, duration: 0.8, ease: "power2.inOut" }, 3.2);
    }

    // 3. MAIN SCROLL ANIMATIONS (Called after loader finishes)
    function initScrollAnimations() {
        // Navbar scroll effect
        const navbar = document.getElementById('navbar');
        window.addEventListener('scroll', () => {
            if (window.scrollY > 50) navbar.classList.add('scrolled');
            else navbar.classList.remove('scrolled');
        });

        // Hero Section entrance
        gsap.from(".hero-text > *", {
            y: 50,
            opacity: 0,
            duration: 1,
            stagger: 0.2,
            ease: "power3.out"
        });

        gsap.from(".hero-image", {
            x: 100,
            opacity: 0,
            duration: 1.5,
            ease: "power3.out"
        }, "-=1");

        // Counters Animation
        const counters = document.querySelectorAll('.counter');
        counters.forEach(counter => {
            ScrollTrigger.create({
                trigger: counter,
                start: "top 80%",
                once: true,
                onEnter: () => {
                    const target = +counter.getAttribute('data-target');
                    gsap.to(counter, {
                        innerHTML: target,
                        duration: 2,
                        snap: { innerHTML: 1 },
                        ease: "power1.out"
                    });
                }
            });
        });

        // About section fade in
        gsap.from(".about-image", {
            scrollTrigger: { trigger: ".about", start: "top 70%" },
            x: -100, opacity: 0, duration: 1, ease: "power2.out"
        });
        gsap.from(".about-text", {
            scrollTrigger: { trigger: ".about", start: "top 70%" },
            x: 100, opacity: 0, duration: 1, ease: "power2.out"
        });



        // FAQ Accordion logic handled dynamically

        // Modal Logic
        const modal = document.getElementById('enroll-modal');
        const openBtns = document.querySelectorAll('.open-enroll-modal');
        const closeBtn = document.querySelector('.close-modal');

        openBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                modal.classList.add('active');
            });
        });

        closeBtn.addEventListener('click', () => {
            modal.classList.remove('active');
        });

        // Close on outside click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('active');
            }
        });

        // Mobile Menu Logic
        const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
        const navLinksContainer = document.querySelector('.nav-links');
        const navLinksElements = document.querySelectorAll('.nav-links a');

        if (mobileMenuBtn && navLinksContainer) {
            mobileMenuBtn.addEventListener('click', () => {
                navLinksContainer.classList.toggle('active');
                const icon = mobileMenuBtn.querySelector('i');
                if(icon) {
                    icon.classList.toggle('fa-bars');
                    icon.classList.toggle('fa-times');
                }
            });

            navLinksElements.forEach(link => {
                link.addEventListener('click', () => {
                    navLinksContainer.classList.remove('active');
                    const icon = mobileMenuBtn.querySelector('i');
                    if(icon) {
                        icon.classList.add('fa-bars');
                        icon.classList.remove('fa-times');
                    }
                });
            });
            
            window.addEventListener('scroll', () => {
                if(navLinksContainer.classList.contains('active')) {
                    navLinksContainer.classList.remove('active');
                    const icon = mobileMenuBtn.querySelector('i');
                    if(icon) {
                        icon.classList.add('fa-bars');
                        icon.classList.remove('fa-times');
                    }
                }
            });
        }

        // Setup Interactive Map Feature (Replaced by Google Maps Iframe)
        // Leaflet logic removed.
    }

    // Enrollment Form Submissions
    const enrollForm = document.getElementById('student-enrollment-form');
    if (enrollForm) {
        enrollForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const submitBtn = enrollForm.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerHTML;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Submitting...';
            submitBtn.style.pointerEvents = 'none';

            setTimeout(() => {
                const sub = {
                    name: document.getElementById('enrollment-name').value,
                    phone: document.getElementById('enrollment-phone').value,
                    email: document.getElementById('enrollment-email').value,
                    date: new Date().toISOString()
                };

                const customInputs = enrollForm.querySelectorAll('[id^="enrollment-custom-"]');
                if (customInputs.length > 0) {
                    sub.customData = {};
                    customInputs.forEach(input => {
                        sub.customData[input.getAttribute('data-name')] = input.value;
                    });
                }

                if (typeof DataManager !== 'undefined') {
                    DataManager.addSubmission(sub);
                }

                // EmailJS Integration Placeholder
                // Make sure to add 'YOUR_PUBLIC_KEY' in index.html first.
                // Replace these with your actual Service ID and Template ID
                const serviceID = 'service_94uymqb';
                const templateID = 'template_verzxnl';
                if (typeof emailjs !== 'undefined' && serviceID !== 'service_94uymqb') {
                    const templateParams = {
                        student_name: sub.name,
                        student_phone: sub.phone,
                        student_email: sub.email,
                        custom_data: JSON.stringify(sub.customData || {})
                    };
                    emailjs.send(serviceID, templateID, templateParams)
                        .then(() => {
                            console.log('EmailJS: Email notification sent successfully!');
                        })
                        .catch((err) => {
                            console.error('EmailJS: Failed to send email.', err);
                            alert('EmailJS Error: ' + (err.text || err.message || JSON.stringify(err)));
                        });
                }

                submitBtn.innerHTML = originalText;
                submitBtn.style.pointerEvents = 'auto';

                document.getElementById('enrollment-success-msg').style.display = 'block';
                enrollForm.reset();

                setTimeout(() => {
                    document.getElementById('enrollment-success-msg').style.display = 'none';
                    document.getElementById('enroll-modal').classList.remove('active');
                }, 3000);
            }, 800);
        });
    }
});

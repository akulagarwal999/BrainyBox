// Admin Panel Logic - brainybox dashboard

document.addEventListener('DOMContentLoaded', () => {

    // ==== Notification Toast ====
    function showToast(message, type = 'success') {
        const toast = document.getElementById('toast');
        const msg = document.getElementById('toast-message');
        const icon = toast.querySelector('i');
        
        msg.textContent = message;
        if(type === 'success') {
            toast.style.borderLeftColor = 'var(--success)';
            icon.className = 'fas fa-check-circle';
            icon.style.color = 'var(--success)';
        } else {
            toast.style.borderLeftColor = 'var(--danger)';
            icon.className = 'fas fa-exclamation-circle';
            icon.style.color = 'var(--danger)';
        }

        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 3000);
    }

    // ==== Authentication ====
    const loginScreen = document.getElementById('login-screen');
    const dashboard = document.getElementById('dashboard');
    const loginForm = document.getElementById('login-form');
    const loginError = document.getElementById('login-error');
    const logoutBtn = document.getElementById('logout-btn');

    // Allowed Admin Email
    const ALLOWED_ADMIN_EMAIL = 'mom.brainybox@gmail.com';

    // Check Firebase Auth state
    firebase.auth().onAuthStateChanged((user) => {
        if (user) {
            if (user.email === ALLOWED_ADMIN_EMAIL) {
                showDashboard();
            } else {
                firebase.auth().signOut().then(() => {
                    loginError.textContent = 'unorthorized email  , access denied';
                    loginError.style.display = 'block';
                    loginScreen.querySelector('.login-card').classList.add('shake-anim');
                    setTimeout(() => loginScreen.querySelector('.login-card').classList.remove('shake-anim'), 400);
                });
                loginScreen.classList.add('active');
                loginScreen.classList.remove('hidden');
                dashboard.classList.add('hidden');
            }
        } else {
            loginScreen.classList.add('active');
            loginScreen.classList.remove('hidden');
            dashboard.classList.add('hidden');
        }
    });

    // Remove default form submit behavior
    loginForm.addEventListener('submit', (e) => e.preventDefault());

    const rmCheckbox = document.getElementById('remember-me');
    if (rmCheckbox) {
        rmCheckbox.addEventListener('change', (e) => {
            const persistence = e.target.checked 
                ? firebase.auth.Auth.Persistence.LOCAL 
                : firebase.auth.Auth.Persistence.SESSION;
            firebase.auth().setPersistence(persistence).catch(console.error);
        });
    }

    const googleBtn = document.getElementById('google-login-btn');
    if (googleBtn) {
        googleBtn.addEventListener('click', () => {
            const provider = new firebase.auth.GoogleAuthProvider();
            googleBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Connecting...';
            googleBtn.style.pointerEvents = 'none';

            firebase.auth().signInWithPopup(provider)
                .then((result) => {
                    showToast('Google Login successful!');
                    googleBtn.innerHTML = '<i class="fab fa-google" style="color:#DB4437;"></i> Sign in with Google';
                    googleBtn.style.pointerEvents = 'auto';
                }).catch((error) => {
                    loginError.textContent = 'Google Auth Failed: ' + error.message;
                    loginError.style.display = 'block';
                    googleBtn.innerHTML = '<i class="fab fa-google" style="color:#DB4437;"></i> Sign in with Google';
                    googleBtn.style.pointerEvents = 'auto';
                });
        });
    }

    logoutBtn.addEventListener('click', () => {
        firebase.auth().signOut().then(() => {
            document.getElementById('username').value = '';
            document.getElementById('password').value = '';
            showToast('Logged out successfully');
        }).catch((error) => {
            showToast('Error logging out', 'error');
        });
    });

    const publishBtn = document.getElementById('btn-publish-live');
    if(publishBtn) {
        publishBtn.addEventListener('click', () => {
            if(confirm('Are you sure you want to publish these changes to the live website?')) {
                if(DataManager.publishDraft()) {
                    showToast('Website Successfully Published!', 'success');
                } else {
                    showToast('Publishing failed', 'error');
                }
            }
        });
    }

    function showDashboard() {
        loginScreen.classList.add('hidden');
        loginScreen.classList.remove('active');
        dashboard.classList.remove('hidden');
        refreshDashboardData();
    }

    // ==== Navigation ====
    const navItems = document.querySelectorAll('.nav-item');
    const panels = document.querySelectorAll('.panel');
    const sidebar = document.querySelector('.sidebar');
    const mobileToggle = document.querySelector('.mobile-toggle');

    navItems.forEach(item => {
        item.addEventListener('click', () => {
            // Update active nav
            navItems.forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');

            // Show target panel
            const targetId = item.getAttribute('data-target');
            panels.forEach(panel => {
                if(panel.id === targetId) {
                    panel.classList.remove('hidden');
                    panel.classList.add('active');
                } else {
                    panel.classList.add('hidden');
                    panel.classList.remove('active');
                }
            });

            // Close mobile sidebar if open
            if(window.innerWidth <= 992) {
                sidebar.classList.remove('active');
            }
        });
    });

    if(mobileToggle) {
        mobileToggle.addEventListener('click', () => {
            sidebar.classList.toggle('active');
        });
    }

    // Old Notification logic removed as it's now handled by the bottom script

    // ==== Data Management UI Bindings ====
    function refreshDashboardData() {
        const data = DataManager.getData();
        window.updateNotificationBadge();
        
        // Home Stats
        document.getElementById('stat-students').textContent = data.studentsEnrolled;
        const studentsInput = document.getElementById('students-count-input');
        if(studentsInput) studentsInput.value = data.studentsEnrolled;

        // Render Tables
        if(typeof renderTeachers !== 'undefined') renderTeachers(data.teachers || []);
        if(typeof renderPrograms !== 'undefined') renderPrograms(data.programs || []);
        if(typeof renderFaqs !== 'undefined') renderFaqs(data.faqs || []);
        
        if(typeof renderReviews !== 'undefined') renderReviews(data.reviews || []);
        if(typeof renderGallery !== 'undefined') renderGallery(data.gallery_images || []);
        if(typeof populateUISettings !== 'undefined') populateUISettings(data.ui_settings || {});
        if(typeof populateContent !== 'undefined') populateContent(data.content || {});
        if(typeof populateEnrollments !== 'undefined') populateEnrollments(data);
    }

    // Listen to changes from other tabs via DataManager event
    window.addEventListener('brainyboxDataUpdated', refreshDashboardData);
    window.addEventListener('storage', (e) => {
        if(e.key === 'brainybox_data' || e.key === 'brainyBoxLastReadSubmissions') {
            refreshDashboardData();
        }
    });

    // -- Students Counter --
    function renderDashboardData() {
        const d = DataManager.getData();
        document.getElementById('stat-students').textContent = d.studentsEnrolled;
        if (document.getElementById('students-count-input')) {
            document.getElementById('students-count-input').value = d.studentsEnrolled;
        }
        
        if (d.content) {
            if (document.getElementById('db-result-percentage')) {
                document.getElementById('db-result-percentage').value = d.content.result_percentage || '100';
            }
            if (document.getElementById('db-floating-text')) {
                document.getElementById('db-floating-text').value = d.content.floating_icon_text || 'Passing Rate';
            }
            if (document.getElementById('db-floating-image-base64')) {
                document.getElementById('db-floating-image-base64').value = d.content.floating_icon_image || '';
            }
        }
    }

    document.getElementById('students-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const val = parseInt(document.getElementById('students-count-input').value, 10);
        if(!isNaN(val)){
            DataManager.updateStudentsEnrolled(val);
            showToast('Students Counter Updated!');
            renderDashboardData();
        }
    });

    const dbFloatFile = document.getElementById('db-floating-image-file');
    if(dbFloatFile) {
        dbFloatFile.addEventListener('change', function() {
            if(this.files && this.files[0]) {
                const reader = new FileReader();
                reader.onload = e => {
                    document.getElementById('db-floating-image-base64').value = e.target.result;
                };
                reader.readAsDataURL(this.files[0]);
            }
        });
    }

    document.getElementById('floating-icon-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const existing = DataManager.getData().content || {};
        const update = {
            result_percentage: document.getElementById('db-result-percentage').value,
            floating_icon_text: document.getElementById('db-floating-text').value,
            floating_icon_image: document.getElementById('db-floating-image-base64').value
        };
        DataManager.updateContent(Object.assign({}, existing, update));
        showToast('Floating Icon Config Updated!');
    });

    // -- image handling --
    function handleImageUpload(inputEl, previewEl, base64El) {
        const file = inputEl.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                const img = new Image();
                img.onload = function() {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    const MAX_WIDTH = 800;
                    const MAX_HEIGHT = 800;
                    let width = img.width;
                    let height = img.height;
                    
                    if (width > height) {
                        if (width > MAX_WIDTH) {
                            height *= MAX_WIDTH / width;
                            width = MAX_WIDTH;
                        }
                    } else {
                        if (height > MAX_HEIGHT) {
                            width *= MAX_HEIGHT / height;
                            height = MAX_HEIGHT;
                        }
                    }
                    
                    canvas.width = width;
                    canvas.height = height;
                    ctx.drawImage(img, 0, 0, width, height);
                    
                    const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
                    previewEl.innerHTML = `<img src="${dataUrl}" alt="Preview">`;
                    base64El.value = dataUrl;
                };
                img.src = e.target.result;
            }
            reader.readAsDataURL(file);
        }
    }
    
    document.getElementById('teacher-image-file').addEventListener('change', function() {
        handleImageUpload(
            this, 
            document.getElementById('teacher-image-preview'), 
            document.getElementById('teacher-image-base64')
        );
    });

    const contentSectionFile = document.getElementById('content-section-photo-file');
    if(contentSectionFile) {
        contentSectionFile.addEventListener('change', function() {
            handleImageUpload(
                this, 
                document.getElementById('content-section-photo-preview'), 
                document.getElementById('content-section-photo-base64')
            );
        });
    }

    const galleryFile = document.getElementById('gallery-photo-file');
    if(galleryFile) {
        galleryFile.addEventListener('change', function() {
            handleImageUpload(
                this, 
                document.getElementById('gallery-photo-preview'), 
                document.getElementById('gallery-photo-base64')
            );
        });
    }

    // ==== Modal Logic ====
    window.openModal = function(modalId) {
        document.getElementById(modalId).classList.remove('hidden');
    }

    window.closeModal = function(modalId) {
        document.getElementById(modalId).classList.add('hidden');
        // Reset form inside
        const form = document.querySelector(`#${modalId} form`);
        if(form) form.reset();
        
        // Custom resets
        if(modalId === 'teacher-modal') {
            document.getElementById('teacher-image-preview').innerHTML = '';
            document.getElementById('teacher-image-base64').value = '';
            document.getElementById('teacher-id').value = '';
            document.getElementById('teacher-modal-title').textContent = 'Add Teacher';
        }
        if(modalId === 'program-modal') {
            document.getElementById('main-course-fields').classList.add('hidden');
            document.getElementById('special-course-fields').classList.remove('hidden');
            document.getElementById('program-id').value = '';
            document.getElementById('program-modal-title').textContent = 'Add Program';
        }
        if(modalId === 'content-section-modal') {
            document.getElementById('content-section-photo-preview').innerHTML = '';
            document.getElementById('content-section-photo-base64').value = '';
            document.getElementById('content-section-id').value = '';
            document.getElementById('content-section-modal-title').textContent = 'Add Content Section';
        }
        if(modalId === 'gallery-modal') {
            document.getElementById('gallery-photo-preview').innerHTML = '';
            document.getElementById('gallery-photo-base64').value = '';
            document.getElementById('gallery-id').value = '';
            document.getElementById('gallery-modal-title').textContent = 'Add Gallery Image';
        }
        if(modalId === 'faq-modal') {
            document.getElementById('faq-id').value = '';
            document.getElementById('faq-modal-title').textContent = 'Add FAQ';
        }
    }

    // ==== Teachers CRUD ====
    function renderTeachers(teachers) {
        const tbody = document.getElementById('teachers-tbody');
        tbody.innerHTML = '';
        teachers.forEach(t => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><img src="${t.image}" class="item-img" alt="${t.name}"></td>
                <td><strong>${t.name}</strong></td>
                <td>${t.subject}</td>
                <td>${t.experience}</td>
                <td class="action-btns">
                    <button class="btn btn-sm btn-outline btn-edit-teacher" data-id="${t.id}"><i class="fas fa-edit"></i></button>
                    <button class="btn btn-sm btn-danger btn-delete-teacher" data-id="${t.id}"><i class="fas fa-trash"></i></button>
                </td>
            `;
            tbody.appendChild(tr);
        });

        // Bind delete/edit
        document.querySelectorAll('.btn-delete-teacher').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.currentTarget.getAttribute('data-id');
                if(confirm('Are you sure you want to delete this teacher?')) {
                    DataManager.deleteTeacher(id);
                    showToast('Teacher deleted');
                    refreshDashboardData();
                }
            });
        });

        document.querySelectorAll('.btn-edit-teacher').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.currentTarget.getAttribute('data-id');
                const teacher = DataManager.getData().teachers.find(t => t.id === id);
                if(teacher) {
                    document.getElementById('teacher-id').value = teacher.id;
                    document.getElementById('teacher-name').value = teacher.name;
                    document.getElementById('teacher-subject').value = teacher.subject;
                    document.getElementById('teacher-experience').value = teacher.experience;
                    document.getElementById('teacher-description').value = teacher.description;
                    document.getElementById('teacher-image-base64').value = teacher.image;
                    document.getElementById('teacher-image-preview').innerHTML = `<img src="${teacher.image}" alt="Preview">`;
                    
                    document.getElementById('teacher-modal-title').textContent = 'Edit Teacher';
                    window.openModal('teacher-modal');
                }
            });
        });
    }

    document.getElementById('teacher-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const id = document.getElementById('teacher-id').value;
        const teacher = {
            name: document.getElementById('teacher-name').value,
            subject: document.getElementById('teacher-subject').value,
            experience: document.getElementById('teacher-experience').value,
            description: document.getElementById('teacher-description').value,
            image: document.getElementById('teacher-image-base64').value || 'https://via.placeholder.com/150'
        };

        if(id) {
            DataManager.updateTeacher(id, teacher);
            showToast('Teacher updated successfully');
        } else {
            DataManager.addTeacher(teacher);
            showToast('Teacher added successfully');
        }
        window.closeModal('teacher-modal');
        refreshDashboardData();
    });

    // ==== Programs CRUD ====
    document.getElementById('program-ismain').addEventListener('change', function() {
        const isMain = this.checked;
        if(isMain) {
            document.getElementById('main-course-fields').classList.remove('hidden');
            document.getElementById('special-course-fields').classList.add('hidden');
        } else {
            document.getElementById('main-course-fields').classList.add('hidden');
            document.getElementById('special-course-fields').classList.remove('hidden');
        }
    });

    function renderPrograms(programs) {
        const tbody = document.getElementById('programs-tbody');
        tbody.innerHTML = '';
        programs.forEach(p => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><div class="item-icon"><i class="${p.icon}"></i></div></td>
                <td><strong>${p.name}</strong></td>
                <td><span class="badge">${p.isMain ? 'Main Course' : 'Skill Program'}</span></td>
                <td class="action-btns">
                    <button class="btn btn-sm btn-outline btn-edit-program" data-id="${p.id}"><i class="fas fa-edit"></i></button>
                    <button class="btn btn-sm btn-danger btn-delete-program" data-id="${p.id}"><i class="fas fa-trash"></i></button>
                </td>
            `;
            tbody.appendChild(tr);
        });

        // Bind delete/edit
        document.querySelectorAll('.btn-delete-program').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.currentTarget.getAttribute('data-id');
                if(confirm('Are you sure you want to delete this program?')) {
                    DataManager.deleteProgram(id);
                    showToast('Program deleted');
                    refreshDashboardData();
                }
            });
        });

        document.querySelectorAll('.btn-edit-program').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.currentTarget.getAttribute('data-id');
                const program = DataManager.getData().programs.find(p => p.id === id);
                if(program) {
                    document.getElementById('program-id').value = program.id;
                    document.getElementById('program-name').value = program.name;
                    document.getElementById('program-icon').value = program.icon;
                    document.getElementById('program-ismain').checked = program.isMain;
                    
                    if(program.isMain) {
                        document.getElementById('program-level').value = program.level || '';
                        document.getElementById('program-curriculum').value = program.curriculum || '';
                        document.getElementById('program-tags').value = program.tags ? program.tags.join(', ') : '';
                        
                        document.getElementById('main-course-fields').classList.remove('hidden');
                        document.getElementById('special-course-fields').classList.add('hidden');
                    } else {
                        document.getElementById('program-description').value = program.description || '';
                        document.getElementById('main-course-fields').classList.add('hidden');
                        document.getElementById('special-course-fields').classList.remove('hidden');
                    }
                    
                    document.getElementById('program-modal-title').textContent = 'Edit Program';
                    window.openModal('program-modal');
                }
            });
        });
    }

    document.getElementById('program-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const id = document.getElementById('program-id').value;
        const isMain = document.getElementById('program-ismain').checked;
        
        const program = {
            name: document.getElementById('program-name').value,
            icon: document.getElementById('program-icon').value,
            isMain: isMain
        };

        if(isMain) {
            program.level = document.getElementById('program-level').value;
            program.curriculum = document.getElementById('program-curriculum').value;
            const t = document.getElementById('program-tags').value;
            program.tags = t ? t.split(',').map(tag => tag.trim()) : [];
        } else {
            program.description = document.getElementById('program-description').value;
        }

        if(id) {
            DataManager.updateProgram(id, program);
            showToast('Program updated successfully');
        } else {
            DataManager.addProgram(program);
            showToast('Program added successfully');
        }
        window.closeModal('program-modal');
        refreshDashboardData();
    });

    // ==== FAQs CRUD ====
    function renderFaqs(faqs) {
        const tbody = document.getElementById('faqs-tbody');
        tbody.innerHTML = '';
        faqs.forEach(f => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong>${f.question}</strong></td>
                <td class="action-btns">
                    <button class="btn btn-sm btn-outline btn-edit-faq" data-id="${f.id}"><i class="fas fa-edit"></i></button>
                    <button class="btn btn-sm btn-danger btn-delete-faq" data-id="${f.id}"><i class="fas fa-trash"></i></button>
                </td>
            `;
            tbody.appendChild(tr);
        });

        // Bind delete/edit
        document.querySelectorAll('.btn-delete-faq').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.currentTarget.getAttribute('data-id');
                if(confirm('Are you sure you want to delete this FAQ?')) {
                    DataManager.deleteFaq(id);
                    showToast('FAQ deleted');
                    refreshDashboardData();
                }
            });
        });

        document.querySelectorAll('.btn-edit-faq').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.currentTarget.getAttribute('data-id');
                const faq = DataManager.getData().faqs.find(f => f.id === id);
                if(faq) {
                    document.getElementById('faq-id').value = faq.id;
                    document.getElementById('faq-question').value = faq.question;
                    document.getElementById('faq-answer').value = faq.answer;
                    
                    document.getElementById('faq-modal-title').textContent = 'Edit FAQ';
                    window.openModal('faq-modal');
                }
            });
        });
    }

    document.getElementById('faq-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const id = document.getElementById('faq-id').value;
        const faq = {
            question: document.getElementById('faq-question').value,
            answer: document.getElementById('faq-answer').value
        };

        if(id) {
            DataManager.updateFaq(id, faq);
            showToast('FAQ updated successfully');
        } else {
            DataManager.addFaq(faq);
            showToast('FAQ added successfully');
        }
        window.closeModal('faq-modal');
        refreshDashboardData();
    });

    // ==== Media CRUD ====
    let cropperInstance = null;

    // ==== UI Settings ====
    function populateUISettings(settings) {
        if(!document.getElementById('ui-hero')) return;
        document.getElementById('ui-hero').checked = settings.show_hero !== false;
        document.getElementById('ui-about').checked = settings.show_about !== false;
        document.getElementById('ui-scholars').checked = settings.show_scholars !== false;
        document.getElementById('ui-teachers').checked = settings.show_teachers !== false;
        document.getElementById('ui-courses').checked = settings.show_courses !== false;
        document.getElementById('ui-reviews').checked = settings.show_reviews !== false;
        if(document.getElementById('ui-achievers')) document.getElementById('ui-achievers').checked = settings.show_achievers !== false;
        document.getElementById('ui-faq').checked = settings.show_faq !== false;
        document.getElementById('ui-t-btn').checked = settings.teachers_view_all ? settings.teachers_view_all.enabled !== false : true;
        document.getElementById('ui-t-text').value = settings.teachers_view_all ? (settings.teachers_view_all.text || 'See All Teachers') : 'See All Teachers';
        document.getElementById('ui-c-btn').checked = settings.courses_view_all ? settings.courses_view_all.enabled !== false : true;
        document.getElementById('ui-c-text').value = settings.courses_view_all ? (settings.courses_view_all.text || 'See All Courses') : 'See All Courses';
    }

    document.getElementById('ui-settings-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const settings = {
            show_hero: document.getElementById('ui-hero').checked,
            show_about: document.getElementById('ui-about').checked,
            show_scholars: document.getElementById('ui-scholars').checked,
            show_teachers: document.getElementById('ui-teachers').checked,
            show_courses: document.getElementById('ui-courses').checked,
            show_reviews: document.getElementById('ui-reviews').checked,
            show_achievers: document.getElementById('ui-achievers') ? document.getElementById('ui-achievers').checked : true,
            show_faq: document.getElementById('ui-faq').checked,
            teachers_view_all: { enabled: document.getElementById('ui-t-btn').checked, text: document.getElementById('ui-t-text').value || 'See All Teachers' },
            courses_view_all: { enabled: document.getElementById('ui-c-btn').checked, text: document.getElementById('ui-c-text').value || 'See All Courses' }
        };
        DataManager.updateUISettings(settings);
        showToast('UI Settings Saved');
    });

    // ==== Content Settings ====
    function populateContent(content) {
        if(!document.getElementById('content-hero-title')) return;
        document.getElementById('content-hero-badge').value = content.hero_badge || '';
        document.getElementById('content-hero-title').value = content.hero_title || '';
        document.getElementById('content-hero-subtitle').value = content.hero_subtitle || '';
        document.getElementById('content-about-title').value = content.about_title || '';
        document.getElementById('content-about-p1').value = content.about_p1 || '';
        document.getElementById('content-about-p2').value = content.about_p2 || '';
        document.getElementById('content-phone').value = content.contact_phone || '';
        document.getElementById('content-email').value = content.contact_email || '';
        document.getElementById('content-address').value = content.contact_address || '';
        document.getElementById('content-instagram').value = content.contact_instagram || '';
        document.getElementById('content-location-link').value = content.location_link || '';
    }

    document.getElementById('content-form').addEventListener('submit', (e) => {
        e.preventDefault();
        if(!confirm('Save modifications? This will overwrite the specific text details entered.')) return;
        const content = {
            hero_badge: document.getElementById('content-hero-badge').value,
            hero_title: document.getElementById('content-hero-title').value,
            hero_subtitle: document.getElementById('content-hero-subtitle').value,
            about_title: document.getElementById('content-about-title').value,
            about_p1: document.getElementById('content-about-p1').value,
            about_p2: document.getElementById('content-about-p2').value
        };
        const existing = DataManager.getData().content || {};
        DataManager.updateContent(Object.assign({}, existing, content));
        showToast('Content Settings Saved');
    });

    const contactForm = document.getElementById('contact-form');
    if(contactForm) {
        contactForm.addEventListener('submit', (e) => {
            e.preventDefault();
            if(!confirm('Save contact modifications?')) return;
            const content = {
                contact_phone: document.getElementById('content-phone').value,
                contact_email: document.getElementById('content-email').value,
                contact_address: document.getElementById('content-address').value,
                contact_instagram: document.getElementById('content-instagram').value,
                location_link: document.getElementById('content-location-link').value
            };
            const existing = DataManager.getData().content || {};
            DataManager.updateContent(Object.assign({}, existing, content));
            showToast('Contact Info Saved');
        });
    }


    // ==== Reviews CRUD ====
    function renderReviews(reviews) {
        const tbody = document.getElementById('reviews-tbody');
        if(!tbody) return;
        tbody.innerHTML = '';
        reviews.forEach(r => {
            const tr = document.createElement('tr');
            let mediaHtml = 'None';
            if (r.imageBase64) mediaHtml = `<img src="${r.imageBase64}" style="height:50px; width:50px; object-fit:cover; border-radius:50%;">`;
            else if (r.image) mediaHtml = `<img src="${r.image}" style="height:50px; width:50px; object-fit:cover; border-radius:50%;">`;
            
            tr.innerHTML = `
                <td><strong>${r.name}</strong><br><small style="color:var(--text-muted);">"${(r.text || '').substring(0, 30)}..."</small></td>
                <td style="color:#FBBF24;">${'★'.repeat(r.rating || 5)}${'☆'.repeat(5 - (r.rating || 5))}</td>
                <td>${mediaHtml}</td>
                <td class="action-btns">
                    <button class="btn btn-sm btn-danger btn-delete-review" data-id="${r.id}"><i class="fas fa-trash"></i></button>
                </td>
            `;
            tbody.appendChild(tr);
        });
        document.querySelectorAll('.btn-delete-review').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.currentTarget.getAttribute('data-id');
                if(confirm('Delete this review?')) {
                    DataManager.deleteReview(id);
                    showToast('Review deleted');
                    refreshDashboardData();
                }
            });
        });
    }

    const reviewImageFile = document.getElementById('review-image-file');
    if(reviewImageFile) {
        reviewImageFile.addEventListener('change', function() {
            handleImageUpload(
                this, 
                document.getElementById('review-image-preview'), 
                document.getElementById('review-image-base64')
            );
        });
    }

    document.getElementById('review-form')?.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const review = {
            name: document.getElementById('review-name').value,
            rating: parseInt(document.getElementById('review-rating').value, 10),
            text: document.getElementById('review-text').value,
            imageBase64: document.getElementById('review-image-base64').value
        };
        
        DataManager.addReview(review);
        showToast('Review added successfully');
        document.getElementById('review-form').reset();
        document.getElementById('review-image-base64').value = '';
        document.getElementById('review-image-preview').innerHTML = '';
        window.closeModal('review-modal');
        refreshDashboardData();
    });

    // ==== Enrollments Manager ====
    let customFields = [];
    
    function renderCustomFields() {
        const list = document.getElementById('custom-fields-list');
        if(!list) return;
        list.innerHTML = '';
        customFields.forEach((f, idx) => {
            const div = document.createElement('div');
            div.style.display = 'flex';
            div.style.gap = '10px';
            div.innerHTML = `
                <input type="text" value="${f.name}" placeholder="Field Name (e.g. Grade)" onchange="window.updateCustomField(${idx}, this.value)" style="flex:1" required>
                <button type="button" class="btn btn-danger btn-sm" onclick="window.removeCustomField(${idx})"><i class="fas fa-trash"></i></button>
            `;
            list.appendChild(div);
        });
    }

    window.addCustomField = function() {
        customFields.push({ name: '', type: 'text', required: false });
        renderCustomFields();
    };
    window.removeCustomField = function(idx) {
        customFields.splice(idx, 1);
        renderCustomFields();
    };
    window.updateCustomField = function(idx, val) {
        customFields[idx].name = val;
    };

    window.populateEnrollments = function(data) {
        if(!document.getElementById('enroll-btn-text')) return;
        const set = data.enroll_settings || { button_text: 'Enroll Today', action: 'modal', custom_fields: [] };
        document.getElementById('enroll-btn-text').value = set.button_text;
        if(document.getElementById('enroll-change-action')) document.getElementById('enroll-change-action').value = 'modal';
        if(document.getElementById('enroll-redirect-url')) document.getElementById('enroll-redirect-url').value = '';
        
        const grp = document.getElementById('enroll-redirect-group');
        if(grp) grp.style.display = 'none';
        
        customFields = set.custom_fields || [];
        renderCustomFields();

        // Render Table
        const tbody = document.getElementById('enrollments-tbody');
        tbody.innerHTML = '';
        const subs = data.enroll_submissions || [];
        subs.forEach(s => {
            const tr = document.createElement('tr');
            let customHtml = '';
            if(s.customData) {
                Object.keys(s.customData).forEach(k => {
                    customHtml += `<div><strong>${k}:</strong> ${s.customData[k]}</div>`;
                });
            }
            tr.innerHTML = `
                <td>${new Date(s.date).toLocaleDateString()}</td>
                <td>
                    <strong>${s.name}</strong><br>
                    <small>📞 ${s.phone}</small><br>
                    <small>✉️ ${s.email}</small>
                </td>
                <td>${customHtml || '-'}</td>
                <td class="action-btns"><button class="btn btn-sm btn-danger btn-delete-enroll" data-id="${s.id}"><i class="fas fa-trash"></i></button></td>
            `;
            tbody.appendChild(tr);
        });

        document.querySelectorAll('.btn-delete-enroll').forEach(btn => {
            btn.addEventListener('click', (e) => {
                if(confirm('Delete this submission?')) {
                    DataManager.deleteSubmission(e.currentTarget.getAttribute('data-id'));
                    refreshDashboardData();
                }
            });
        });
    }

    const enrollChangeAction = document.getElementById('enroll-change-action');
    if(enrollChangeAction) {
        enrollChangeAction.addEventListener('change', function() {
            const grp = document.getElementById('enroll-redirect-group');
            if(grp) grp.style.display = 'none';
        });
    }

    const enrollSettingsForm = document.getElementById('enroll-settings-form');
    if(enrollSettingsForm) {
        enrollSettingsForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const settings = {
                button_text: document.getElementById('enroll-btn-text').value,
                action: 'modal',
                redirect_url: '',
                custom_fields: customFields
            };
            DataManager.updateEnrollSettings(settings);
            showToast('Enrollment Settings Saved');
        });
    }

    const btnAddCustom = document.getElementById('btn-add-custom-field');
    if(btnAddCustom) btnAddCustom.addEventListener('click', window.addCustomField);

    const btnExport = document.getElementById('btn-export-csv');
    if(btnExport) btnExport.addEventListener('click', () => {
        const subs = DataManager.getData().enroll_submissions || [];
        if(subs.length === 0) return alert('No data to export.');
        
        let headers = ['Date', 'Name', 'Phone', 'Email'];
        let customKeys = new Set();
        subs.forEach(s => { if(s.customData) Object.keys(s.customData).forEach(k => customKeys.add(k)); });
        headers = headers.concat(Array.from(customKeys));

        let csv = headers.join(',') + '\\n';
        subs.forEach(s => {
            let row = [
                s.date,
                `"${s.name}"`,
                `"${s.phone}"`,
                `"${s.email}"`
            ];
            Array.from(customKeys).forEach(k => row.push(`"${(s.customData && s.customData[k]) ? s.customData[k] : ''}"`));
            csv += row.join(',') + '\\n';
        });

        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'brainybox_leads.csv';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    });

    // Enrollment Notifications
    window.updateNotificationBadge = function() {
        const data = DataManager.getData();
        const subs = data.enroll_submissions || [];
        const total = subs.length;
        
        let lastRead = parseInt(localStorage.getItem('brainyBoxLastReadSubmissions') || '0', 10);
        
        const badge = document.getElementById('notification-badge');
        if (badge) {
            const unread = total - lastRead;
            if (unread > 0) {
                badge.textContent = unread;
                badge.style.display = 'block';
            } else {
                badge.style.display = 'none';
            }
        }
    };

    const notificationBellBtn = document.getElementById('notification-bell');
    if (notificationBellBtn) {
        notificationBellBtn.addEventListener('click', () => {
            const data = DataManager.getData();
            const subs = data.enroll_submissions || [];
            localStorage.setItem('brainyBoxLastReadSubmissions', subs.length.toString());
            window.updateNotificationBadge();
            const enrollTab = document.querySelector('.nav-item[data-target="panel-enrollments"]');
            if(enrollTab) enrollTab.click();
        });
    }

    const enrollNav = document.querySelector('.nav-item[data-target="panel-enrollments"]');
    if (enrollNav) {
        enrollNav.addEventListener('click', () => {
            setTimeout(() => {
                const data = DataManager.getData();
                const subs = data.enroll_submissions || [];
                localStorage.setItem('brainyBoxLastReadSubmissions', subs.length.toString());
                window.updateNotificationBadge();
            }, 100);
        });
    }

    // ==== Achievers Manager removed ====

    // ==== Image Gallery Manager ====
    function renderGallery(images) {
        const grid = document.getElementById('gallery-grid');
        if(!grid) return;
        grid.innerHTML = '';
        images.forEach(img => {
            const div = document.createElement('div');
            div.className = 'glass-card';
            div.style.padding = '10px';
            div.style.position = 'relative';
            div.innerHTML = `
                <img src="${img.image}" alt="${img.caption || 'Gallery Image'}" style="width:100%; height:120px; object-fit:cover; border-radius:4px; margin-bottom:10px;">
                <p style="font-size:0.85rem; text-align:center; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; margin-bottom:10px;">${img.caption || ''}</p>
                <button class="btn btn-sm btn-danger btn-delete-gallery" data-id="${img.id}" style="width:100%;"><i class="fas fa-trash"></i> Delete</button>
            `;
            grid.appendChild(div);
        });

        // Bind delete
        document.querySelectorAll('.btn-delete-gallery').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.currentTarget.getAttribute('data-id');
                if(confirm('Are you sure you want to delete this image?')) {
                    DataManager.deleteGalleryImage(id);
                    showToast('Image deleted');
                    refreshDashboardData();
                }
            });
        });
    }

    const galleryForm = document.getElementById('gallery-form');
    if(galleryForm) {
        galleryForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const urlInput = document.getElementById('gallery-photo-url').value;
            const base64Input = document.getElementById('gallery-photo-base64').value;
            
            let finalImage = urlInput ? urlInput : base64Input;
            if(!finalImage) return alert('Please upload an image or provide a URL.');
            
            const imgParams = {
                image: finalImage,
                imageUrl: urlInput,
                caption: document.getElementById('gallery-caption').value
            };

            DataManager.addGalleryImage(imgParams);
            showToast('Gallery Image added successfully');
            window.closeModal('gallery-modal');
            refreshDashboardData();
        });
    }

    // Initialize badge
    window.updateNotificationBadge();

});

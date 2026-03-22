const LIVE_KEY = 'brainybox_data';
const DRAFT_KEY = 'brainybox_data_draft';

// Firebase Config
const firebaseConfig = {
    apiKey: "AIzaSyBsmSvrRfyz3QAq0zHtW90G7oJWLvj19hk",
    authDomain: "brainybox-a1dbf.firebaseapp.com",
    projectId: "brainybox-a1dbf",
    storageBucket: "brainybox-a1dbf.firebasestorage.app",
    messagingSenderId: "536060448430",
    appId: "1:536060448430:web:d575c7b683eb648eb2273f"
};

const defaultData = {
    studentsEnrolled: 220,
    teachers: [
        {
            id: 't1',
            name: 'Ankita Saklecha',
            subject: 'Science Teacher',
            description: 'Passionate educator focused on conceptual clarity and student growth. Known for personalized attention and innovative teaching methods.',
            experience: '6+',
            image: 'assets/ankita.png'
        },
        {
            id: 't2',
            name: 'Pooja Bhansali',
            subject: 'Mathematics Teacher',
            description: 'Mathematics expert with strong problem-solving techniques. Makes complex concepts simple and engaging.',
            experience: '6+',
            image: 'assets/pooja.jpg'
        }
    ],
    programs: [
        {
            id: 'p1',
            name: 'Academic Coaching',
            level: 'Class 1 to 10',
            curriculum: 'CBSE Curriculum',
            tags: ['English', 'Science', 'Mathematics', 'Social Science'],
            icon: 'fas fa-book-open',
            isMain: true
        },
        {
            id: 'p2',
            name: 'Abacus Classes',
            description: 'Master mental math & focus',
            icon: 'fas fa-calculator',
            isMain: false
        },
        {
            id: 'p3',
            name: 'Skill-based Programs',
            description: 'Creative and cognitive development',
            icon: 'fas fa-brain',
            isMain: false
        }
    ],
    faqs: [
        {
            id: 'f1',
            question: 'What curriculum do you follow?',
            answer: 'We strictly follow the CBSE curriculum for Classes 1 to 10, ensuring students are well-prepared for their school exams and board exams.'
        },
        {
            id: 'f2',
            question: 'Do you offer classes for pre-primary students?',
            answer: 'Yes, we have specialized early foundation programs for LKG and UKG students, including Phonics and Abacus to build strong basics.'
        },
        {
            id: 'f3',
            question: 'What is the experience level of the teachers?',
            answer: "All our teachers, including Ankita ma'am and Pooja ma'am, possess 6+ years of rich teaching experience."
        }
    ],

    ui_settings: {
        teachers_view_all: { enabled: true, text: "See All Teachers" },
        courses_view_all: { enabled: true, text: "See All Courses" },
        carousel_arrows: true,
        items_per_row: 3,
        show_hero: true,
        show_about: true,
        show_teachers: true,
        show_courses: true,
        show_reviews: true,
        show_achievers: true,
        show_faq: true,
        show_contact: true
    },
    enroll_settings: {
        button_text: "Enroll Today",
        action: "modal",
        redirect_url: "",
        custom_fields: []
    },
    enroll_submissions: [],
    gallery_images: [],
    reviews: [
        { id: 'r1', name: 'Raj Kumar', text: 'Excellent teaching and care!', rating: 5 },
        { id: 'r2', name: 'Simran K.', text: 'My child learned so much this year.', rating: 5 }
    ],
    achievers: [],
    content: {
        site_title: "BrainyBox",
        hero_badge: "Trusted & Reputed",
        hero_title: "Shape Your Child's Future with <span class='highlight'>BrainyBox</span>",
        hero_subtitle: "Empowering minds with expert guidance, innovative teaching methods, and a 100% passing rate.",
        about_title: "Welcome to BrainyBox",
        about_p1: "At BrainyBox, we believe that every child has a unique potential waiting to be unlocked. Our interactive learning modules ensure that education is not just about memorization, but true understanding.",
        about_p2: "With state-of-the-art facilities and a passionate team of educators, we strive to provide an environment where curiosity thrives.",
        contact_phone: "+91 8275200281",
        contact_email: "mom.brainybox@gmail.com",
        contact_address: "2nd floor, Msr Square complex, Queenstown Society, Udyog Nagar, outside, Chinchwad, Pimpri-Chinchwad, Maharashtra 411033",
        contact_instagram: "@brainybox.classes",
        contact_facebook: "@BrainyBoxOfficial",
        location_link: "https://www.google.com/maps",
        result_percentage: "100",
        floating_icon_image: "assets/logo.jpg",
        floating_icon_text: "Passing Rate"
    }
};

const DataManager = {
    localCache: null,
    isDraftMode: function() {
        if (typeof window !== 'undefined') {
            return window.location.pathname.includes('admin.html') || window.location.search.includes('preview=true');
        }
        return false;
    },
    getKey: function() {
        return this.isDraftMode() ? DRAFT_KEY : LIVE_KEY;
    },
    init: function() {
        // Ensure initial sync from localStorage for immediate visual rendering
        if (!this.localCache) {
            let dataStr = localStorage.getItem(LIVE_KEY);
            if (dataStr) {
                this.localCache = this.deepMerge(JSON.parse(JSON.stringify(defaultData)), JSON.parse(dataStr));
            } else {
                this.localCache = this.deepMerge(JSON.parse(JSON.stringify(defaultData)), {});
            }
        }

        // Initialize Firebase Only Once
        if (typeof firebase !== 'undefined' && !window.firebaseInitialized) {
            firebase.initializeApp(firebaseConfig);
            window.db = firebase.firestore();
            window.storage = firebase.storage();
            window.auth = firebase.auth();
            window.firebaseInitialized = true;
            
            // Setup real-time listener for the data document in Firebase
            window.db.collection('appData').doc('brainybox_data').onSnapshot((doc) => {
                if (doc.exists) {
                    this.localCache = this.deepMerge(JSON.parse(JSON.stringify(defaultData)), doc.data());
                    localStorage.setItem(LIVE_KEY, JSON.stringify(this.localCache));
                    window.dispatchEvent(new Event('brainyboxDataUpdated'));
                    
                    if (typeof updateNotificationBadge !== 'undefined') {
                        updateNotificationBadge();
                    }
                } else {
                    // Document doesn't exist yet in cloud, seed it with our local cache / defaults
                    if (this.localCache) {
                        this.saveToFirebase(this.localCache);
                    }
                }
            });
        }
    },
    saveToFirebase: function(data) {
        if (window.db) {
            // Firestore does not allow 'undefined' values.
            // JSON.parse(JSON.stringify(data)) automatically strips them out cleanly.
            const safeData = JSON.parse(JSON.stringify(data));
            window.db.collection('appData').doc('brainybox_data').set(safeData)
                .catch(console.error);
        }
    },
    publishDraft: function() {
        // In the Firebase paradigm live sync handles state, but keep function for compat
        return true;
    },
    discardDraft: function() {
        return true;
    },
    deepMerge: function(target, source) {
        if (!source) return target;
        for (const key of Object.keys(source)) {
            if (source[key] instanceof Object && key in target && !Array.isArray(source[key])) {
                Object.assign(source[key], this.deepMerge(target[key], source[key]));
            }
        }
        Object.assign(target || {}, source);
        return target;
    },
    getData: function() {
        this.init();
        return this.localCache;
    },
    saveData: function(data) {
        try {
            this.localCache = data;
            localStorage.setItem(this.getKey(), JSON.stringify(data));
            this.saveToFirebase(data);
            window.dispatchEvent(new Event('brainyboxDataUpdated'));
        } catch (e) {
            console.error("Storage Error:", e);
        }
    },
    updateStudentsEnrolled: function(count) {
        let d = this.getData(); d.studentsEnrolled = count; this.saveData(d);
    },
    // GENERIC CRUD GENERATOR
    _addEntity: function(key, entity) { let d=this.getData(); entity.id = key.charAt(0) + '_' + Date.now(); d[key].push(entity); this.saveData(d); },
    _updateEntity: function(key, id, entity) {
        let d=this.getData(); const idx=d[key].findIndex(x=>x.id===id);
        if(idx>-1) { entity.id=id; d[key][idx]=entity; this.saveData(d); }
    },
    _deleteEntity: function(key, id) { let d=this.getData(); d[key]=d[key].filter(x=>x.id!==id); this.saveData(d); },

    // Existing Specifics
    addTeacher: function(t) { this._addEntity('teachers', t); },
    updateTeacher: function(id, t) { this._updateEntity('teachers', id, t); },
    deleteTeacher: function(id) { this._deleteEntity('teachers', id); },
    addProgram: function(p) { this._addEntity('programs', p); },
    updateProgram: function(id, p) { this._updateEntity('programs', id, p); },
    deleteProgram: function(id) { this._deleteEntity('programs', id); },
    // Gallery & Achievers & Reviews
    addGalleryImage: function(img) { this._addEntity('gallery_images', img); },
    deleteGalleryImage: function(id) { this._deleteEntity('gallery_images', id); },
    addAchiever: function(ach) { this._addEntity('achievers', ach); },
    deleteAchiever: function(id) { this._deleteEntity('achievers', id); },
    addReview: function(r) { this._addEntity('reviews', r); },
    deleteReview: function(id) { this._deleteEntity('reviews', id); },
    addFaq: function(f) { this._addEntity('faqs', f); },
    updateFaq: function(id, f) { this._updateEntity('faqs', id, f); },
    deleteFaq: function(id) { this._deleteEntity('faqs', id); },

    // Enrollment
    addSubmission: function(s) { 
        let d = this.getData();
        if(!d.enroll_submissions) d.enroll_submissions = [];
        s.id = 'e_' + Date.now();
        d.enroll_submissions.push(s);
        this.saveData(d);
    },
    deleteSubmission: function(id) { 
        let d = this.getData();
        if(d.enroll_submissions) {
            d.enroll_submissions = d.enroll_submissions.filter(x => x.id !== id);
            this.saveData(d);
        }
    },
    
    // Settings & Content Updates
    updateUISettings: function(settings) {
        let d = this.getData(); d.ui_settings = settings; this.saveData(d);
    },
    updateEnrollSettings: function(settings) {
        let d = this.getData(); d.enroll_settings = settings; this.saveData(d);
    },
    updateContent: function(content) {
        let d = this.getData(); d.content = content; this.saveData(d);
    }
};

window.addEventListener('storage', function(e) {
    if (e.key === DataManager.getKey()) {
        window.dispatchEvent(new Event('brainyboxDataUpdated'));
    }
});

DataManager.init();

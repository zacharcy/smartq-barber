/**
 * seed.js — Nuke the DB and populate 10 realistic Sri Lankan businesses
 * Run:  node server/seed.js
 */
import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
dotenv.config();

const DB_NAME = process.env.DB_NAME || 'smartq_salon';

// ── connection WITHOUT a default database (so we can DROP/CREATE) ──
async function getRootConnection() {
    return mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '3306'),
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        multipleStatements: true,
    });
}

// ── DDL ──
const TABLES_SQL = `
CREATE TABLE IF NOT EXISTS companies (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    phone VARCHAR(50) DEFAULT NULL,
    category VARCHAR(100) DEFAULT NULL,
    address TEXT DEFAULT NULL,
    city VARCHAR(100) DEFAULT NULL,
    country VARCHAR(100) DEFAULT 'Sri Lanka',
    timezone VARCHAR(50) DEFAULT 'Asia/Colombo',
    currency VARCHAR(10) DEFAULT 'LKR',
    description TEXT DEFAULT NULL,
    image_url TEXT DEFAULT NULL,
    keywords TEXT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS roles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    company_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_role (company_id, name),
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS staff (
    id INT AUTO_INCREMENT PRIMARY KEY,
    company_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) DEFAULT NULL,
    role VARCHAR(100) DEFAULT 'Staff',
    color VARCHAR(20) DEFAULT '#D4AF37',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS services (
    id INT AUTO_INCREMENT PRIMARY KEY,
    company_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    duration_min INT DEFAULT 30,
    price DECIMAL(10,2) DEFAULT 0.00,
    category VARCHAR(100) DEFAULT 'General',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS clients (
    id INT AUTO_INCREMENT PRIMARY KEY,
    company_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) DEFAULT NULL,
    phone VARCHAR(50) DEFAULT NULL,
    notes TEXT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS appointments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    company_id INT NOT NULL,
    client_id INT DEFAULT NULL,
    staff_id INT DEFAULT NULL,
    service_id INT DEFAULT NULL,
    start_time DATETIME NOT NULL,
    end_time DATETIME NOT NULL,
    status VARCHAR(50) DEFAULT 'confirmed',
    source VARCHAR(20) DEFAULT 'manual',
    notes TEXT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE SET NULL,
    FOREIGN KEY (staff_id) REFERENCES staff(id) ON DELETE SET NULL,
    FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS admins (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
`;

// ── 10 Sri Lankan businesses ──
const COMPANIES = [
    {
        name: 'Colombo Glamour Studio',
        email: 'info@colomboglamour.lk',
        phone: '+94 11 234 5678',
        category: 'Hair Salon',
        address: '42 Galle Road, Colombo 03',
        city: 'Colombo',
        description: 'Colombo\'s premier luxury hair salon offering cutting-edge styles, colour transformations, and bridal packages in the heart of Kollupitiya.',
        image_url: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?q=80&w=800',
        keywords: 'haircut, colour, balayage, bridal hair, keratin, blow dry, Colombo salon',
        staff: [
            { name: 'Nimal Perera', email: 'nimal@colomboglamour.lk', role: 'Owner', color: '#D4AF37' },
            { name: 'Shalini Fernando', email: 'shalini@colomboglamour.lk', role: 'Senior Stylist', color: '#E74C3C' },
            { name: 'Kasun Silva', email: 'kasun@colomboglamour.lk', role: 'Stylist', color: '#3498DB' },
            { name: 'Dilani Jayawardena', email: 'dilani@colomboglamour.lk', role: 'Colourist', color: '#2ECC71' },
        ],
        services: [
            { name: 'Ladies Haircut & Blow Dry', duration_min: 60, price: 3500, category: 'Hair' },
            { name: 'Gents Haircut', duration_min: 30, price: 1500, category: 'Hair' },
            { name: 'Full Hair Colouring', duration_min: 120, price: 8000, category: 'Colour' },
            { name: 'Highlights / Balayage', duration_min: 150, price: 12000, category: 'Colour' },
            { name: 'Keratin Treatment', duration_min: 180, price: 15000, category: 'Treatment' },
            { name: 'Bridal Hair Package', duration_min: 180, price: 25000, category: 'Bridal' },
        ],
        clients: [
            { name: 'Ayesha Wickramasinghe', email: 'ayesha.w@gmail.com', phone: '+94 77 123 4567', notes: 'Prefers organic products' },
            { name: 'Tharushi De Silva', email: 'tharushi.ds@gmail.com', phone: '+94 71 234 5678', notes: 'Regular monthly colour' },
            { name: 'Rashmi Gunawardena', email: 'rashmi.g@outlook.com', phone: '+94 76 345 6789', notes: 'Sensitive scalp' },
            { name: 'Priyanka Ratnayake', email: 'priyanka.r@yahoo.com', phone: '+94 78 456 7890', notes: 'Bridal client - wedding March 2026' },
            { name: 'Malini Jayasuriya', email: 'malini.j@gmail.com', phone: '+94 70 567 8901', notes: '' },
        ],
    },
    {
        name: 'Kandy Royal Spa',
        email: 'hello@kandyroyal.lk',
        phone: '+94 81 222 3344',
        category: 'Spa & Wellness',
        address: '15 Peradeniya Road, Kandy',
        city: 'Kandy',
        description: 'An award-winning Ayurvedic spa nestled in the hill country, offering traditional Sri Lankan wellness therapies with a modern touch.',
        image_url: 'https://images.unsplash.com/photo-1600334129128-685c5582fd35?q=80&w=800',
        keywords: 'ayurveda, massage, hot stone, shirodhara, couples spa, reflexology, Kandy wellness',
        staff: [
            { name: 'Chaminda Dissanayake', email: 'chaminda@kandyroyal.lk', role: 'Owner', color: '#D4AF37' },
            { name: 'Kumari Bandara', email: 'kumari@kandyroyal.lk', role: 'Senior Therapist', color: '#9B59B6' },
            { name: 'Saman Wijesinghe', email: 'saman@kandyroyal.lk', role: 'Therapist', color: '#1ABC9C' },
            { name: 'Nimali Herath', email: 'nimali@kandyroyal.lk', role: 'Receptionist', color: '#F39C12' },
        ],
        services: [
            { name: 'Ayurvedic Full Body Massage', duration_min: 90, price: 7500, category: 'Massage' },
            { name: 'Hot Stone Therapy', duration_min: 75, price: 6500, category: 'Massage' },
            { name: 'Herbal Facial', duration_min: 60, price: 4500, category: 'Facial' },
            { name: 'Shirodhara Treatment', duration_min: 45, price: 5500, category: 'Ayurveda' },
            { name: 'Couple Spa Package', duration_min: 120, price: 14000, category: 'Package' },
            { name: 'Foot Reflexology', duration_min: 45, price: 3000, category: 'Massage' },
        ],
        clients: [
            { name: 'Ruwan Abeysekera', email: 'ruwan.a@gmail.com', phone: '+94 77 111 2233', notes: 'Monthly wellness package' },
            { name: 'Sachini Kulathunga', email: 'sachini.k@gmail.com', phone: '+94 71 222 3344', notes: 'Allergic to certain essential oils' },
            { name: 'Dinesh Rajapaksha', email: 'dinesh.r@outlook.com', phone: '+94 76 333 4455', notes: 'Corporate client' },
            { name: 'Gayathri Senanayake', email: 'gayathri.s@gmail.com', phone: '+94 78 444 5566', notes: '' },
            { name: 'Amara Tennakoon', email: 'amara.t@yahoo.com', phone: '+94 70 555 6677', notes: 'Prefers female therapist' },
        ],
    },
    {
        name: 'Galle Fort Barber Co.',
        email: 'bookings@gallefortbarber.lk',
        phone: '+94 91 223 4456',
        category: 'Barber',
        address: '78 Church Street, Galle Fort',
        city: 'Galle',
        description: 'A heritage barbershop inside the iconic Galle Fort, blending old-world charm with modern grooming techniques for the discerning gentleman.',
        image_url: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?q=80&w=800',
        keywords: 'barber, gentleman cut, hot towel shave, beard trim, kids haircut, Galle Fort',
        staff: [
            { name: 'Anura Weerasinghe', email: 'anura@gallefortbarber.lk', role: 'Owner', color: '#D4AF37' },
            { name: 'Thilina Jayasekara', email: 'thilina@gallefortbarber.lk', role: 'Senior Barber', color: '#E67E22' },
            { name: 'Roshan Mendis', email: 'roshan@gallefortbarber.lk', role: 'Barber', color: '#2980B9' },
        ],
        services: [
            { name: 'Classic Gentleman\'s Cut', duration_min: 30, price: 1200, category: 'Hair' },
            { name: 'Beard Trim & Shape', duration_min: 20, price: 800, category: 'Beard' },
            { name: 'Hot Towel Shave', duration_min: 40, price: 1500, category: 'Shave' },
            { name: 'Hair & Beard Combo', duration_min: 50, price: 2000, category: 'Combo' },
            { name: 'Kids Haircut', duration_min: 20, price: 600, category: 'Hair' },
        ],
        clients: [
            { name: 'Mark Van Der Berg', email: 'mark.vdb@gmail.com', phone: '+94 77 900 1122', notes: 'Tourist - regular visitor' },
            { name: 'Lahiru Gamage', email: 'lahiru.g@gmail.com', phone: '+94 71 800 2233', notes: 'Bi-weekly appointment' },
            { name: 'Rajitha De Mel', email: 'rajitha.dm@outlook.com', phone: '+94 76 700 3344', notes: '' },
            { name: 'Stefan Mueller', email: 'stefan.m@web.de', phone: '+94 78 600 4455', notes: 'German expat' },
            { name: 'Ishara Pathirana', email: 'ishara.p@gmail.com', phone: '+94 70 500 5566', notes: 'Sensitive skin' },
            { name: 'Dilan Kumarasiri', email: 'dilan.k@gmail.com', phone: '+94 77 400 6677', notes: '' },
        ],
    },
    {
        name: 'Negombo Nails & Beauty',
        email: 'hello@negombonails.lk',
        phone: '+94 31 227 8899',
        category: 'Nail Salon',
        address: '23 Lewis Place, Negombo',
        city: 'Negombo',
        description: 'The coastal city\'s favourite nail bar and beauty lounge, specialising in gel art, acrylics, and luxurious mani-pedi experiences.',
        image_url: 'https://images.unsplash.com/photo-1604654894610-df63bc536371?q=80&w=800',
        keywords: 'nails, gel polish, acrylic, nail art, manicure, pedicure, Negombo beauty',
        staff: [
            { name: 'Nadeesha Peris', email: 'nadeesha@negombonails.lk', role: 'Owner', color: '#D4AF37' },
            { name: 'Iresha Cooray', email: 'iresha@negombonails.lk', role: 'Nail Technician', color: '#E91E63' },
            { name: 'Shanika Dias', email: 'shanika@negombonails.lk', role: 'Nail Technician', color: '#FF9800' },
            { name: 'Chamari Fernando', email: 'chamari@negombonails.lk', role: 'Beauty Therapist', color: '#8E44AD' },
        ],
        services: [
            { name: 'Classic Manicure', duration_min: 30, price: 1500, category: 'Nails' },
            { name: 'Classic Pedicure', duration_min: 45, price: 2000, category: 'Nails' },
            { name: 'Gel Polish Application', duration_min: 45, price: 2500, category: 'Nails' },
            { name: 'Acrylic Full Set', duration_min: 90, price: 5000, category: 'Nails' },
            { name: 'Nail Art (per nail)', duration_min: 15, price: 300, category: 'Nails' },
            { name: 'Mani-Pedi Combo', duration_min: 75, price: 3200, category: 'Package' },
        ],
        clients: [
            { name: 'Nimasha Rodrigo', email: 'nimasha.r@gmail.com', phone: '+94 77 321 1234', notes: 'Gel regular' },
            { name: 'Sanduni Perera', email: 'sanduni.p@gmail.com', phone: '+94 71 321 2345', notes: '' },
            { name: 'Olivia Thompson', email: 'olivia.t@gmail.com', phone: '+94 76 321 3456', notes: 'British expat' },
            { name: 'Hashini Wickremasinghe', email: 'hashini.w@outlook.com', phone: '+94 78 321 4567', notes: 'Prefers natural products' },
            { name: 'Renuka Samaraweera', email: 'renuka.s@yahoo.com', phone: '+94 70 321 5678', notes: '' },
        ],
    },
    {
        name: 'Ella Glow Skin Clinic',
        email: 'care@ellaglow.lk',
        phone: '+94 57 222 8800',
        category: 'Skin Clinic',
        address: '5 Main Street, Ella',
        city: 'Ella',
        description: 'A boutique skincare clinic in the misty hills of Ella, offering advanced facials, peels, and natural skincare treatments inspired by local botanicals.',
        image_url: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?q=80&w=800',
        keywords: 'facial, chemical peel, microdermabrasion, acne treatment, LED therapy, skincare, Ella',
        staff: [
            { name: 'Dr. Anusha Wimalasena', email: 'anusha@ellaglow.lk', role: 'Owner', color: '#D4AF37' },
            { name: 'Kavindya Rathnayake', email: 'kavindya@ellaglow.lk', role: 'Aesthetician', color: '#27AE60' },
            { name: 'Hiruni Karunaratne', email: 'hiruni@ellaglow.lk', role: 'Therapist', color: '#3498DB' },
        ],
        services: [
            { name: 'Deep Cleansing Facial', duration_min: 60, price: 4000, category: 'Facial' },
            { name: 'Chemical Peel', duration_min: 45, price: 6000, category: 'Treatment' },
            { name: 'Microdermabrasion', duration_min: 60, price: 7500, category: 'Treatment' },
            { name: 'Anti-Ageing Facial', duration_min: 75, price: 5500, category: 'Facial' },
            { name: 'Acne Treatment', duration_min: 45, price: 3500, category: 'Treatment' },
            { name: 'LED Light Therapy', duration_min: 30, price: 3000, category: 'Treatment' },
        ],
        clients: [
            { name: 'Hasanthi Ediriweera', email: 'hasanthi.e@gmail.com', phone: '+94 77 555 1111', notes: 'Monthly facial routine' },
            { name: 'Jessica Hartley', email: 'jessica.h@gmail.com', phone: '+94 71 555 2222', notes: 'UK tourist - seasonal' },
            { name: 'Thilini Abeykoon', email: 'thilini.a@gmail.com', phone: '+94 76 555 3333', notes: 'Acne-prone skin' },
            { name: 'Kaushalya Jayasinghe', email: 'kaushalya.j@outlook.com', phone: '+94 78 555 4444', notes: '' },
        ],
    },
    {
        name: 'Jaffna Heritage Salon',
        email: 'team@jaffnaheritage.lk',
        phone: '+94 21 222 5566',
        category: 'Hair Salon',
        address: '90 Hospital Road, Jaffna',
        city: 'Jaffna',
        description: 'A family-run salon celebrating the rich beauty traditions of the Northern Province, specialising in traditional oil treatments and modern styling.',
        image_url: 'https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?q=80&w=800',
        keywords: 'oil treatment, threading, henna, mehendi, hair straightening, Jaffna salon',
        staff: [
            { name: 'Thanushan Krishnakumar', email: 'thanushan@jaffnaheritage.lk', role: 'Owner', color: '#D4AF37' },
            { name: 'Priya Sivanesarajah', email: 'priya@jaffnaheritage.lk', role: 'Senior Stylist', color: '#C0392B' },
            { name: 'Kajan Navaratnam', email: 'kajan@jaffnaheritage.lk', role: 'Stylist', color: '#16A085' },
            { name: 'Meena Rajaratnam', email: 'meena@jaffnaheritage.lk', role: 'Junior Stylist', color: '#8E44AD' },
        ],
        services: [
            { name: 'Traditional Oil Hair Treatment', duration_min: 60, price: 2500, category: 'Treatment' },
            { name: 'Ladies Haircut', duration_min: 45, price: 2000, category: 'Hair' },
            { name: 'Gents Haircut', duration_min: 25, price: 800, category: 'Hair' },
            { name: 'Hair Straightening', duration_min: 120, price: 8000, category: 'Treatment' },
            { name: 'Threading (Eyebrows)', duration_min: 15, price: 400, category: 'Beauty' },
            { name: 'Henna Mehendi', duration_min: 90, price: 3500, category: 'Beauty' },
        ],
        clients: [
            { name: 'Vasanthi Selvarajah', email: 'vasanthi.s@gmail.com', phone: '+94 77 610 1111', notes: 'Loyal customer since 2020' },
            { name: 'Lakshmi Sivakumar', email: 'lakshmi.sv@gmail.com', phone: '+94 71 610 2222', notes: '' },
            { name: 'Aravind Pushparajah', email: 'aravind.p@gmail.com', phone: '+94 76 610 3333', notes: 'Weekly haircut' },
            { name: 'Saranya Thiruchelvam', email: 'saranya.t@outlook.com', phone: '+94 78 610 4444', notes: 'Bride - Apr 2026' },
            { name: 'Nirmala Kandasamy', email: 'nirmala.k@yahoo.com', phone: '+94 70 610 5555', notes: '' },
        ],
    },
    {
        name: 'Mirissa Beach Beauty',
        email: 'aloha@mirissabeauty.lk',
        phone: '+94 41 225 6677',
        category: 'Beauty Salon',
        address: '12 Beach Road, Mirissa',
        city: 'Mirissa',
        description: 'A tropical beachside beauty parlour catering to locals and tourists alike, with express beauty services perfect before a sunset dinner.',
        image_url: 'https://images.unsplash.com/photo-1519823551278-64ac92734fb1?q=80&w=800',
        keywords: 'makeup, blow dry, beach waves, lash extensions, waxing, eyebrow tinting, Mirissa',
        staff: [
            { name: 'Chathurika Liyanage', email: 'chathurika@mirissabeauty.lk', role: 'Owner', color: '#D4AF37' },
            { name: 'Kavisha Madhushani', email: 'kavisha@mirissabeauty.lk', role: 'Beautician', color: '#E91E63' },
            { name: 'Ranudi Wijeratne', email: 'ranudi@mirissabeauty.lk', role: 'Makeup Artist', color: '#FF5722' },
        ],
        services: [
            { name: 'Express Blow Dry', duration_min: 30, price: 1500, category: 'Hair' },
            { name: 'Beach Waves Styling', duration_min: 45, price: 2500, category: 'Hair' },
            { name: 'Full Face Makeup', duration_min: 60, price: 5000, category: 'Makeup' },
            { name: 'Eyebrow Tinting', duration_min: 20, price: 1000, category: 'Beauty' },
            { name: 'Lash Extensions', duration_min: 90, price: 6000, category: 'Beauty' },
            { name: 'Waxing Full Legs', duration_min: 45, price: 2500, category: 'Waxing' },
        ],
        clients: [
            { name: 'Emma Rodriguez', email: 'emma.r@gmail.com', phone: '+94 77 700 1111', notes: 'Spanish tourist' },
            { name: 'Achini Ratnasiri', email: 'achini.r@gmail.com', phone: '+94 71 700 2222', notes: '' },
            { name: 'Sophie Laurent', email: 'sophie.l@gmail.com', phone: '+94 76 700 3333', notes: 'French expat' },
            { name: 'Nethmi Samarakoon', email: 'nethmi.s@outlook.com', phone: '+94 78 700 4444', notes: 'Event makeup regular' },
            { name: 'Dulani Wickrematunge', email: 'dulani.w@yahoo.com', phone: '+94 70 700 5555', notes: '' },
        ],
    },
    {
        name: 'Nuwara Eliya Men\'s Lounge',
        email: 'groom@nuwaraeliyalounge.lk',
        phone: '+94 52 223 4400',
        category: 'Barber',
        address: '33 Grand Hotel Road, Nuwara Eliya',
        city: 'Nuwara Eliya',
        description: 'A sophisticated men\'s grooming lounge in Little England, offering premium haircuts, beard grooming, and gentleman\'s facials in a colonial-era setting.',
        image_url: 'https://images.unsplash.com/photo-1599351431202-1e0f0137899a?q=80&w=800',
        keywords: 'executive haircut, beard sculpting, hot towel shave, men facial, grey blending, Nuwara Eliya',
        staff: [
            { name: 'Nuwan Karunarathne', email: 'nuwan@nuwaraeliyalounge.lk', role: 'Owner', color: '#D4AF37' },
            { name: 'Janith Fonseka', email: 'janith@nuwaraeliyalounge.lk', role: 'Master Barber', color: '#2C3E50' },
            { name: 'Supun Wickramarachchi', email: 'supun@nuwaraeliyalounge.lk', role: 'Barber', color: '#E74C3C' },
        ],
        services: [
            { name: 'Executive Haircut', duration_min: 40, price: 2000, category: 'Hair' },
            { name: 'Luxury Hot Towel Shave', duration_min: 45, price: 2500, category: 'Shave' },
            { name: 'Beard Sculpting', duration_min: 30, price: 1200, category: 'Beard' },
            { name: 'Men\'s Facial', duration_min: 45, price: 3000, category: 'Facial' },
            { name: 'Hair & Beard Deluxe', duration_min: 60, price: 3500, category: 'Combo' },
            { name: 'Grey Blending', duration_min: 30, price: 1800, category: 'Colour' },
        ],
        clients: [
            { name: 'Charith Asalanka', email: 'charith.a@gmail.com', phone: '+94 77 800 1111', notes: '' },
            { name: 'David Chapman', email: 'david.c@gmail.com', phone: '+94 71 800 2222', notes: 'Tea plantation manager' },
            { name: 'Sachith Pathirana', email: 'sachith.p@gmail.com', phone: '+94 76 800 3333', notes: 'Monthly regular' },
            { name: 'Ravindu Senevirathne', email: 'ravindu.s@outlook.com', phone: '+94 78 800 4444', notes: '' },
            { name: 'Ian Campbell', email: 'ian.c@yahoo.com', phone: '+94 70 800 5555', notes: 'Scottish expat' },
        ],
    },
    {
        name: 'Batticaloa Bridal Studio',
        email: 'bridal@batticaloastudio.lk',
        phone: '+94 65 222 7788',
        category: 'Bridal Studio',
        address: '56 Bar Road, Batticaloa',
        city: 'Batticaloa',
        description: 'Eastern Province\'s leading bridal studio, specialising in South Asian bridal makeup, saree draping, and complete wedding day packages.',
        image_url: 'https://images.unsplash.com/photo-1595476108010-b4d1f102b1b1?q=80&w=800',
        keywords: 'bridal makeup, saree draping, mehendi, engagement, wedding, bridesmaid, Batticaloa',
        staff: [
            { name: 'Fathima Rizna', email: 'fathima@batticaloastudio.lk', role: 'Owner', color: '#D4AF37' },
            { name: 'Anjali Chandrakumar', email: 'anjali@batticaloastudio.lk', role: 'Senior Makeup Artist', color: '#E91E63' },
            { name: 'Shifana Nazeer', email: 'shifana@batticaloastudio.lk', role: 'Saree Draper', color: '#FF9800' },
            { name: 'Thuvaraka Baheerathan', email: 'thuvaraka@batticaloastudio.lk', role: 'Hair Stylist', color: '#9C27B0' },
        ],
        services: [
            { name: 'Bridal Full Makeup', duration_min: 120, price: 35000, category: 'Bridal' },
            { name: 'Engagement Makeup', duration_min: 90, price: 15000, category: 'Bridal' },
            { name: 'Saree Draping', duration_min: 30, price: 3000, category: 'Bridal' },
            { name: 'Pre-Bridal Facial Package', duration_min: 60, price: 5000, category: 'Facial' },
            { name: 'Mehendi (Full Hands)', duration_min: 120, price: 8000, category: 'Beauty' },
            { name: 'Bridesmaid Makeup', duration_min: 60, price: 8000, category: 'Bridal' },
        ],
        clients: [
            { name: 'Farzana Jameel', email: 'farzana.j@gmail.com', phone: '+94 77 900 1111', notes: 'Wedding June 2026' },
            { name: 'Kavitha Ravikumar', email: 'kavitha.r@gmail.com', phone: '+94 71 900 2222', notes: 'Engagement March 2026' },
            { name: 'Shehani Munasinghe', email: 'shehani.m@gmail.com', phone: '+94 76 900 3333', notes: '' },
            { name: 'Nishadi Warnakulasuriya', email: 'nishadi.w@outlook.com', phone: '+94 78 900 4444', notes: 'Homecoming event' },
            { name: 'Zainab Farooq', email: 'zainab.f@yahoo.com', phone: '+94 70 900 5555', notes: 'Nikah ceremony' },
            { name: 'Dharshini Balasingam', email: 'dharshini.b@gmail.com', phone: '+94 77 900 6666', notes: '' },
        ],
    },
    {
        name: 'Trincomalee Wellness Hub',
        email: 'relax@trincowellness.lk',
        phone: '+94 26 222 9900',
        category: 'Wellness Centre',
        address: '8 Fort Frederick Road, Trincomalee',
        city: 'Trincomalee',
        description: 'A holistic wellness centre on the east coast combining yoga, massage, and traditional healing arts in a serene oceanfront setting.',
        image_url: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?q=80&w=800',
        keywords: 'yoga, massage, meditation, sound healing, aromatherapy, deep tissue, Trincomalee',
        staff: [
            { name: 'Suresh Mohanadas', email: 'suresh@trincowellness.lk', role: 'Owner', color: '#D4AF37' },
            { name: 'Dilrukshi Jayathilake', email: 'dilrukshi@trincowellness.lk', role: 'Yoga Instructor', color: '#4CAF50' },
            { name: 'Arjun Nadarajah', email: 'arjun@trincowellness.lk', role: 'Massage Therapist', color: '#00BCD4' },
            { name: 'Vasuki Parameswaran', email: 'vasuki@trincowellness.lk', role: 'Wellness Coach', color: '#FF5722' },
        ],
        services: [
            { name: 'Swedish Massage', duration_min: 60, price: 5000, category: 'Massage' },
            { name: 'Deep Tissue Massage', duration_min: 75, price: 6500, category: 'Massage' },
            { name: 'Yoga Private Session', duration_min: 60, price: 4000, category: 'Yoga' },
            { name: 'Meditation & Sound Healing', duration_min: 45, price: 3500, category: 'Wellness' },
            { name: 'Aromatherapy Package', duration_min: 90, price: 8000, category: 'Package' },
            { name: 'Post-Surf Recovery Massage', duration_min: 45, price: 4000, category: 'Massage' },
        ],
        clients: [
            { name: 'Anton Perera', email: 'anton.p@gmail.com', phone: '+94 77 100 1111', notes: 'Weekly yoga' },
            { name: 'Lisa Andersson', email: 'lisa.a@gmail.com', phone: '+94 71 100 2222', notes: 'Swedish tourist' },
            { name: 'Kamal Fernando', email: 'kamal.f@gmail.com', phone: '+94 76 100 3333', notes: 'Back issues - deep tissue only' },
            { name: 'Yuki Tanaka', email: 'yuki.t@gmail.com', phone: '+94 78 100 4444', notes: 'Japanese guest' },
            { name: 'Chamika Wijewardena', email: 'chamika.w@outlook.com', phone: '+94 70 100 5555', notes: '' },
        ],
    },
];

// Unique passwords per company
const COMPANY_PASSWORDS = {
    'info@colomboglamour.lk': 'Colombo@2026',
    'hello@kandyroyal.lk': 'Kandy@2026',
    'bookings@gallefortbarber.lk': 'Galle@2026',
    'hello@negombonails.lk': 'Negombo@2026',
    'care@ellaglow.lk': 'Ella@2026',
    'team@jaffnaheritage.lk': 'Jaffna@2026',
    'aloha@mirissabeauty.lk': 'Mirissa@2026',
    'groom@nuwaraeliyalounge.lk': 'NuwaraEliya@2026',
    'bridal@batticaloastudio.lk': 'Batticaloa@2026',
    'relax@trincowellness.lk': 'Trinco@2026',
};

// ── Appointment generator ──
function generateAppointments(companyId, staffIds, serviceObjs, clientIds) {
    const appointments = [];
    const statuses = ['confirmed', 'confirmed', 'confirmed', 'completed', 'completed', 'cancelled'];

    // Generate appointments for this week and next week (Feb 23 - Mar 8, 2026)
    const baseDate = new Date('2026-02-23T00:00:00+05:30');

    for (let dayOffset = 0; dayOffset < 14; dayOffset++) {
        const day = new Date(baseDate);
        day.setDate(day.getDate() + dayOffset);

        // Skip Sundays
        if (day.getDay() === 0) continue;

        // 3-6 appointments per day
        const count = 3 + Math.floor(Math.random() * 4);
        const usedSlots = new Set();

        for (let i = 0; i < count; i++) {
            const staffId = staffIds[Math.floor(Math.random() * staffIds.length)];
            const serviceIdx = Math.floor(Math.random() * serviceObjs.length);
            const service = serviceObjs[serviceIdx];
            const clientId = clientIds[Math.floor(Math.random() * clientIds.length)];

            // Random hour between 9 AM and 5 PM
            let hour = 9 + Math.floor(Math.random() * 8);
            const minute = [0, 15, 30, 45][Math.floor(Math.random() * 4)];
            const slotKey = `${dayOffset}-${hour}-${minute}-${staffId}`;
            if (usedSlots.has(slotKey)) continue;
            usedSlots.add(slotKey);

            const startTime = new Date(day);
            startTime.setHours(hour, minute, 0, 0);

            const endTime = new Date(startTime);
            endTime.setMinutes(endTime.getMinutes() + service.duration_min);

            // Past appointments are completed, future ones confirmed
            let status;
            if (startTime < new Date('2026-02-23T00:00:00+05:30')) {
                status = 'completed';
            } else if (dayOffset < 2) {
                status = statuses[Math.floor(Math.random() * statuses.length)];
            } else {
                status = 'confirmed';
            }

            appointments.push({
                company_id: companyId,
                client_id: clientId,
                staff_id: staffId,
                service_id: service.id,
                start_time: formatDatetime(startTime),
                end_time: formatDatetime(endTime),
                status,
                notes: null,
            });
        }
    }

    return appointments;
}

function formatDatetime(d) {
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:00`;
}

// ── Main seed function ──
async function seed() {
    console.log('🔄 Starting full database reset and seed...\n');

    const conn = await getRootConnection();

    try {
        // 1. Drop and recreate database
        console.log('💣 Dropping database...');
        await conn.query(`DROP DATABASE IF EXISTS \`${DB_NAME}\``);
        console.log('✅ Database dropped');

        console.log('📦 Creating fresh database...');
        await conn.query(`CREATE DATABASE \`${DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
        await conn.query(`USE \`${DB_NAME}\``);
        console.log('✅ Database created\n');

        // 2. Create tables
        console.log('🏗️  Creating tables...');
        const tableStatements = TABLES_SQL.split(';').map(s => s.trim()).filter(s => s.length > 0);
        for (const stmt of tableStatements) {
            await conn.query(stmt);
        }
        console.log('✅ All tables created\n');

        // 3. Hash passwords per company
        const passwordHashes = {};
        for (const [email, pwd] of Object.entries(COMPANY_PASSWORDS)) {
            passwordHashes[email] = await bcrypt.hash(pwd, 12);
        }

        let totalStaff = 0, totalServices = 0, totalClients = 0, totalAppointments = 0;

        // 4. Seed each company
        for (const company of COMPANIES) {
            console.log(`\n🏢 Seeding: ${company.name} (${company.city})`);

            const passwordHash = passwordHashes[company.email];

            // Insert company
            const [companyResult] = await conn.execute(
                `INSERT INTO companies (name, email, password_hash, phone, category, address, city, country, description, image_url, keywords)
                 VALUES (?, ?, ?, ?, ?, ?, ?, 'Sri Lanka', ?, ?, ?)`,
                [company.name, company.email, passwordHash, company.phone, company.category, company.address, company.city, company.description, company.image_url, company.keywords]
            );
            const companyId = companyResult.insertId;

            // Insert roles
            await conn.execute(
                'INSERT INTO roles (company_id, name) VALUES (?, ?), (?, ?)',
                [companyId, 'Owner', companyId, 'Staff']
            );

            // Insert staff
            const staffIds = [];
            for (const s of company.staff) {
                const [staffResult] = await conn.execute(
                    'INSERT INTO staff (company_id, name, email, role, color) VALUES (?, ?, ?, ?, ?)',
                    [companyId, s.name, s.email, s.role, s.color]
                );
                staffIds.push(staffResult.insertId);
                totalStaff++;
            }

            // Insert services
            const serviceObjs = [];
            for (const svc of company.services) {
                const [svcResult] = await conn.execute(
                    'INSERT INTO services (company_id, name, duration_min, price, category) VALUES (?, ?, ?, ?, ?)',
                    [companyId, svc.name, svc.duration_min, svc.price, svc.category]
                );
                serviceObjs.push({ id: svcResult.insertId, duration_min: svc.duration_min });
                totalServices++;
            }

            // Insert clients
            const clientIds = [];
            for (const c of company.clients) {
                const [clientResult] = await conn.execute(
                    'INSERT INTO clients (company_id, name, email, phone, notes) VALUES (?, ?, ?, ?, ?)',
                    [companyId, c.name, c.email, c.phone, c.notes || null]
                );
                clientIds.push(clientResult.insertId);
                totalClients++;
            }

            // Generate and insert appointments
            const appointments = generateAppointments(companyId, staffIds, serviceObjs, clientIds);
            for (const appt of appointments) {
                await conn.execute(
                    `INSERT INTO appointments (company_id, client_id, staff_id, service_id, start_time, end_time, status, notes)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                    [appt.company_id, appt.client_id, appt.staff_id, appt.service_id, appt.start_time, appt.end_time, appt.status, appt.notes]
                );
                totalAppointments++;
            }

            console.log(`   ✓ ${company.staff.length} staff, ${company.services.length} services, ${company.clients.length} clients, ${appointments.length} appointments`);
        }

        // 5. Seed default admin
        const adminHash = await bcrypt.hash('admin123', 12);
        await conn.execute('INSERT INTO admins (username, password_hash) VALUES (?, ?)', ['admin', adminHash]);
        console.log('\n👑 Seeded default admin (admin / admin123)');

        // 5. Summary
        console.log('\n' + '═'.repeat(60));
        console.log('🎉 SEED COMPLETE!');
        console.log('═'.repeat(60));
        console.log(`   Companies:    10`);
        console.log(`   Staff:        ${totalStaff}`);
        console.log(`   Services:     ${totalServices}`);
        console.log(`   Clients:      ${totalClients}`);
        console.log(`   Appointments: ${totalAppointments}`);
        console.log('═'.repeat(60));
        console.log(`\n🔑 Login credentials:`);
        for (const c of COMPANIES) {
            console.log(`     • ${c.email.padEnd(35)} | Password: ${COMPANY_PASSWORDS[c.email].padEnd(20)} → ${c.name}`);
        }
        console.log('');

    } catch (error) {
        console.error('❌ Seed failed:', error);
        process.exit(1);
    } finally {
        await conn.end();
    }
}

seed();

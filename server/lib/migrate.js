import pool from './db.js';
import bcrypt from 'bcryptjs';

const TABLES = [
  `CREATE TABLE IF NOT EXISTS companies (
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
  )`,

  `CREATE TABLE IF NOT EXISTS roles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    company_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_role (company_id, name),
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
  )`,

  `CREATE TABLE IF NOT EXISTS staff (
    id INT AUTO_INCREMENT PRIMARY KEY,
    company_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) DEFAULT NULL,
    role VARCHAR(100) DEFAULT 'Staff',
    color VARCHAR(20) DEFAULT '#D4AF37',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
  )`,

  `CREATE TABLE IF NOT EXISTS services (
    id INT AUTO_INCREMENT PRIMARY KEY,
    company_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    duration_min INT DEFAULT 30,
    price DECIMAL(10,2) DEFAULT 0.00,
    category VARCHAR(100) DEFAULT 'General',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
  )`,

  `CREATE TABLE IF NOT EXISTS clients (
    id INT AUTO_INCREMENT PRIMARY KEY,
    company_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) DEFAULT NULL,
    phone VARCHAR(50) DEFAULT NULL,
    notes TEXT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
  )`,

  `CREATE TABLE IF NOT EXISTS appointments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    company_id INT NOT NULL,
    client_id INT DEFAULT NULL,
    staff_id INT DEFAULT NULL,
    service_id INT DEFAULT NULL,
    start_time DATETIME NOT NULL,
    end_time DATETIME NOT NULL,
    status VARCHAR(50) DEFAULT 'confirmed',
    source VARCHAR(20) DEFAULT 'manual',
    is_deleted BOOLEAN DEFAULT FALSE,
    notes TEXT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE SET NULL,
    FOREIGN KEY (staff_id) REFERENCES staff(id) ON DELETE SET NULL,
    FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE SET NULL
  )`,

  `CREATE TABLE IF NOT EXISTS reviews (
    id INT AUTO_INCREMENT PRIMARY KEY,
    appointment_id INT NOT NULL,
    company_id INT NOT NULL,
    client_id INT DEFAULT NULL,
    staff_id INT DEFAULT NULL,
    rating TINYINT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_review (appointment_id),
    FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE CASCADE,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE SET NULL,
    FOREIGN KEY (staff_id) REFERENCES staff(id) ON DELETE SET NULL
  )`,

  `CREATE TABLE IF NOT EXISTS appointment_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    appointment_id INT NOT NULL,
    company_id INT NOT NULL,
    action VARCHAR(50) NOT NULL,
    previous_status VARCHAR(50) DEFAULT NULL,
    new_status VARCHAR(50) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE CASCADE,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
  )`,

  `CREATE TABLE IF NOT EXISTS promotions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    company_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT DEFAULT NULL,
    image_url TEXT DEFAULT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
  )`,

  `CREATE TABLE IF NOT EXISTS admins (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`
];

export async function runMigrations() {
  const connection = await pool.getConnection();
  try {
    for (const sql of TABLES) {
      await connection.execute(sql);
    }

    // Add is_deleted to appointments if it doesn't exist (migration for existing db)
    try {
      await connection.execute('ALTER TABLE appointments ADD COLUMN is_deleted BOOLEAN DEFAULT FALSE');
      console.log('✅ Added is_deleted column to appointments table');
    } catch (e) {
      if (e.code === 'ER_DUP_FIELDNAME') {
        console.log('ℹ️ is_deleted column already exists in appointments table');
      } else {
        console.error('⚠️ Could not add is_deleted column:', e.message);
      }
    }

    // Add sms_status to promotions (for admin approval workflow)
    try {
      await connection.execute("ALTER TABLE promotions ADD COLUMN sms_status VARCHAR(20) DEFAULT NULL");
      console.log('✅ Added sms_status column to promotions table');
    } catch (e) {
      if (e.code === 'ER_DUP_FIELDNAME') {
        console.log('ℹ️ sms_status column already exists in promotions table');
      } else {
        console.error('⚠️ Could not add sms_status column:', e.message);
      }
    }

    // Add is_locked to companies (for admin lock/unlock)
    try {
      await connection.execute("ALTER TABLE companies ADD COLUMN is_locked BOOLEAN DEFAULT FALSE");
      console.log('✅ Added is_locked column to companies table');
    } catch (e) {
      if (e.code === 'ER_DUP_FIELDNAME') {
        console.log('ℹ️ is_locked column already exists in companies table');
      } else {
        console.error('⚠️ Could not add is_locked column:', e.message);
      }
    }

    // Seed default admin (admin / admin123)
    try {
      const [adminRows] = await connection.execute('SELECT id FROM admins WHERE username = ?', ['admin']);
      if (adminRows.length === 0) {
        const hash = await bcrypt.hash('admin123', 12);
        await connection.execute('INSERT INTO admins (username, password_hash) VALUES (?, ?)', ['admin', hash]);
        console.log('✅ Default admin user created (admin / admin123)');
      } else {
        console.log('ℹ️ Default admin user already exists');
      }
    } catch (e) {
      console.error('⚠️ Could not seed admin user:', e.message);
    }
    console.log('✅ All tables created successfully');
    return { success: true, message: 'All tables created successfully' };
  } catch (error) {
    console.error('❌ Migration error:', error.message);
    return { success: false, error: error.message };
  } finally {
    connection.release();
  }
}

import sql from './db.js';

async function setupDatabase() {
  console.log('🚀 Setting up database tables...');

  try {
    // Users table - auth and account
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        unique_id VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE,
        mobile VARCHAR(20),
        password_hash VARCHAR(255) NOT NULL,
        profile_for VARCHAR(50),
        gender VARCHAR(20),
        is_verified BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    console.log('✅ users table created');

    // Profiles table - full profile data
    await sql`
      CREATE TABLE IF NOT EXISTS profiles (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        full_name VARCHAR(255),
        gender VARCHAR(20),
        dob DATE,
        dob_day VARCHAR(5),
        dob_month VARCHAR(20),
        dob_year VARCHAR(10),
        mother_tongue VARCHAR(100),
        height VARCHAR(50),
        physical_status VARCHAR(50) DEFAULT 'Normal',
        marital_status VARCHAR(50) DEFAULT 'Never Married',
        having_children VARCHAR(20),
        number_of_children VARCHAR(10),
        religion VARCHAR(100),
        sect VARCHAR(100),
        caste VARCHAR(100),
        horoscope VARCHAR(100),
        time_of_birth VARCHAR(20),
        place_of_birth VARCHAR(255),
        dosham VARCHAR(20),
        star VARCHAR(100),
        country VARCHAR(100),
        state VARCHAR(100),
        city VARCHAR(100),
        residential_status VARCHAR(100),
        education VARCHAR(255),
        employment_type VARCHAR(100),
        occupation VARCHAR(255),
        organization_name VARCHAR(255),
        currency VARCHAR(10) DEFAULT 'INR',
        income VARCHAR(100),
        smoking VARCHAR(50),
        drinking VARCHAR(50),
        diet VARCHAR(50),
        food_habits VARCHAR(50),
        about TEXT,
        partner_preference TEXT,
        family_type VARCHAR(100),
        family_status VARCHAR(100),
        family_income VARCHAR(100),
        father_occupation VARCHAR(255),
        mother_occupation VARCHAR(255),
        brothers VARCHAR(10),
        brothers_married VARCHAR(10),
        sisters VARCHAR(10),
        sisters_married VARCHAR(10),
        family_living_in VARCHAR(255),
        family_country VARCHAR(100),
        family_state VARCHAR(100),
        family_city VARCHAR(100),
        living_with_parents VARCHAR(50),
        contact_address TEXT,
        settling_abroad VARCHAR(50),
        photo TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id)
      )
    `;
    console.log('✅ profiles table created');

    // Profile photos
    await sql`
      CREATE TABLE IF NOT EXISTS profile_photos (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        photo_data TEXT NOT NULL,
        is_main BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    console.log('✅ profile_photos table created');

    // Partner preferences
    await sql`
      CREATE TABLE IF NOT EXISTS preferences (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        pref_age_from VARCHAR(10),
        pref_age_to VARCHAR(10),
        pref_height_from VARCHAR(50),
        pref_height_to VARCHAR(50),
        pref_religion VARCHAR(100),
        pref_caste VARCHAR(100),
        pref_education VARCHAR(255),
        pref_occupation VARCHAR(255),
        pref_marital_status VARCHAR(50),
        pref_having_children VARCHAR(20),
        pref_country VARCHAR(100),
        pref_state VARCHAR(100),
        pref_city VARCHAR(100),
        pref_mother_tongue VARCHAR(100),
        pref_physical_status VARCHAR(50),
        pref_employment_type VARCHAR(100),
        pref_family_status VARCHAR(100),
        pref_family_type VARCHAR(100),
        pref_living_with_parents VARCHAR(50),
        pref_dietary VARCHAR(50),
        pref_smoking VARCHAR(50),
        pref_drinking VARCHAR(50),
        pref_horoscope VARCHAR(100),
        pref_income VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id)
      )
    `;
    console.log('✅ preferences table created');

    // Favourites / interests (hobbies, sports, etc)
    await sql`
      CREATE TABLE IF NOT EXISTS user_favourites (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        hobbies TEXT[] DEFAULT '{}',
        sports TEXT[] DEFAULT '{}',
        movies TEXT[] DEFAULT '{}',
        reading TEXT[] DEFAULT '{}',
        tv_shows TEXT[] DEFAULT '{}',
        destinations TEXT[] DEFAULT '{}',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id)
      )
    `;
    console.log('✅ user_favourites table created');

    // Interests (sent/received)
    await sql`
      CREATE TABLE IF NOT EXISTS interests (
        id SERIAL PRIMARY KEY,
        sender_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        receiver_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        status VARCHAR(20) DEFAULT 'pending',
        message TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(sender_id, receiver_id)
      )
    `;
    console.log('✅ interests table created');

    // Shortlisted profiles
    await sql`
      CREATE TABLE IF NOT EXISTS shortlists (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        shortlisted_user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, shortlisted_user_id)
      )
    `;
    console.log('✅ shortlists table created');

    // Profile views
    await sql`
      CREATE TABLE IF NOT EXISTS profile_views (
        id SERIAL PRIMARY KEY,
        viewer_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        viewed_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        viewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    console.log('✅ profile_views table created');

    // Saved searches
    await sql`
      CREATE TABLE IF NOT EXISTS saved_searches (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR(255),
        criteria JSONB NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    console.log('✅ saved_searches table created');

    // Profile ignores
    await sql`
      CREATE TABLE IF NOT EXISTS ignores (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        ignored_user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, ignored_user_id)
      )
    `;
    console.log('✅ ignores table created');

    // Profile blocks
    await sql`
      CREATE TABLE IF NOT EXISTS blocks (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        blocked_user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, blocked_user_id)
      )
    `;
    console.log('✅ blocks table created');

    // Profile deactivations
    await sql`
      CREATE TABLE IF NOT EXISTS deactivations (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        is_active BOOLEAN DEFAULT true,
        deactivated_at TIMESTAMP,
        reactivate_at TIMESTAMP,
        duration VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id)
      )
    `;
    console.log('✅ deactivations table created');

    // Add indexes for performance
    await sql`CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_profiles_religion ON profiles(religion)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_profiles_caste ON profiles(caste)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_profiles_country ON profiles(country)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_profiles_state ON profiles(state)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_profiles_city ON profiles(city)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_profiles_education ON profiles(education)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_profiles_occupation ON profiles(occupation)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_profiles_gender ON profiles(gender)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_interests_sender ON interests(sender_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_interests_receiver ON interests(receiver_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_profile_views_viewer ON profile_views(viewer_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_profile_views_viewed ON profile_views(viewed_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_users_unique_id ON users(unique_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_ignores_user_id ON ignores(user_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_blocks_user_id ON blocks(user_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_deactivations_user_id ON deactivations(user_id)`;
    console.log('✅ indexes created');

    console.log('\n🎉 Database setup complete!');
  } catch (error) {
    console.error('❌ Database setup failed:', error);
    throw error;
  }
}

// Run if called directly (optional, but keep it exported)
// setupDatabase().catch(console.error);

export default setupDatabase;

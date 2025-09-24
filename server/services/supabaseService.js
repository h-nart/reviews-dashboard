const { createClient } = require('@supabase/supabase-js');

/**
 * Generic Supabase service for database connection
 * Provides a configured Supabase client for other services to use
 */
class SupabaseService {
  constructor() {
    // Initialize Supabase client
    this.supabaseUrl = process.env.SUPABASE_URL;
    this.supabaseKey = process.env.SUPABASE_ANON_KEY;
    
    if (!this.supabaseUrl || !this.supabaseKey) {
      console.warn('⚠️  Supabase credentials not found. Database operations will be disabled.');
      this.client = null;
      this.isEnabled = false;
      return;
    }

    this.client = createClient(this.supabaseUrl, this.supabaseKey);
    this.isEnabled = true;
    console.log('✅ Supabase service initialized');
  }

  /**
   * Check if Supabase is properly configured
   */
  isConfigured() {
    return this.isEnabled;
  }

  /**
   * Get the Supabase client instance
   * @returns {Object|null} Supabase client or null if not configured
   */
  getClient() {
    return this.client;
  }

}

module.exports = SupabaseService;

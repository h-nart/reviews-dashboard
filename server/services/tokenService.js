const SupabaseService = require('./supabaseService');

/**
 * Token service for managing Hostaway API access tokens
 * Uses Supabase database for persistence
 */
class TokenService {
  constructor() {
    this.supabaseService = new SupabaseService();
  }

  /**
   * Get a valid Hostaway access token for a specific client
   * @param {string} clientId - The client ID
   * @returns {Promise<string|null>} Token string or null if none found
   */
  async getValidToken(clientId) {
    if (!clientId) {
      throw new Error('client_id is required');
    }

    if (!this.supabaseService.isConfigured()) {
      throw new Error('Database not configured. Please set SUPABASE_URL and SUPABASE_ANON_KEY');
    }

    try {
      const client = this.supabaseService.getClient();
      const { data, error } = await client
        .from('hostaway_tokens')
        .select('token, expires_at')
        .eq('client_id', clientId)
        .gt('expires_at', new Date().toISOString())
        .limit(1);

      if (error) {
        console.error('Database error getting token:', error.message);
        return null;
      }

      if (data && data.length > 0) {
        const tokenData = data[0];
        console.log(`📡 Retrieved valid token for client ${clientId}, expires at: ${tokenData.expires_at}`);
        return tokenData.token;
      }

      console.log(`No valid access token found for client ${clientId}`);
      return null;
    } catch (error) {
      console.error('Exception getting token:', error.message);
      return null;
    }
  }

  /**
   * Store a new access token for a specific client
   * @param {string} clientId - The client ID
   * @param {string} token - The access token
   * @returns {Promise<boolean>} Success status
   */
  async storeToken(clientId, token) {
    if (!clientId) {
      throw new Error('client_id is required');
    }

    if (!this.supabaseService.isConfigured()) {
      throw new Error('Database not configured. Please set SUPABASE_URL and SUPABASE_ANON_KEY');
    }

    // Calculate expiry time: 24 months minus 5 minutes for safety margin
    const expiresAt = new Date();
    const expiresInSeconds = (24 * 30 * 24 * 60 * 60) - 300; // 24 months - 5 minutes
    expiresAt.setTime(expiresAt.getTime() + (expiresInSeconds * 1000));

    try {
      const client = this.supabaseService.getClient();
      
      // Use upsert to replace existing token for this client_id
      const { error } = await client
        .from('hostaway_tokens')
        .upsert([{
          client_id: clientId,
          token: token,
          expires_at: expiresAt.toISOString()
        }], {
          onConflict: 'client_id'
        });

      if (error) {
        console.error('Database error storing token:', error.message);
        return false;
      }

      console.log(`💾 Successfully stored token for client ${clientId} (expires at: ${expiresAt.toISOString()})`);
      return true;
    } catch (error) {
      console.error('Exception storing token:', error.message);
      return false;
    }
  }

  /**
   * Check if we have a valid token for a specific client
   * @param {string} clientId - The client ID
   * @returns {Promise<boolean>} True if valid token exists
   */
  async hasValidToken(clientId) {
    if (!clientId) {
      throw new Error('client_id is required');
    }

    if (!this.supabaseService.isConfigured()) {
      return false;
    }

    try {
      const client = this.supabaseService.getClient();
      const { data, error } = await client
        .from('hostaway_tokens')
        .select('client_id')
        .eq('client_id', clientId)
        .gt('expires_at', new Date().toISOString())
        .limit(1);

      if (error) {
        console.error('Database error checking token validity:', error.message);
        return false;
      }

      return data && data.length > 0;
    } catch (error) {
      console.error('Exception checking token validity:', error.message);
      return false;
    }
  }

  /**
   * Clear stored tokens (all tokens or specific client)
   * @param {string|null} clientId - The client ID to clear, or null for all tokens
   * @returns {Promise<boolean>} Success status
   */
  async clearTokens(clientId = null) {
    if (!this.supabaseService.isConfigured()) {
      throw new Error('Database not configured. Please set SUPABASE_URL and SUPABASE_ANON_KEY');
    }

    try {
      const client = this.supabaseService.getClient();
      let query = client.from('hostaway_tokens').delete();
      
      if (clientId) {
        query = query.eq('client_id', clientId);
      } else {
        query = query.neq('client_id', ''); // Delete all records
      }

      const { error } = await query;

      if (error) {
        console.error('Error clearing tokens from database:', error.message);
        return false;
      }

      const action = clientId ? `for client ${clientId}` : 'all';
      console.log(`🗑️  Cleared tokens ${action} from database`);
      return true;
    } catch (error) {
      console.error('Exception clearing tokens from database:', error.message);
      return false;
    }
  }

  /**
   * Clear all stored tokens (backward compatibility)
   * @returns {Promise<boolean>} Success status
   */
  async clearAllTokens() {
    return this.clearTokens();
  }

  /**
   * Get token statistics (for debugging)
   * @returns {Promise<Object|null>} Token stats
   */
  async getTokenStats() {
    if (!this.supabaseService.isConfigured()) {
      return { error: 'Database not configured' };
    }

    try {
      const client = this.supabaseService.getClient();
      const { data, error } = await client
        .from('hostaway_tokens')
        .select('client_id, expires_at')
        .order('client_id', { ascending: true });

      if (error) {
        console.error('Error getting token stats:', error.message);
        return { error: error.message };
      }

      return {
        total_tokens: data.length,
        tokens: data.map(token => ({
          client_id: token.client_id,
          expires_at: token.expires_at,
          is_valid: new Date(token.expires_at) > new Date()
        }))
      };
    } catch (error) {
      console.error('Exception getting token stats:', error.message);
      return { error: error.message };
    }
  }
}

module.exports = TokenService;

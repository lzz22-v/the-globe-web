import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

// URL base do projeto (sem o /rest/v1/)
const supabaseUrl = 'https://ckshsdypyeyppppyjews.supabase.co';

// Chave pública (Publishable Key)
const supabaseKey = 'sb_publishable_MQjyhJJz8nw6ktSKDkFYnw_O-OI4eQh';

// Cria e exporta o cliente do Supabase com persistência e detecção de sessão OAuth garantidas
export const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        flowType: 'pkce',
        storage: window.localStorage
    }
});
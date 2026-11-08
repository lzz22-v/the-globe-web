import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

// URL base do projeto (sem o /rest/v1/)
const supabaseUrl = 'http://127.0.0.1:54321';

// Chave pública (Publishable Key)
const supabaseKey = 'sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH';

// Cria e exporta o cliente do Supabase para ser usado nos outros arquivos
export const supabase = createClient(supabaseUrl, supabaseKey);
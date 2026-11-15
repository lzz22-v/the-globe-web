import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

// URL base do projeto (sem o /rest/v1/)
const supabaseUrl = 'https://ckshsdypyeyppppyjews.supabase.co';

// Chave pública (Publishable Key)
const supabaseKey = 'sb_publishable_MQjyhJJz8nw6ktSKDkFYnw_O-OI4eQh';

// Cria e exporta o cliente do Supabase para ser usado nos outros arquivos
export const supabase = createClient(supabaseUrl, supabaseKey);
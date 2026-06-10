import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://eucwoxjmjfqylyrqunwk.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_fN9yRsEjDIZyBFkOQeiqQw_fVTGVUfK';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

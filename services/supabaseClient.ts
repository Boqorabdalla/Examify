
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qyjjowlejuonyfexrgly.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF5ampvd2xlanVvbnlmZXhyZ2x5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1ODU0MDMsImV4cCI6MjA4MDE2MTQwM30.SYmsvY9fiTidXuHLgGkIa6gesMmBZ748Q8urjncxFJM';

export const supabase = createClient(supabaseUrl, supabaseKey);

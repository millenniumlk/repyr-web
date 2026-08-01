import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://cqhsvdipojpqhucfrdfx.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNxaHN2ZGlwb2pwcWh1Y2ZyZGZ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM4NDk2MTUsImV4cCI6MjA5OTQyNTYxNX0.G6xlQBebOVZQY5SDGeVY7buWgIfTUAHPC_7jARHQFcM';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

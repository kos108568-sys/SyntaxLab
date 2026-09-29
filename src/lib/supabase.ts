import { createClient } from '@supabase/supabase-js'

// Публичный адрес проекта и публичный anon-ключ клиента Supabase
const defaultUrl = 'https://bwyayvdrgkzbtsaqiujl.supabase.co'
const defaultAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ3eWF5dmRyZ2t6YnRzYXFpdWpsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA2NjU1ODMsImV4cCI6MjEwNjI0MTU4M30.Di4emwY-kZ8OCI_6pdag95RsDIetwTZhZODExTsfW-c'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || defaultUrl
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || defaultAnonKey

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl !== 'https://placeholder-project.supabase.co'
)

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

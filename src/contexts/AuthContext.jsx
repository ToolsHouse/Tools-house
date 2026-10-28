import { createContext, useContext, useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

const isSupabaseConfigured = Boolean(supabaseUrl && supabaseKey)

if (!isSupabaseConfigured) {
  console.error('Missing Supabase environment variables:', {
    url: supabaseUrl ? 'set' : 'missing',
    key: supabaseKey ? 'set' : 'missing'
  })
}

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseKey)
  : null

const AuthContext = createContext({
  user: null,
  profile: null,
  loading: true,
  signIn: async () => {},
  signOut: async () => {},
})

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!supabase) {
      setLoading(false)
      return
    }

    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        const username = session.user.email?.split('@')[0] || session.user.email
        fetchProfile(session.user.id, session.user.email, username)
      }
      setLoading(false)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        const username = session.user.email?.split('@')[0] || session.user.email
        await fetchProfile(session.user.id, session.user.email, username)
      } else {
        setProfile(null)
      }
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const fetchProfile = async (userId, email, username) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        // If profile doesn't exist, create it automatically
        if (error.code === 'PGRST116') {
          console.log('Profile not found, creating...')
          const { data: newProfile, error: createError } = await supabase
            .from('profiles')
            .insert({
              id: userId,
              email: email,
              username: username,
              full_name: username.charAt(0).toUpperCase() + username.slice(1),
              role: 'admin'
            })
            .select()
            .single()

          if (createError) {
            console.error('Error creating profile:', createError)
            // Still set user even if profile creation fails
            setProfile(null)
          } else {
            setProfile(newProfile)
          }
        } else {
          throw error
        }
      } else {
        setProfile(data)
      }
    } catch (error) {
      console.error('Error fetching profile:', error)
      setProfile(null)
    }
  }

  const signIn = async (username, password) => {
    if (!supabase) {
      throw new Error('إعدادات Supabase غير مكتملة. أضف مفاتيح الاتصال في GitHub Secrets.')
    }

    // Convert username to email for Supabase auth
    const email = `${username}@toolshouse.local`

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      // Provide user-friendly error message
      if (error.message.includes('Invalid login credentials')) {
        throw new Error('Invalid username or password')
      }
      throw error
    }

    // Fetch profile after successful login (will auto-create if missing)
    if (data.user) {
      await fetchProfile(data.user.id, data.user.email, username)
    }

    return data
  }

  const signOut = async () => {
    if (!supabase) {
      throw new Error('إعدادات Supabase غير مكتملة.')
    }

    const { error } = await supabase.auth.signOut()
    if (error) throw error
    setProfile(null)
  }

  return (
    <AuthContext.Provider value={{ user, profile, loading, signIn, signOut, isSupabaseConfigured }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

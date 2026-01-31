
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
                    response = NextResponse.next({
                        request: {
                            headers: request.headers,
                        },
                    })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        response.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    // Refresh session if expired
    const {
        data: { user },
    } = await supabase.auth.getUser()

    // PROTECTED ROUTES Logic
    const isDashboard = request.nextUrl.pathname.startsWith('/dashboard')
    const isLoginPage = request.nextUrl.pathname.startsWith('/login')

    if (isDashboard && !user) {
        // Redirect unauthenticated users to login
        return NextResponse.redirect(new URL('/login', request.url))
    }

    if (isLoginPage && user) {
        // Redirect authenticated users to dashboard
        return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    return response
}

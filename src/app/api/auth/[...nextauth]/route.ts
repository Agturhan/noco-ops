import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';

// Not: Gerçek uygulamada Prisma ve bcrypt kullanılacak
// Şu an mock data ile çalışıyor

const mockUsers = [
    { id: '1', email: 'admin@noco.studio', name: 'Admin User', role: 'OWNER', password: 'demo123' },
    { id: '2', email: 'ops@noco.studio', name: 'Ops User', role: 'OPS', password: 'demo123' },
    { id: '3', email: 'seyma@noco.studio', name: 'Şeyma Bora', role: 'DIGITAL', password: 'seyma2026' },
    { id: '4', email: 'fatih@noco.studio', name: 'Fatih Ustaosmanoğlu', role: 'DIGITAL', password: 'fatih2026' },
    { id: '5', email: 'aysegul@noco.studio', name: 'Ayşegül Güler', role: 'DIGITAL', password: 'aysegul2026' },
    { id: '6', email: 'ahmet@noco.studio', name: 'Ahmet Gürkan Turhan', role: 'OPS', password: 'ahmet2026' },
];

export const authOptions = {
    providers: [
        CredentialsProvider({
            name: 'Credentials',
            credentials: {
                email: { label: 'E-posta', type: 'email' },
                password: { label: 'Şifre', type: 'password' },
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    throw new Error('E-posta ve şifre gereklidir');
                }

                // Mock user lookup (gerçekte Prisma kullanılacak)
                const user = mockUsers.find(u => u.email === credentials.email);

                if (!user) {
                    throw new Error('Kullanıcı bulunamadı');
                }

                // Mock password check (gerçekte bcrypt.compare kullanılacak)
                if (credentials.password !== user.password) {
                    throw new Error('Geçersiz şifre');
                }

                return {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    role: user.role,
                };
            },
        }),
    ],
    callbacks: {
        async jwt({ token, user }: { token: any; user?: any }) {
            if (user) {
                token.id = user.id;
                token.role = user.role;
            }
            return token;
        },
        async session({ session, token }: { session: any; token: any }) {
            if (session.user) {
                session.user.id = token.id as string;
                session.user.role = token.role as string;
            }
            return session;
        },
    },
    pages: {
        signIn: '/login',
        error: '/login',
    },
    session: {
        strategy: 'jwt' as const,
        maxAge: 30 * 24 * 60 * 60, // 30 gün
    },
    secret: process.env.NEXTAUTH_SECRET || 'dev-secret-change-in-production',
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };

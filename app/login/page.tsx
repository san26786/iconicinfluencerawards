import { redirect } from 'next/navigation';
import { AuthShell, AuthLink } from '@/components/auth/AuthShell';
import { LoginForm } from '@/components/auth/AuthForms';
import { getSessionUser } from '@/lib/auth';
import { getSite } from '@/lib/site';

export const metadata = { title: 'Sign in' };

export default async function LoginPage() {
  const user = await getSessionUser();
  if (user) redirect(user.role === 'organiser' ? '/organiser' : user.role === 'judge' ? '/judge' : '/account');

  const site = await getSite();

  return (
    <AuthShell
      eyebrow="Welcome back"
      title="Sign in"
      subtitle={`Access your ${site.name} account.`}
      footer={
        <>
          Don’t have an account? <AuthLink href="/register">Create one</AuthLink>
        </>
      }
    >
      <LoginForm />
      <p className="mt-5 text-center text-sm text-white/55">
        <AuthLink href="/forgot-password">Forgot your password?</AuthLink>
      </p>
    </AuthShell>
  );
}

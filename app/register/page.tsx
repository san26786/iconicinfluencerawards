import { redirect } from 'next/navigation';
import { AuthShell, AuthLink } from '@/components/auth/AuthShell';
import { VisitorRegisterForm } from '@/components/auth/AuthForms';
import { getSessionUser } from '@/lib/auth';

export const metadata = { title: 'Create your account' };

export default async function RegisterPage() {
  const user = await getSessionUser();
  if (user) redirect(user.role === 'organiser' ? '/organiser' : '/account');

  return (
    <AuthShell
      eyebrow="Join in"
      title="Create your account"
      subtitle="Register to follow your nominations and the awards journey."
      footer={
        <>
          Already have an account? <AuthLink href="/login">Sign in</AuthLink>
        </>
      }
    >
      <VisitorRegisterForm />
    </AuthShell>
  );
}

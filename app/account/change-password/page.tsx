import { redirect } from 'next/navigation';
import { AuthShell, AuthLink } from '@/components/auth/AuthShell';
import { ChangePasswordForm } from '@/components/auth/AuthForms';
import { getSessionUser } from '@/lib/auth';

export const metadata = { title: 'Change password' };

export default async function ChangePasswordPage() {
  const user = await getSessionUser();
  if (!user) redirect('/login');

  return (
    <AuthShell
      eyebrow="Account security"
      title="Change password"
      subtitle="Update the password for your account."
      footer={
        <AuthLink href={user.role === 'organiser' ? '/organiser' : '/account'}>
          Back to {user.role === 'organiser' ? 'dashboard' : 'account'}
        </AuthLink>
      }
    >
      <ChangePasswordForm />
    </AuthShell>
  );
}

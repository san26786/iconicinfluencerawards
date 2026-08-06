import { AuthShell, AuthLink } from '@/components/auth/AuthShell';
import { ResetPasswordForm } from '@/components/auth/AuthForms';

export const metadata = { title: 'Reset password' };

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const sp = await searchParams;

  return (
    <AuthShell
      eyebrow="Account recovery"
      title="Set a new password"
      subtitle="Choose a new password for your account."
      footer={
        <>
          <AuthLink href="/login">Back to sign in</AuthLink>
        </>
      }
    >
      <ResetPasswordForm token={sp.token} />
    </AuthShell>
  );
}

import { AuthShell, AuthLink } from '@/components/auth/AuthShell';
import { ForgotPasswordForm } from '@/components/auth/AuthForms';

export const metadata = { title: 'Forgot password' };

export default function ForgotPasswordPage() {
  return (
    <AuthShell
      eyebrow="Account recovery"
      title="Forgot your password?"
      subtitle="Enter your email and we’ll generate a link to set a new password."
      footer={
        <>
          Remembered it? <AuthLink href="/login">Back to sign in</AuthLink>
        </>
      }
    >
      <ForgotPasswordForm />
    </AuthShell>
  );
}

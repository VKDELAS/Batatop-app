export function isAdminUser(user) {
  if (!user) return false;
  return (
    user.email === 'enzzobaraldo2008@gmail.com' ||
    user.email?.includes('admin') ||
    user.user_metadata?.role === 'admin'
  );
}

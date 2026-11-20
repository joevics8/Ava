'use client';

export function LogoutButton() {
  return (
    <button type="button" className="text-muted-ink hover:text-primary" onClick={async () => {
      await fetch('/api/admin/logout', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
      window.location.href = '/admin/login';
    }}>Log out</button>
  );
}

import { useEffect, useRef } from 'react';
import { useAuth } from '@workos/authkit-tanstack-react-start/client';
import type { ConvexReactClient } from 'convex/react';
import { shouldExpireSession } from '../lib/auth-boundaries';
// SDK 0.11.1's onSessionExpired does not cover every ordinary cookie expiry.
export function SessionRevalidator({ client }: { client: ConvexReactClient }) {
  const { user, loading, getAuth } = useAuth();
  const seenUser = useRef(false);
  useEffect(() => {
    if (user) seenUser.current = true;
    if (shouldExpireSession(seenUser.current, loading, user)) {
      seenUser.current = false;
      void client.clearAuth();
      window.location.assign('/?session=expired');
    }
  }, [user, loading, client]);
  useEffect(() => {
    const refresh = () => { if (document.visibilityState === 'visible') void getAuth(); };
    window.addEventListener('focus', refresh);
    const timer = window.setInterval(refresh, 60_000);
    return () => { window.removeEventListener('focus', refresh); window.clearInterval(timer); };
  }, [getAuth]);
  return null;
}

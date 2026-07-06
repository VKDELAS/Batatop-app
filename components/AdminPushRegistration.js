import { useEffect, useRef } from 'react';
import { useRouter } from 'expo-router';

import { supabase } from '../supabaseConfig';
import { isAdminUser, checkIsAdmin } from '../utils/isAdmin';
import {
  setupAdminNotificationListeners,
  syncAdminPushRegistration,
} from '../utils/pushNotifications';

/**
 * Registra push token do admin e escuta toque na notificação do sistema.
 */
export default function AdminPushRegistration() {
  const router = useRouter();
  const pushTokenRef = useRef(null);

  useEffect(() => setupAdminNotificationListeners(router), [router]);

  useEffect(() => {
    let mounted = true;

    async function init(session) {
      if (!mounted || !session?.user) return;
      const isInstant = isAdminUser(session.user);
      let isDb = false;
      if (!isInstant) {
        isDb = await checkIsAdmin(session.user.id);
      }
      if (!isInstant && !isDb) return;

      const token = await syncAdminPushRegistration(session.user);
      if (mounted) pushTokenRef.current = token;
    }

    supabase.auth.getSession().then(({ data: { session } }) => init(session));

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        const isInstant = isAdminUser(session.user);
        let isDb = false;
        if (!isInstant) {
          isDb = await checkIsAdmin(session.user.id);
        }
        if (isInstant || isDb) {
          init(session);
        }
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return null;
}

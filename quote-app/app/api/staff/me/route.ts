import { currentStaff } from '@/lib/auth';
import { route } from '@/lib/http';
import { getSettings, publicCompany } from '@/lib/settings';
import { hasAiKey } from '@/lib/ai';

// Who is logged in, plus the staff name list for the login screen. No prices here.
export const GET = route(async () => {
  const s = await getSettings();
  const user = await currentStaff();
  return {
    user,
    staff_names: s.staff_names,
    pin_set: !!s.staff_pin_hash,
    ai_ready: hasAiKey(),
    company: publicCompany(s),
  };
});

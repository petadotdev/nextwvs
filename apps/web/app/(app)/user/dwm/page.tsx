export const dynamic = "force-dynamic";

import { ScaffoldPage } from "../../../../src/components/scaffold-page";

export default function UserDwmPage() {
  return (
    <ScaffoldPage
      eyebrow="User"
      title="DWM"
      description="Reserved customer route scaffolded per the frontend spec."
      routePath="/user/dwm"
    />
  );
}

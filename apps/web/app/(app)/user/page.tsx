export const dynamic = "force-dynamic";

import { ScaffoldPage } from "../../../src/components/scaffold-page";

export default function UserHomePage() {
  return (
    <ScaffoldPage
      eyebrow="User"
      title="Customer Workspace"
      description="Base customer route for the authenticated application shell."
      routePath="/user"
    />
  );
}

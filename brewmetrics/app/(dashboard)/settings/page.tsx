import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function SettingsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--gray-dark)]">
          Settings
        </h1>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">
          Manage your account and preferences
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
          <CardDescription>Profile and notification settings</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-[var(--muted-foreground)]">
            Settings options will be available here.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

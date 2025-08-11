"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import LanguageManager from "@/components/LanguageManager";
import EntryEditor from "@/components/EntryEditor";
import { ADMIN_UID, auth } from "../../../config/firebase";

export default function AdminPage() {
  const [uid, setUid] = useState<string | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUid(u?.uid ?? null));
    return () => unsub();
  }, []);

  if (uid !== ADMIN_UID) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <Card className="zen neu">
          <CardHeader>
            <CardTitle>Admin</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              You must be the admin to access this page. Sign in with the admin
              account.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      <Card className="zen neu">
        <CardHeader>
          <CardTitle>Dashboard</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-sm text-muted-foreground">
            Choose which languages you want to write today—the editor appears
            only after you activate one (or if an entry already exists).
          </p>
        </CardContent>
      </Card>

      <LanguageManager />
      <EntryEditor />
    </div>
  );
}

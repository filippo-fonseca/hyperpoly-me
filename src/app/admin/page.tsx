"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import QuickComposer from "@/components/QuickComposer";
import EntryEditor from "@/components/EntryEditor";
import ManageLanguagesModal from "@/components/ManageLanguagesModal";
import LanguageManager from "@/components/LanguageManager";
import { ADMIN_UID, auth } from "../../../config/firebase";
import { Button } from "@/components/ui/button";

export default function AdminPage() {
  const [uid, setUid] = useState<string | null>(null);
  const [openManage, setOpenManage] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUid(u?.uid ?? null));
    return () => unsub();
  }, []);

  if (uid !== ADMIN_UID) {
    return (
      <div className="mx-auto px-4 py-8">
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
      {/* Manage languages button */}
      <div className="flex items-center justify-between">
        <div className="flex flex-col">
          <h1 className="text-2xl font-bold">Welcome, you goat.</h1>
          <p className="text-sm text-gray-700">
            Consistency shapes what once felt impossible. Rememeber, you are
            ALWAYS making progress,
            <br /> even if it's doesn't feel like it all the time. It ALL adds
            up. Always. Every minute matters. <br /> How you do one thing is how
            you do everything.{" "}
          </p>
        </div>
        <div className="flex justify-end">
          <Button variant="outline" onClick={() => setOpenManage(true)}>
            Manage languages
          </Button>
        </div>
      </div>
      {/* Top composer — quick add like Twitter */}
      <QuickComposer />

      {/* Full editor (multi-language, activate-to-edit flow) */}
      <EntryEditor />

      {/* ⬇️ pass the content as children so the modal isn’t empty */}
      <ManageLanguagesModal
        open={openManage}
        onClose={() => setOpenManage(false)}
      >
        <LanguageManager onClose={() => setOpenManage(false)} />
      </ManageLanguagesModal>
    </div>
  );
}

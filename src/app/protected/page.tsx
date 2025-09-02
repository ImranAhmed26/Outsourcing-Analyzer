"use client";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";

export default function ProtectedPage() {
  const router = useRouter();
  return (
    <div className="flex flex-col items-center justify-center h-screen w-full">
      Protected pgae
      <Button
        className="mt-2 px-8"
        onClick={() =>
          authClient.signOut({
            fetchOptions: {
              onSuccess: () => router.replace("/"),
            },
          })
        }
      >
        Logout
      </Button>
    </div>
  );
}

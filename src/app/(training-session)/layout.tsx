import { SyncProvider } from "@/components/training/SyncProvider";

export default function TrainingSessionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-svh">
      <SyncProvider>
        <main className="flex-1">{children}</main>
      </SyncProvider>
    </div>
  );
}

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ArcherCard } from "@/components/archer-card/ArcherCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import ClientLink from "@/components/dashboard/ClientLink";
import { Plus, Target } from "lucide-react";

const STATUS_LABELS: Record<string, string> = {
  pending: "Pendiente",
  confirmed: "Confirmada",
  declined: "Rechazada",
  cancelled: "Cancelada",
};

const STATUS_VARIANTS: Record<
  string,
  "default" | "secondary" | "destructive" | "outline"
> = {
  pending: "secondary",
  confirmed: "default",
  declined: "destructive",
  cancelled: "outline",
};

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [
    { data: profile },
    { data: bows },
    { data: sessions },
    { data: stats },
  ] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).single(),
    supabase.from("bows").select("*").eq("user_id", user.id).limit(1),
    supabase
      .from("scheduled_sessions")
      .select(
        "id, date, time, distance, status, admin_note, locations:location_id(name)",
      )
      .eq("user_id", user.id)
      .in("status", ["pending", "confirmed"])
      .gte("date", new Date().toISOString().split("T")[0])
      .order("date", { ascending: true })
      .limit(1),
    supabase
      .from("training_sessions")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id),
  ]);

  if (!profile) redirect("/onboarding");

  const firstBow = bows?.[0];
  type SessionRow = {
    id: string;
    date: string;
    time: string;
    distance: number;
    status: string;
    admin_note: string | null;
    locations: { name: string } | null;
  };
  const nextSession = sessions?.[0] as SessionRow | undefined;
  const totalSessions = stats?.length ?? 0;

  return (
    <div className="flex flex-col gap-6 p-4 pt-6">
      {/* Archer Card */}
      <ArcherCard
        name={profile.name ?? ""}
        email={profile.email}
        pictureUrl={profile.picture_url}
        bowType={firstBow?.type}
        hand={firstBow?.hand}
        totalSessions={totalSessions}
      />

      {/* Next session */}
      {nextSession ? (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              Próxima sesión
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold">
                  {new Date(nextSession.date + "T00:00:00").toLocaleDateString(
                    "es-CO",
                    {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                    },
                  )}
                </p>
                <p className="text-sm text-muted-foreground">
                  {nextSession.time?.slice(0, 5)} · {nextSession.distance}m ·{" "}
                  {nextSession.locations?.name}
                </p>
              </div>
              <Badge variant={STATUS_VARIANTS[nextSession.status]}>
                {STATUS_LABELS[nextSession.status]}
              </Badge>
            </div>
            <div className="flex gap-2 pt-1">
              <ClientLink
                href={`/sessions/${nextSession.id}`}
                size="sm"
                variant="outline"
                className="flex-1 justify-center"
              >
                Ver detalles
              </ClientLink>
              {nextSession.status === "confirmed" && (
                <ClientLink
                  href={`/training/new?session=${nextSession.id}`}
                  size="sm"
                  className="flex-1 justify-center"
                >
                  <Target className="mr-1.5 h-4 w-4" />
                  Iniciar
                </ClientLink>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center gap-3 py-8 text-center">
            <p className="text-sm text-muted-foreground">
              No tienes sesiones programadas
            </p>
            <ClientLink href="/sessions/new" size="sm">
              <Plus className="mr-1.5 h-4 w-4" />
              Agendar sesión
            </ClientLink>
          </CardContent>
        </Card>
      )}

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-3">
        <ClientLink
          href="/training/new"
          variant="outline"
          className="h-14 flex-col gap-1"
        >
          <Target className="h-5 w-5" />
          <span className="text-xs">Iniciar entreno</span>
        </ClientLink>
        <ClientLink
          href="/sessions/new"
          variant="outline"
          className="h-14 flex-col gap-1"
        >
          <Plus className="h-5 w-5" />
          <span className="text-xs">Nueva sesión</span>
        </ClientLink>
      </div>
    </div>
  );
}

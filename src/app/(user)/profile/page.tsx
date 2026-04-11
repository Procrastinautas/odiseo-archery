import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/actions/auth";
import { redirect } from "next/navigation";
import { ArcherCard } from "@/components/archer-card/ArcherCard";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button-variants";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";
import { Plus, Pencil, LogOut } from "lucide-react";

const BOW_LABELS: Record<string, string> = {
  recurve: "Recurvo",
  compound: "Compuesto",
  barebow: "Arco Desnudo",
};

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: profile }, { data: bows }, { data: arrows }] =
    await Promise.all([
      supabase.from("profiles").select("*").eq("id", user.id).single(),
      supabase.from("bows").select("*, scope_marks(*)").eq("user_id", user.id),
      supabase.from("arrows").select("*").eq("user_id", user.id),
    ]);

  if (!profile) redirect("/onboarding");

  return (
    <div className="flex flex-col">
      <PageHeader
        title="Mi perfil"
        action={
          <>
            <form action={signOut}>
              <button
                type="submit"
                className={buttonVariants({ size: "sm", variant: "ghost" })}
              >
                <LogOut className="h-4 w-4 mr-1.5" />
                Salir
              </button>
            </form>
            <Link
              href="/profile/edit"
              className={buttonVariants({ size: "sm", variant: "outline" })}
            >
              <Pencil className="h-4 w-4 mr-1.5" />
              Editar
            </Link>
          </>
        }
      />

      <div className="flex flex-col gap-6 p-4">
        {/* Archer card */}
        <ArcherCard
          name={profile.name ?? ""}
          email={profile.email}
          pictureUrl={profile.picture_url}
          bowType={bows?.[0]?.type}
          hand={bows?.[0]?.hand}
        />

        {/* Bows */}
        <Card>
          <CardHeader className="pb-3 flex-row items-center justify-between">
            <CardTitle className="text-base">Arcos</CardTitle>
            <Link
              href="/profile/edit#arcos"
              className={buttonVariants({ size: "sm", variant: "ghost" })}
            >
              <Plus className="h-4 w-4" />
            </Link>
          </CardHeader>
          <CardContent className="space-y-4">
            {bows?.length ? (
              bows.map((bow, i) => (
                <div key={bow.id}>
                  {i > 0 && <Separator className="mb-4" />}
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">
                        {BOW_LABELS[bow.type]}
                      </span>
                      <Badge variant="secondary" className="text-xs">
                        {bow.hand === "right" ? "Diestro" : "Zurdo"}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {bow.draw_weight} lb
                      </Badge>
                    </div>
                    {bow.notes && (
                      <p className="text-sm text-muted-foreground">
                        {bow.notes}
                      </p>
                    )}
                    {/* Scope marks */}
                    {(
                      bow.scope_marks as unknown as {
                        distance: number;
                        mark_value: string;
                      }[]
                    )?.length > 0 && (
                      <div className="mt-2">
                        <p className="text-xs font-medium text-muted-foreground mb-1">
                          Miras
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {(
                            bow.scope_marks as unknown as {
                              distance: number;
                              mark_value: string;
                            }[]
                          ).map((sm) => (
                            <span
                              key={sm.distance}
                              className="rounded-md bg-muted px-2 py-0.5 text-xs"
                            >
                              {sm.distance}m → {sm.mark_value}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">
                Sin arcos registrados
              </p>
            )}
          </CardContent>
        </Card>

        {/* Arrows */}
        <Card>
          <CardHeader className="pb-3 flex-row items-center justify-between">
            <CardTitle className="text-base">Flechas</CardTitle>
            <Link
              href="/profile/edit#flechas"
              className={buttonVariants({ size: "sm", variant: "ghost" })}
            >
              <Plus className="h-4 w-4" />
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {arrows?.length ? (
              arrows.map((arrow) => (
                <div key={arrow.id} className="space-y-0.5">
                  <p className="font-medium text-sm">{arrow.brand}</p>
                  <p className="text-xs text-muted-foreground">
                    {[
                      arrow.diameter_mm ? `${arrow.diameter_mm}mm` : null,
                      arrow.shaft_material,
                      arrow.fletchings,
                      arrow.point_type,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">
                Sin flechas registradas
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

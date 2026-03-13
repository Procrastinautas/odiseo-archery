"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createClient } from "@/lib/supabase/client";
import { Loader2, Upload } from "lucide-react";
import { toast } from "sonner";

export default function OnboardingPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [name, setName] = useState("");
  const [pictureFile, setPictureFile] = useState<File | null>(null);
  const [picturePreview, setPicturePreview] = useState<string | null>(null);

  // First bow
  const [bowHand, setBowHand] = useState<string>("");
  const [bowType, setBowType] = useState<string>("");
  const [drawWeight, setDrawWeight] = useState<string>("");

  function handlePictureChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPictureFile(file);
    setPicturePreview(URL.createObjectURL(file));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;

    startTransition(async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      let pictureUrl: string | null = null;

      // Upload profile picture
      if (pictureFile) {
        const ext = pictureFile.name.split(".").pop();
        const path = `${user.id}/avatar.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("avatars")
          .upload(path, pictureFile, { upsert: true });

        if (!uploadError) {
          const { data } = supabase.storage.from("avatars").getPublicUrl(path);
          pictureUrl = data.publicUrl;
        }
      }

      // Upsert profile
      const { error: profileError } = await supabase.from("profiles").upsert({
        id: user.id,
        email: user.email!,
        name: name.trim(),
        picture_url: pictureUrl,
      });

      if (profileError) {
        toast.error("Error al guardar el perfil. Intenta de nuevo.");
        return;
      }

      // Save first bow if provided
      if (bowHand && bowType && drawWeight) {
        await supabase.from("bows").insert({
          user_id: user.id,
          hand: bowHand as "left" | "right",
          type: bowType as "recurve" | "compound" | "barebow",
          draw_weight: parseFloat(drawWeight),
        });
      }

      router.push("/dashboard");
    });
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Completa tu perfil</CardTitle>
        <CardDescription>
          Cuéntanos un poco sobre ti para empezar
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Profile picture */}
          <div className="flex flex-col items-center gap-3">
            <div className="relative h-24 w-24 rounded-full border-2 border-dashed border-border overflow-hidden bg-muted flex items-center justify-center">
              {picturePreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={picturePreview}
                  alt="Vista previa"
                  className="h-full w-full object-cover"
                />
              ) : (
                <Upload className="h-6 w-6 text-muted-foreground" />
              )}
            </div>
            <label className="cursor-pointer text-sm text-primary underline-offset-4 hover:underline">
              Subir foto
              <input
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={handlePictureChange}
              />
            </label>
          </div>

          {/* Name */}
          <div className="space-y-1.5">
            <Label htmlFor="name">Nombre completo *</Label>
            <Input
              id="name"
              placeholder="Tu nombre"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          {/* First bow */}
          <div className="rounded-md border p-4 space-y-3">
            <p className="text-sm font-medium">
              Tu arco{" "}
              <span className="text-muted-foreground font-normal">
                (opcional)
              </span>
            </p>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Mano dominante</Label>
                <Select
                  value={bowHand}
                  onValueChange={(v) => setBowHand(v ?? "")}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="right">Diestro</SelectItem>
                    <SelectItem value="left">Zurdo</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>Tipo de arco</Label>
                <Select
                  value={bowType}
                  onValueChange={(v) => setBowType(v ?? "")}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="recurve">Recurvo</SelectItem>
                    <SelectItem value="compound">Compuesto</SelectItem>
                    <SelectItem value="barebow">Arco Desnudo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="draw-weight">Libraje</Label>
              <Input
                id="draw-weight"
                type="number"
                placeholder="Ej: 28"
                min={1}
                max={100}
                value={drawWeight}
                onChange={(e) => setDrawWeight(e.target.value)}
              />
            </div>
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={isPending || !name.trim()}
          >
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Comenzar
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

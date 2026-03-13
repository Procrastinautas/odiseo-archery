"use client";

import { useRef, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import { updateProfile } from "@/actions/profile";
import { toast } from "sonner";
import { Camera, Loader2, Save } from "lucide-react";

interface ProfileInfoSectionProps {
  uid: string;
  name: string | null;
  pictureUrl: string | null;
}

const nameSchema = z.object({
  name: z.string().min(1, "El nombre es requerido").max(100),
});
type NameForm = z.infer<typeof nameSchema>;

export function ProfileInfoSection({
  uid,
  name,
  pictureUrl,
}: ProfileInfoSectionProps) {
  const [preview, setPreview] = useState<string | null>(pictureUrl);
  const [uploading, startUpload] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  const displayName = name ?? "";
  const initials =
    displayName
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "?";

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<NameForm>({
    resolver: zodResolver(nameSchema),
    defaultValues: { name: displayName },
  });

  function handleFile(file: File) {
    if (!file.type.startsWith("image/")) {
      toast.error("Solo se permiten imágenes");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("La imagen no puede superar los 5 MB");
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);

    startUpload(async () => {
      try {
        const supabase = createClient();
        const path = `${uid}/avatar`;

        const { error: uploadError } = await supabase.storage
          .from("avatars")
          .upload(path, file, { upsert: true, contentType: file.type });

        if (uploadError) throw uploadError;

        const {
          data: { publicUrl },
        } = supabase.storage.from("avatars").getPublicUrl(path);

        // Bust the CDN cache so the new image is fetched immediately
        const urlWithBuster = `${publicUrl}?t=${Date.now()}`;
        await updateProfile({ picture_url: urlWithBuster });
        // Switch preview from the local blob URL to the real storage URL
        URL.revokeObjectURL(preview ?? "");
        setPreview(urlWithBuster);
        toast.success("Foto actualizada");
      } catch (err) {
        setPreview(pictureUrl);
        toast.error("Error al subir la foto");
        console.error(err);
      }
    });
  }

  async function onNameSubmit(values: NameForm) {
    try {
      await updateProfile({ name: values.name });
      toast.success("Nombre actualizado");
    } catch {
      toast.error("Error al actualizar el nombre");
    }
  }

  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-4 pt-6">
        {/* Avatar */}
        <div className="relative">
          <Avatar className="h-24 w-24 border-2 border-muted">
            <AvatarImage src={preview ?? undefined} alt={displayName} />
            <AvatarFallback className="bg-slate-600 text-white text-2xl font-bold">
              {initials}
            </AvatarFallback>
          </Avatar>
          {uploading && (
            <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50">
              <Loader2 className="h-6 w-6 animate-spin text-white" />
            </div>
          )}
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
        >
          <Camera className="h-4 w-4 mr-1.5" />
          {uploading ? "Subiendo…" : "Cambiar foto"}
        </Button>

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
            e.target.value = "";
          }}
        />

        {/* Name form */}
        <form
          onSubmit={handleSubmit(onNameSubmit)}
          className="w-full flex flex-col gap-2"
        >
          <Label htmlFor="profile-name">Nombre</Label>
          <div className="flex gap-2">
            <Input
              id="profile-name"
              placeholder="Tu nombre completo"
              {...register("name")}
              aria-invalid={!!errors.name}
            />
            <Button
              type="submit"
              size="sm"
              disabled={isSubmitting}
              aria-label="Guardar nombre"
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
            </Button>
          </div>
          {errors.name && (
            <p className="text-xs text-destructive">{errors.name.message}</p>
          )}
        </form>
      </CardContent>
    </Card>
  );
}

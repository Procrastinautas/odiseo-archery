"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
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
import { signInWithEmail, signUpWithEmail } from "@/actions/auth";
import { Eye, EyeOff, Loader2 } from "lucide-react";

type Mode = "login" | "signup";

export default function LoginPage() {
  const searchParams = useSearchParams();
  const urlError = searchParams.get("error");

  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  function switchMode(next: Mode) {
    setMode(next);
    setFormError(null);
    setSuccessMessage(null);
    setPassword("");
    setConfirmPassword("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    setSuccessMessage(null);

    if (mode === "signup" && password !== confirmPassword) {
      setFormError("Las contraseñas no coinciden");
      return;
    }

    setLoading(true);

    if (mode === "login") {
      const result = await signInWithEmail(email, password);
      if (result?.error) {
        setFormError("Correo o contraseña incorrectos");
        setLoading(false);
      }
    } else {
      const result = await signUpWithEmail(email, password);
      if (result?.error) {
        setFormError(result.error);
        setLoading(false);
      } else if (result?.needsConfirmation) {
        setSuccessMessage("Revisa tu correo para confirmar tu cuenta");
        setLoading(false);
      }
    }
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Odiseo Archery</CardTitle>
        <CardDescription>
          {mode === "login" ? "Inicia sesión para continuar" : "Crea tu cuenta"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {urlError && (
          <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive text-center">
            Ocurrió un error. Intenta de nuevo.
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="email">Correo electrónico</Label>
            <Input
              id="email"
              type="email"
              placeholder="tu@correo.com"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">Contraseña</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder=""
                autoComplete={
                  mode === "login" ? "current-password" : "new-password"
                }
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pr-10"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground hover:text-foreground focus:outline-none"
                tabIndex={-1}
                aria-label={
                  showPassword ? "Ocultar contraseña" : "Mostrar contraseña"
                }
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>
          {mode === "signup" && (
            <div className="space-y-1.5">
              <Label htmlFor="confirm-password">Confirmar contraseña</Label>
              <div className="relative">
                <Input
                  id="confirm-password"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder=""
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((v) => !v)}
                  className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground hover:text-foreground focus:outline-none"
                  tabIndex={-1}
                  aria-label={
                    showConfirmPassword
                      ? "Ocultar contraseña"
                      : "Mostrar contraseña"
                  }
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
          )}
          {formError && <p className="text-sm text-destructive">{formError}</p>}
          {successMessage && (
            <p className="rounded-md bg-green-50 px-3 py-2 text-sm text-green-700 text-center">
              {successMessage}
            </p>
          )}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {mode === "login" ? "Iniciar sesión" : "Crear cuenta"}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          {mode === "login" ? (
            <>
              ¿No tienes cuenta?{" "}
              <button
                type="button"
                onClick={() => switchMode("signup")}
                className="underline underline-offset-4 hover:text-primary"
              >
                Regístrate
              </button>
            </>
          ) : (
            <>
              ¿Ya tienes cuenta?{" "}
              <button
                type="button"
                onClick={() => switchMode("login")}
                className="underline underline-offset-4 hover:text-primary"
              >
                Inicia sesión
              </button>
            </>
          )}
        </p>
      </CardContent>
    </Card>
  );
}

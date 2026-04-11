"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button-variants";
import { Loader2, Plus, Store } from "lucide-react";
import type { Database } from "@/types/database";

const CATEGORY_LABELS: Record<string, string> = {
  bow: "Arco",
  arrows: "Flechas",
  accessory: "Accesorio",
  other: "Otro",
};

type MarketplacePost = Pick<
  Database["public"]["Tables"]["marketplace_posts"]["Row"],
  "id" | "title" | "category" | "price" | "images"
>;

function MarketplaceSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3 animate-pulse">
      {Array.from({ length: 4 }).map((_, index) => (
        <Card key={index} className="overflow-hidden">
          <div className="aspect-square bg-muted" />
          <CardContent className="p-2.5 space-y-2">
            <div className="h-4 rounded bg-muted" />
            <div className="h-4 w-2/3 rounded bg-muted" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function MarketplaceGridClient() {
  const [posts, setPosts] = useState<MarketplacePost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadPosts() {
    setIsLoading(true);
    setError(null);

    const supabase = createClient();
    const { data, error: queryError } = await supabase
      .from("marketplace_posts")
      .select("id, title, category, price, images")
      .eq("status", "active")
      .order("created_at", { ascending: false });

    if (queryError) {
      setError("No se pudo cargar el mercado. Intenta nuevamente.");
      setIsLoading(false);
      return;
    }

    setPosts(data ?? []);
    setIsLoading(false);
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadPosts();
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  if (isLoading) return <MarketplaceSkeleton />;

  if (error) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
          <p className="text-sm text-muted-foreground">{error}</p>
          <button
            type="button"
            className={buttonVariants({ size: "sm", variant: "outline" })}
            onClick={loadPosts}
          >
            <Loader2 className="mr-1.5 h-4 w-4" />
            Reintentar
          </button>
        </CardContent>
      </Card>
    );
  }

  if (!posts.length) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
          <Store className="h-8 w-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            No hay publicaciones activas
          </p>
          <Link
            href="/marketplace/new"
            className={buttonVariants({ size: "sm" })}
          >
            <Plus className="mr-1.5 h-4 w-4" />
            Publicar equipos
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3">
      {posts.map((post) => {
        const images = Array.isArray(post.images) ? post.images : [];
        const firstImage = images[0] as string | undefined;

        return (
          <Link key={post.id} href={`/marketplace/${post.id}`}>
            <Card className="overflow-hidden hover:bg-accent/30 transition-colors">
              <div className="aspect-square bg-muted flex items-center justify-center">
                {firstImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={firstImage}
                    alt={post.title}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <Store className="h-8 w-8 text-muted-foreground" />
                )}
              </div>
              <CardContent className="p-2.5 space-y-1">
                <p className="text-sm font-medium line-clamp-2 leading-tight">
                  {post.title}
                </p>
                <div className="flex items-center justify-between">
                  <Badge variant="secondary" className="text-xs">
                    {CATEGORY_LABELS[post.category]}
                  </Badge>
                  {post.price != null && (
                    <span className="text-sm font-semibold">
                      ${post.price.toLocaleString("es-CO")}
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}

import { PageHeader } from "@/components/layout/PageHeader";
import { MarketplaceGridClient } from "@/components/marketplace/MarketplaceGridClient";
import { buttonVariants } from "@/components/ui/button-variants";
import Link from "next/link";
import { Plus } from "lucide-react";

export default function MarketplacePage() {
  return (
    <div className="flex flex-col">
      <PageHeader
        title="Mercado"
        action={
          <Link
            href="/marketplace/new"
            className={buttonVariants({ size: "sm" })}
          >
            <Plus className="h-4 w-4 mr-1" />
            Publicar
          </Link>
        }
      />

      <div className="p-4">
        <MarketplaceGridClient />
      </div>
    </div>
  );
}

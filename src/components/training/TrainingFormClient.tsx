"use client";

import dynamic from "next/dynamic";
import type { Database } from "@/types/database";

type TrainingSession = Database["public"]["Tables"]["training_sessions"]["Row"];
type Bow = Database["public"]["Tables"]["bows"]["Row"];
type Arrow = Database["public"]["Tables"]["arrows"]["Row"];

const TrainingForm = dynamic(
  () =>
    import("@/components/training/TrainingForm").then(
      (mod) => mod.TrainingForm,
    ),
  { ssr: false },
);

interface Props {
  session: TrainingSession;
  bows: Bow[];
  arrows: Arrow[];
}

export function TrainingFormClient(props: Props) {
  return <TrainingForm {...props} />;
}

"use client";

import dynamic from "next/dynamic";
import type { TrainingStartRecapCard } from "@/actions/training";
import type { Database } from "@/types/database";

type Bow = Database["public"]["Tables"]["bows"]["Row"];
type Arrow = Database["public"]["Tables"]["arrows"]["Row"];

const NewTrainingForm = dynamic(
  () =>
    import("@/components/training/NewTrainingForm").then(
      (mod) => mod.NewTrainingForm,
    ),
  { ssr: false },
);

interface Props {
  bows: Bow[];
  arrows: Arrow[];
  recapCards: TrainingStartRecapCard[];
}

export function NewTrainingFormClient(props: Props) {
  return <NewTrainingForm {...props} />;
}

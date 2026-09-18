export type EscrowStatus =
  | "OPEN"
  | "FUNDED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "RELEASED"
  | "DISPUTED"
  | "CANCELLED"
  | "REFUNDED";

export interface CreateEscrowJobInput {
  title: string;
  description: string;
  amountXrp: number;
  clientId: string;
  finishAfterHours?: number;
  cancelAfterDays?: number;
}

export const allowedTransitions: Record<EscrowStatus, EscrowStatus[]> = {
  OPEN: ["FUNDED", "CANCELLED"],
  FUNDED: ["IN_PROGRESS", "CANCELLED", "REFUNDED"],
  IN_PROGRESS: ["COMPLETED", "DISPUTED", "CANCELLED"],
  COMPLETED: ["RELEASED", "DISPUTED"],
  RELEASED: [],
  DISPUTED: ["RELEASED", "REFUNDED"],
  CANCELLED: [],
  REFUNDED: [],
};

export function canTransition(from: EscrowStatus, to: EscrowStatus): boolean {
  return allowedTransitions[from]?.includes(to) ?? false;
}

export function getEscrowStatusLabel(status: EscrowStatus): string {
  const labels: Record<EscrowStatus, string> = {
    OPEN: "مفتوح - ينتظر مطور",
    FUNDED: "ممول - جاهز للبدء",
    IN_PROGRESS: "قيد التنفيذ",
    COMPLETED: "مكتمل - بانتظار الموافقة",
    RELEASED: "تم تحرير المبلغ",
    DISPUTED: "نزاع",
    CANCELLED: "ملغي",
    REFUNDED: "مسترد",
  };
  return labels[status] || status;
}

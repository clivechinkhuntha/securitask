const labels: Record<string, string> = {
  DRAFT: "Draft",
  ISSUED: "Posted",
  PARTIALLY_PAID: "Partly paid",
  PAID: "Paid",
  OVERDUE: "Overdue",
  CANCELLED: "Cancelled",
};

export const invoiceStatusLabel = (status: string) => labels[status] ?? status;

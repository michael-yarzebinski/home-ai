export interface Recipe {
    id: string;
    readableId: number;           // Human-friendly auto-incrementing ID
    title: string;
    sourceUrl: string;
    pdfPath: string;
    rawText?: string | null;
    metadata: Record<string, any>;
    active: boolean;
    createdAt: Date;
    updatedAt: Date;
  }
export type MaterialKind = "photo" | "document";

export type Material = {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  kind: MaterialKind;
  createdAt: string;
};

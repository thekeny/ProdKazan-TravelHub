import { PDF_PREVIEW } from "@/configs/consts/materials.const";

export async function renderPdfPreview(url: string): Promise<string> {
  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/build/pdf.worker.min.mjs",
    import.meta.url,
  ).toString();
  const loading = pdfjs.getDocument({ url });
  try {
    const document = await loading.promise;
    const page = await document.getPage(1);
    const original = page.getViewport({ scale: 1 });
    const scale = Math.min(
      PDF_PREVIEW.MAX_WIDTH / original.width,
      PDF_PREVIEW.MAX_HEIGHT / original.height,
    );
    const viewport = page.getViewport({ scale });
    const canvas = window.document.createElement("canvas");
    canvas.width = Math.ceil(viewport.width);
    canvas.height = Math.ceil(viewport.height);
    await page.render({ canvas, viewport }).promise;
    return canvas.toDataURL("image/png");
  } finally {
    await loading.destroy();
  }
}

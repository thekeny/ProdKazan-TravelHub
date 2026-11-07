import {
  COVER_LIMITS,
  MATERIAL_LIMITS,
} from "@/configs/consts/materials.const";

type CompressionOptions = {
  maxDimension: number;
  maxBytes: number;
  quality?: number;
};

type CompressedImage = {
  blob: Blob;
  dataUrl: string;
  width: number;
  height: number;
};

function readBlobAsDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () =>
      reject(new Error("Не удалось прочитать изображение."));
    reader.onload = () => resolve(String(reader.result));
    reader.readAsDataURL(blob);
  });
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Файл не является корректным изображением."));
    };
    image.src = url;
  });
}

function encode(
  canvas: HTMLCanvasElement,
  type: string,
  quality: number,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Не удалось сжать изображение."));
      },
      type,
      quality,
    );
  });
}

function scaledSize(
  width: number,
  height: number,
  maxDimension: number,
): { width: number; height: number } {
  const scale = Math.min(1, maxDimension / Math.max(width, height));
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}

/**
 * Сжимает изображение на клиенте, чтобы обложки и материалы не съедали
 * квоту браузерного хранилища.
 */
async function compressImage(
  file: File,
  options: CompressionOptions,
): Promise<CompressedImage> {
  const image = await loadImage(file);
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  if (!context)
    throw new Error("Браузер не поддерживает обработку изображений.");
  const quality = options.quality ?? 0.82;
  const attempts = [
    { dimension: options.maxDimension, quality },
    { dimension: Math.round(options.maxDimension * 0.75), quality: 0.7 },
    { dimension: Math.round(options.maxDimension * 0.5), quality: 0.6 },
  ];
  let result: Blob | null = null;
  let lastSize = { width: image.naturalWidth, height: image.naturalHeight };
  for (const attempt of attempts) {
    const size = scaledSize(
      image.naturalWidth,
      image.naturalHeight,
      attempt.dimension,
    );
    lastSize = size;
    canvas.width = size.width;
    canvas.height = size.height;
    context.clearRect(0, 0, size.width, size.height);
    context.drawImage(image, 0, 0, size.width, size.height);
    const blob = await encode(canvas, "image/webp", attempt.quality);
    result = blob;
    if (blob.size <= options.maxBytes) break;
  }
  if (!result) throw new Error("Не удалось сжать изображение.");
  return {
    blob: result,
    dataUrl: await readBlobAsDataUrl(result),
    width: lastSize.width,
    height: lastSize.height,
  };
}

export async function compressCover(file: File): Promise<string> {
  const compressed = await compressImage(file, {
    maxDimension: COVER_LIMITS.MAX_DIMENSION,
    maxBytes: COVER_LIMITS.MAX_STORED_SIZE,
    quality: 0.78,
  });
  return compressed.dataUrl;
}

export async function compressMaterial(file: File): Promise<Blob> {
  const compressed = await compressImage(file, {
    maxDimension: MATERIAL_LIMITS.MAX_DIMENSION,
    maxBytes: MATERIAL_LIMITS.MAX_STORED_SIZE,
  });
  return compressed.blob;
}


export interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: "webp" | "jpeg";
}

export const PRODUCT_IMAGE_OPTIONS: CompressionOptions = {
  maxWidth: 1200,
  maxHeight: 1200,
  quality: 0.78,
  format: "webp",
};

export const THUMBNAIL_OPTIONS: CompressionOptions = {
  maxWidth: 400,
  maxHeight: 400,
  quality: 0.7,
  format: "webp",
};

export const AVATAR_OPTIONS: CompressionOptions = {
  maxWidth: 300,
  maxHeight: 300,
  quality: 0.8,
  format: "webp",
};

let webpSupportPromise: Promise<boolean> | null = null;
function checkWebPSupport(): Promise<boolean> {
  if (webpSupportPromise) return webpSupportPromise;
  webpSupportPromise = new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img.width > 0);
    img.onerror = () => resolve(false);
    img.src =
      "data:image/webp;base64,UklGRiQAAABXRUJQVlA4IBgAAAAwAQCdASoBAAEAAQAcJZQCdAEO/gHOAAA=";
  });
  return webpSupportPromise;
}

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"];
const MAX_ORIGINAL_SIZE = 50 * 1024 * 1024;

export function validateFile(file: File): string | null {
  const isHeic = /\.(heic|heif)$/i.test(file.name);
  if (!ALLOWED_TYPES.includes(file.type) && !isHeic) {
    return "Formati nuk mbështetet. Përdor JPEG, PNG ose WebP.";
  }
  if (file.size > MAX_ORIGINAL_SIZE) {
    return "Fotoja është shumë e madhe. Maksimumi është 50MB.";
  }
  return null;
}

export async function normalizeFile(file: File): Promise<File> {
  const isHeic =
    file.type === "image/heic" ||
    file.type === "image/heif" ||
    /\.(heic|heif)$/i.test(file.name);
  if (!isHeic) return file;
  const { default: heic2any } = await import("heic2any");
  const converted = (await heic2any({
    blob: file,
    toType: "image/jpeg",
    quality: 0.9,
  })) as Blob;
  return new File(
    [converted],
    file.name.replace(/\.(heic|heif)$/i, ".jpg"),
    { type: "image/jpeg" },
  );
}

export async function compressImage(
  file: File,
  options: CompressionOptions = {},
): Promise<File> {
  const {
    maxWidth = 1200,
    maxHeight = 1200,
    quality = 0.75,
    format = "webp",
  } = options;

  const source = await normalizeFile(file);

  const supportsWebP = format === "webp" ? await checkWebPSupport() : false;
  const outputFormat = supportsWebP ? "image/webp" : "image/jpeg";
  const extension = supportsWebP ? "webp" : "jpg";

  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(source);

    img.onload = () => {
      URL.revokeObjectURL(url);

      let { width, height } = img;
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new Error("Canvas not supported"));
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (!blob) return reject(new Error("Compression failed"));
          const compressed = new File(
            [blob],
            source.name.replace(/\.[^.]+$/, `.${extension}`),
            { type: outputFormat },
          );
          if (import.meta.env.DEV) {
            const reduction = ((1 - compressed.size / file.size) * 100).toFixed(1);
            // eslint-disable-next-line no-console
            console.log(
              `[compressImage] ${file.name}: ${(file.size / 1024 / 1024).toFixed(2)}MB → ${(compressed.size / 1024 / 1024).toFixed(2)}MB (${reduction}% smaller)`,
            );
          }
          resolve(compressed);
        },
        outputFormat,
        quality,
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to load image"));
    };

    img.src = url;
  });
}

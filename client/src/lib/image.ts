// Thu nhỏ ảnh bằng canvas rồi trả về data URL (base64).
// Dùng làm phương án dự phòng khi upload Supabase Storage thất bại (vd lỗi RLS),
// để avatar/ảnh phòng luôn hiển thị được mà không phụ thuộc vào storage policy.
export async function downscaleImageToDataUrl(
  file: File,
  maxSize = 512,
  quality = 0.85,
): Promise<string> {
  const sourceUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });

  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Không đọc được ảnh'));
    image.src = sourceUrl;
  });

  const longest = Math.max(img.width, img.height) || maxSize;
  const scale = Math.min(1, maxSize / longest);
  const width = Math.max(1, Math.round(img.width * scale));
  const height = Math.max(1, Math.round(img.height * scale));

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return sourceUrl;
  ctx.drawImage(img, 0, 0, width, height);

  return canvas.toDataURL('image/jpeg', quality);
}

export function dataURLtoFile(dataUrl: string, filename: string): File {
  const arr = dataUrl.split(',');
  const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new File([u8arr], filename, { type: mime });
}


/** Resize uploads before storing them so demo conversations stay light enough for session storage. */
export function resizeAttachment(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/') || file.size > 20 * 1024 * 1024) { reject(new Error('Choose an image under 20 MB.')); return; }
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Could not read image.'));
    reader.onload = () => {
      const image = new Image();
      image.onerror = () => reject(new Error('Unsupported image.'));
      image.onload = () => {
        const scale = Math.min(1, 960 / Math.max(image.width, image.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(image.width * scale); canvas.height = Math.round(image.height * scale);
        const context = canvas.getContext('2d');
        if (!context) { reject(new Error('Image processing unavailable.')); return; }
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.72));
      };
      image.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}

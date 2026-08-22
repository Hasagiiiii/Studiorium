const DEFAULT_MAX_SOURCE_BYTES = 15 * 1024 * 1024;
const DEFAULT_MAX_SIDE = 1800;
const DEFAULT_QUALITY = 0.84;
const DEFAULT_TARGET_BYTES = 1_500_000;

function loadImage(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('O navegador não conseguiu processar esta imagem.'));
    };
    image.src = url;
  });
}

function canvasBlob(canvas, type, quality) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Não foi possível otimizar esta imagem.'));
      },
      type,
      quality,
    );
  });
}

function dimensions(width, height, maxSide) {
  const scale = Math.min(1, maxSide / Math.max(width, height));
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}

async function encodeEfficiently(canvas, quality, targetBytes) {
  const candidates = [];
  for (const type of ['image/webp', 'image/jpeg']) {
    let currentQuality = quality;
    let blob = await canvasBlob(canvas, type, currentQuality);
    while (blob.size > targetBytes && currentQuality > 0.68) {
      currentQuality -= 0.06;
      blob = await canvasBlob(canvas, type, currentQuality);
    }
    candidates.push({ blob, type });
  }
  return candidates.sort((a, b) => a.blob.size - b.blob.size)[0];
}

export async function optimizeImageFile(file, options = {}) {
  if (!file || !String(file.type || '').startsWith('image/')) {
    throw new Error('Escolha uma imagem válida.');
  }
  const maxSourceBytes = options.maxSourceBytes || DEFAULT_MAX_SOURCE_BYTES;
  if (file.size > maxSourceBytes) {
    throw new Error(`A imagem original precisa ter até ${Math.round(maxSourceBytes / 1024 / 1024)} MB.`);
  }

  const image = await loadImage(file);
  const naturalWidth = Number(image.naturalWidth || image.width || 0);
  const naturalHeight = Number(image.naturalHeight || image.height || 0);
  if (!naturalWidth || !naturalHeight) throw new Error('Não foi possível identificar a imagem.');

  const size = dimensions(naturalWidth, naturalHeight, options.maxSide || DEFAULT_MAX_SIDE);
  const canvas = document.createElement('canvas');
  canvas.width = size.width;
  canvas.height = size.height;
  const context = canvas.getContext('2d', { alpha: false });
  if (!context) throw new Error('Não foi possível otimizar esta imagem.');
  context.fillStyle = '#ffffff';
  context.fillRect(0, 0, size.width, size.height);
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = 'high';
  context.drawImage(image, 0, 0, size.width, size.height);

  const encoded = await encodeEfficiently(
    canvas,
    options.quality || DEFAULT_QUALITY,
    options.targetBytes || DEFAULT_TARGET_BYTES,
  );
  const extension = encoded.type === 'image/webp' ? '.webp' : '.jpg';
  const baseName = String(file.name || 'imagem').replace(/\.[^.]+$/, '').slice(0, 80) || 'imagem';
  return new File([encoded.blob], `${baseName}${extension}`, { type: encoded.type });
}

export function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || '').split(',')[1] || '');
    reader.onerror = () => reject(new Error('Não foi possível ler o arquivo.'));
    reader.readAsDataURL(file);
  });
}

export async function optimizedImagePayload(file, options = {}) {
  const optimized = await optimizeImageFile(file, options);
  return {
    file: optimized,
    payload: {
      name: optimized.name,
      mime: optimized.type,
      dataBase64: await fileToBase64(optimized),
    },
  };
}

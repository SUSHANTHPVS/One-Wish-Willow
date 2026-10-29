export const MAX_PROFILE_PICTURE_BYTES = 5 * 1024 * 1024;

export function normalizeProfilePicture(fileData, fileName) {
  if (typeof fileData !== 'string' || typeof fileName !== 'string') {
    throw new Error('Select an image to upload.');
  }
  if (fileData.length > Math.ceil(MAX_PROFILE_PICTURE_BYTES / 3) * 4 + 128) {
    throw new Error('Profile picture must be no larger than 5MB.');
  }
  const match = /^data:(image\/(?:png|jpeg|gif|webp));base64,([A-Za-z0-9+/]+={0,2})$/.exec(fileData);
  if (!match) throw new Error('Upload a PNG, JPEG, GIF, or WebP image.');
  const [, mime, encoded] = match;
  const bytes = Buffer.from(encoded, 'base64');
  if (!bytes.length || bytes.toString('base64') !== encoded) {
    throw new Error('The image data is invalid.');
  }
  if (bytes.length > MAX_PROFILE_PICTURE_BYTES) {
    throw new Error('Profile picture must be no larger than 5MB.');
  }
  const formats = {
    'image/png': { extension: /\.png$/i, valid: bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])) },
    'image/jpeg': { extension: /\.jpe?g$/i, valid: bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255 },
    'image/gif': { extension: /\.gif$/i, valid: /^GIF8[79]a$/.test(bytes.subarray(0, 6).toString('ascii')) },
    'image/webp': { extension: /\.webp$/i, valid: bytes.subarray(0, 4).toString('ascii') === 'RIFF' && bytes.subarray(8, 12).toString('ascii') === 'WEBP' },
  };
  if (!formats[mime].valid || !formats[mime].extension.test(fileName)) {
    throw new Error('The image contents and file type do not match.');
  }
  return `data:${mime};base64,${bytes.toString('base64')}`;
}
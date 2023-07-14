export default async function convertToBase64(files) {
  const filePromises = Array.from(files).map((file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;

      reader.readAsDataURL(file);
    });
  });

  const results = await Promise.all(filePromises);
  return results;
}

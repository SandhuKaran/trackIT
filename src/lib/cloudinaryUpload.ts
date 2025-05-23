export async function uploadImage(file: File): Promise<string> {
  const data = new FormData();
  data.append("file", file);
  data.append("upload_preset", process.env.NEXT_PUBLIC_CLOUD_UNSIGNED_PRESET!);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUD_NAME}/image/upload`,
    { method: "POST", body: data }
  );

  if (!res.ok) throw new Error("Upload failed");
  const json = await res.json();
  return json.secure_url as string; // return the HTTPS CDN URL
}

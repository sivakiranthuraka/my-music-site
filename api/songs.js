import fs from "fs";
import path from "path";

export default function handler(req, res) {
  const songsDir = path.join(process.cwd(), "public", "songs");

  if (req.method === "GET") {
    try {
      const files = fs.readdirSync(songsDir);
      const mp3Files = files.filter((file) => file.endsWith(".mp3"));
      res.status(200).json(mp3Files);
    } catch (err) {
      res.status(500).json({ error: "Failed to read songs directory" });
    }
  } else {
    res.status(405).json({ error: "Method not allowed" });
  }
}

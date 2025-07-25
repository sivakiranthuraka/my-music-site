import fs from "fs";
import path from "path";

const playlistsFile = path.join(process.cwd(), "playlists.json");

function getPlaylists() {
  if (!fs.existsSync(playlistsFile)) return {};
  return JSON.parse(fs.readFileSync(playlistsFile, "utf8"));
}

function savePlaylists(data) {
  fs.writeFileSync(playlistsFile, JSON.stringify(data, null, 2));
}

export default function handler(req, res) {
  const playlists = getPlaylists();

  if (req.method === "GET") {
    res.status(200).json(Object.keys(playlists));
  } else if (req.method === "POST") {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: "Playlist name required" });

    if (playlists[name]) {
      return res.status(409).json({ error: "Playlist already exists" });
    }

    playlists[name] = [];
    savePlaylists(playlists);
    res.status(201).json({ message: "Playlist created" });
  } else {
    res.status(405).json({ error: "Method not allowed" });
  }
}

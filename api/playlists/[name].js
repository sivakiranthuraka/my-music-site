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
  const { name } = req.query;

  if (req.method === "DELETE") {
    const playlists = getPlaylists();

    if (!playlists[name]) {
      return res.status(404).json({ error: "Playlist not found" });
    }

    delete playlists[name];
    savePlaylists(playlists);
    res.status(200).json({ message: "Playlist deleted" });
  } else {
    res.status(405).json({ error: "Method not allowed" });
  }
}

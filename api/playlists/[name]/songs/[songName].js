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
  const { name, songName } = req.query;
  const playlists = getPlaylists();

  if (!playlists[name]) {
    return res.status(404).json({ error: "Playlist not found" });
  }

  if (req.method === "DELETE") {
    playlists[name] = playlists[name].filter((s) => s !== songName);
    savePlaylists(playlists);
    return res
      .status(200)
      .json({ message: `Removed "${songName}" from "${name}"` });
  } else {
    res.status(405).json({ error: "Method not allowed" });
  }
}

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
  const name = decodeURIComponent(req.query.name);
  const playlists = getPlaylists();

  if (!playlists[name]) {
    return res.status(404).json({ error: "Playlist not found" });
  }

  if (req.method === "POST") {
    const { song } = req.body;
    if (!song) return res.status(400).json({ error: "No song provided" });

    // ✅ ADD THIS LOGGING LINE
    console.log(`Adding song: ${song} to playlist: ${name}`);

    if (!playlists[name].includes(song)) {
      playlists[name].push(song);
      savePlaylists(playlists);
    }

    res.status(200).json({ success: true });
  } else if (req.method === "GET") {
    res.status(200).json(playlists[name]);
  } else {
    res.status(405).json({ error: "Method not allowed" });
  }
}

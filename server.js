const express = require("express");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = 3000;

const songsDir = path.join(__dirname, "public", "songs");
const playlistsFile = path.join(__dirname, "playlists.json");

function getPlaylists() {
  if (!fs.existsSync(playlistsFile)) {
    return {};
  }
  return JSON.parse(fs.readFileSync(playlistsFile, "utf8"));
}

function savePlaylists(playlists) {
  fs.writeFileSync(playlistsFile, JSON.stringify(playlists, null, 2));
}

// Middleware
app.use(express.static(path.join(__dirname, "public")));
app.use(express.json()); // Handles JSON request bodies

// Get all songs
app.get("/songs", (req, res) => {
  fs.readdir(songsDir, (err, files) => {
    if (err) {
      return res.status(500).json({ error: "Failed to read songs directory" });
    }
    const mp3Files = files.filter((file) => file.endsWith(".mp3"));
    res.json(mp3Files);
  });
});

// Get all playlists
app.get("/playlists", (req, res) => {
  if (!fs.existsSync(playlistsFile)) return res.json([]);
  const playlists = JSON.parse(fs.readFileSync(playlistsFile, "utf-8"));
  res.json(Object.keys(playlists));
});

// Create a new playlist
app.post("/playlists", (req, res) => {
  const { name } = req.body;
  if (!name)
    return res.status(400).json({ error: "Playlist name is required" });

  let playlists = {};
  if (fs.existsSync(playlistsFile)) {
    playlists = JSON.parse(fs.readFileSync(playlistsFile, "utf-8"));
  }

  if (playlists[name]) {
    return res.status(409).json({ error: "Playlist already exists" });
  }

  playlists[name] = [];
  fs.writeFileSync(playlistsFile, JSON.stringify(playlists, null, 2));
  res.status(201).json({ message: "Playlist created" });
});

// Delete a playlist
app.delete("/playlists/:name", (req, res) => {
  const { name } = req.params;

  if (!fs.existsSync(playlistsFile)) {
    return res.status(404).json({ error: "Playlists not found" });
  }

  const playlists = JSON.parse(fs.readFileSync(playlistsFile, "utf-8"));
  if (!playlists[name]) {
    return res.status(404).json({ error: "Playlist not found" });
  }

  delete playlists[name];
  fs.writeFileSync(playlistsFile, JSON.stringify(playlists, null, 2));
  res.status(200).json({ message: "Playlist deleted" });
});

// Get songs from a specific playlist
app.get("/playlists/:name/songs", (req, res) => {
  const name = req.params.name;
  const playlists = getPlaylists();

  if (!playlists[name]) {
    return res.status(404).json({ error: "Playlist not found" });
  }

  res.json(playlists[name]);
});

// Get songs from a specific playlist
// Add a song to a playlist
app.post("/playlists/:name/songs", (req, res) => {
  const name = req.params.name;
  const { song } = req.body;

  if (!song) {
    return res.status(400).json({ error: "No song provided" });
  }

  const playlists = getPlaylists();

  if (!playlists[name]) {
    return res.status(404).json({ error: "Playlist not found" });
  }

  if (!playlists[name].includes(song)) {
    playlists[name].push(song);
    savePlaylists(playlists);
  }

  res.json({ success: true });
});

// DELETE route to remove a song from a playlist using URL parameters
app.delete("/playlists/:playlistName/songs/:songName", (req, res) => {
  const playlistName = decodeURIComponent(req.params.playlistName);
  const song = decodeURIComponent(req.params.songName);

  if (!song) {
    return res.status(400).json({ message: "Song name is required" });
  }

  const playlists = getPlaylists();
  if (!playlists[playlistName]) {
    return res.status(404).json({ message: "Playlist not found" });
  }

  // Filter out the song to delete
  playlists[playlistName] = playlists[playlistName].filter((s) => s !== song);
  savePlaylists(playlists);

  res
    .status(200)
    .json({ message: `Song "${song}" removed from "${playlistName}"` });
});

app.listen(3000, () => {
  console.log("Server started on http://localhost:3000");
});

let songs = [];
const audioPlayer = document.getElementById("audio-player");
const songList = document.getElementById("song-list");
const currentSongText = document.getElementById("current-song");
const volumeSlider = document.getElementById("volume");
const playIcon = document.getElementById("play-icon");
const progress = document.getElementById("progress");
const currentTimeDisplay = document.getElementById("current-time");
const totalDurationDisplay = document.getElementById("total-duration");
const playlistButton = document.getElementById("playlist-button");
const playlistMenu = document.getElementById("playlistListContainer"); // ✅ correct
const playlistList = document.getElementById("playlistList");
const addSongsContainer = document.getElementById("add-songs-container");
const confirmActions = document.getElementById("confirm-actions");
const confirmButton = document.getElementById("confirm-button");
const cancelButton = document.getElementById("cancel-button");

let currentSongIndex = 0;

// Toggle dropdown
playlistButton.addEventListener("click", () => {
  playlistMenu.style.display =
    playlistMenu.style.display === "block" ? "none" : "block";
});

let currentPlaylist = null;
let selectionMode = false;
// Load playlists
function loadPlaylists(playlistName) {
  currentPlaylist = playlistName;
  fetch("/api/playlists")
    .then((res) => res.json())
    .then((data) => {
      playlistList.innerHTML = "";
      data.forEach((playlistName) => {
        const btn = document.createElement("button");
        btn.textContent = playlistName;
        btn.className = "playlist-item"; // match song-item styles
        btn.onclick = () => {
          loadPlaylistSongs(playlistName);
          playlistMenu.style.display = "none";
          showHomeButton();
          document.getElementById("playlist-actions").style.display = "block"; // show buttons
        };
        playlistList.appendChild(btn);
      });
    })
    .catch((err) => console.error("Failed to load playlists:", err));
}
document.getElementById("home-button").addEventListener("click", () => {
  loadAllSongs(); // Load all songs again

  // Hide Home button again
  document.getElementById("home-button").style.display = "none";

  // 👇 Hide Add Songs / Delete Songs when returning home
  document.getElementById("playlist-actions").style.display = "none";
});

function showToast(message) {
  const container = document.getElementById("toast-container");
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(() => container.removeChild(toast), 3000);
}

// Create playlist
function createPlaylist() {
  const name = prompt("Enter playlist name:")?.trim();
  if (!name) return showToast("Playlist name cannot be empty.");
  fetch("/api/playlists", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  })
    .then((res) => {
      if (res.ok) {
        loadPlaylists();
        playlistMenu.style.display = "none"; // 👈 Add it here
        showToast(`Playlist "${name}" created successfully!`); // ✅ Success message
      } else if (res.status === 409) {
        showToast("Playlist already exists.");
      } else {
        showToast("Failed to create playlist");
      }
    })
    .catch(() => showToast("Error creating playlist"));
}

// Delete playlist
function deletePlaylist() {
  const name = prompt("Enter playlist name to delete:")?.trim();
  if (!name) return showToast("Playlist name cannot be empty.");
  fetch(`/api/playlists/${encodeURIComponent(name)}`, {
    method: "DELETE",
  })
    .then((res) => {
      if (res.ok) {
        loadPlaylists();
        playlistMenu.style.display = "none"; // 👈 Close dropdown
        showToast(`Playlist "${name}" deleted successfully!`); // ✅ Success message
      } else {
        showToast("Failed to delete playlist");
      }
    })
    .catch(() => showToast("Error deleting playlist"));
}

// Load playlists on page load
loadPlaylists();

// Fetch and render songs
function loadAllSongs() {
  fetch("/api/songs")
    .then((res) => res.json())
    .then((data) => {
      songs = data
        .filter((name) => name.endsWith(".mp3"))
        .map((name) => name.replace(".mp3", ""));
      renderSongList();
      currentSongText.textContent = "All Songs"; // Optional title
    })
    .catch((err) => {
      console.error("Failed to load songs", err);
    });
}

function renderSongList() {
  songList.innerHTML = "";
  songs.forEach((title, index) => {
    const div = document.createElement("div");
    div.textContent = title;
    div.classList.add("song-item");
    div.onclick = () => {
      if (currentSongIndex === index && !audioPlayer.paused) {
        audioPlayer.currentTime = 0;
      } else {
        playSong(index);
      }
    };
    songList.appendChild(div);
  });
}
function showHomeButton() {
  const homeBtn = document.getElementById("home-button");
  homeBtn.style.visibility = "visible";
  homeBtn.style.opacity = "1";
}

function hideHomeButton() {
  const homeBtn = document.getElementById("home-button");
  homeBtn.style.opacity = "0";
  setTimeout(() => {
    homeBtn.style.visibility = "hidden";
  }, 300);
}

function playSong(index) {
  currentSongIndex = index;
  const songName = songs[index];
  const filename = `${songName}.mp3`;
  audioPlayer.src = `songs/${filename}`;

  audioPlayer
    .play()
    .then(() => {
      document.querySelector(".audio-bar").classList.add("visible");
      playIcon.classList.replace("fa-play", "fa-pause");
    })
    .catch((err) => {
      console.warn(
        "Autoplay blocked. Audio will play after user interaction.",
        err
      );
      playIcon.classList.replace("fa-pause", "fa-play");
    });

  currentSongText.textContent = `Now Playing: ${songName}`;

  const allSongs = songList.querySelectorAll(".song-item");
  allSongs.forEach((div, i) => {
    div.classList.toggle("active", i === index);
  });

  currentTimeDisplay.textContent = "0:00";
  totalDurationDisplay.textContent = "0:00";
  updateProgressBar();
}

function playPause() {
  if (audioPlayer.paused) {
    audioPlayer.play();
    playIcon.classList.replace("fa-play", "fa-pause");
  } else {
    audioPlayer.pause();
    playIcon.classList.replace("fa-pause", "fa-play");
  }

  document.querySelector(".audio-bar").classList.add("visible");
}

function nextSong() {
  currentSongIndex = (currentSongIndex + 1) % songs.length;
  playSong(currentSongIndex);
}

function prevSong() {
  currentSongIndex = (currentSongIndex - 1 + songs.length) % songs.length;
  playSong(currentSongIndex);
}

volumeSlider.addEventListener("input", () => {
  audioPlayer.volume = volumeSlider.value;
});

let debounceTimer;
document.getElementById("search").addEventListener("input", function () {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    const filter = this.value.toLowerCase();
    const songDivs = songList.getElementsByClassName("song-item");
    for (let i = 0; i < songDivs.length; i++) {
      const songName = songDivs[i].textContent.toLowerCase();
      songDivs[i].style.display = songName.includes(filter) ? "" : "none";
    }
  }, 200); // adjust delay as needed
});

audioPlayer.addEventListener("timeupdate", () => {
  if (audioPlayer.duration) {
    const percent = (audioPlayer.currentTime / audioPlayer.duration) * 100;
    progress.style.width = percent + "%";
    currentTimeDisplay.textContent = formatTime(audioPlayer.currentTime);
    totalDurationDisplay.textContent = formatTime(audioPlayer.duration);
  }
});

audioPlayer.addEventListener("ended", () => {
  nextSong();
});

audioPlayer.onerror = () => {
  showToast("Error loading song: " + songs[currentSongIndex]);
};

function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
}

function updateProgressBar() {
  progress.style.width = "0%";
}

const progressContainer = document.getElementById("progress-container");

progressContainer.addEventListener("click", function (e) {
  const width = this.clientWidth;
  const clickX = e.offsetX;
  const duration = audioPlayer.duration;

  if (!isNaN(duration)) {
    audioPlayer.currentTime = (clickX / width) * duration;
  }
});
function loadPlaylistSongs(playlistName) {
  fetch(`/api/playlists/${encodeURIComponent(playlistName)}/songs`)
    .then((res) => res.json())
    .then((playlistSongs) => {
      if (!Array.isArray(playlistSongs)) {
        showToast("Error: Playlist is empty or not found.");
        return;
      }
      songs = playlistSongs;
      currentSongIndex = 0;
      renderSongList();
      currentSongText.textContent = `Playlist: ${playlistName}`;
      document.getElementById("playlist-actions").style.display = "block";
      document.getElementById("home-button").style.display = "inline-block";
    })
    .catch((err) => {
      console.error("Failed to load playlist songs", err);
      showToast("Could not load playlist.");
    });
}

document.getElementById("add-song-button").addEventListener("click", () => {
  const playlistName = currentSongText.textContent
    .replace("Playlist: ", "")
    .trim();
  if (!playlistName) return showToast("No playlist selected");

  fetch("/songs")
    .then((res) => res.json())
    .then((allSongs) => {
      fetch(`/api/playlists/${encodeURIComponent(playlistName)}/songs`)
        .then((res) => res.json())
        .then((playlistSongs) => {
          const playlistSet = new Set(
            playlistSongs.map((s) => s.replace(".mp3", ""))
          );
          const songsToAdd = allSongs
            .map((s) => s.replace(".mp3", "")) // strip .mp3
            .filter((s) => !playlistSet.has(s));
          if (songsToAdd.length === 0)
            return showToast("All songs already in playlist");

          // Clear and show the add-songs-container
          const container = document.getElementById("add-songs-container");
          container.innerHTML = "";
          container.style.display = "grid";

          const confirmActions = document.getElementById("confirm-actions");
          confirmActions.style.display = "block";

          songsToAdd.forEach((song) => {
            const songCard = document.createElement("div");
            songCard.classList.add("song-card");

            const label = document.createElement("label");
            label.classList.add("song-checkbox-label");
            // Checkbox
            const checkbox = document.createElement("input");
            checkbox.type = "checkbox";
            checkbox.value = song;
            checkbox.className = "song-checkbox";
            // Song name
            const title = document.createElement("div");
            title.className = "song-title";
            title.textContent = song.replace(".mp3", "");

            songCard.appendChild(checkbox);
            songCard.appendChild(title);
            container.appendChild(songCard);
          });

          // Confirm button
          document.getElementById("confirm-button").onclick = () => {
            const selectedSongs = Array.from(
              container.querySelectorAll("input:checked")
            ).map((cb) => cb.value);

            if (selectedSongs.length === 0) {
              showToast("No songs selected.");
              return;
            }

            Promise.all(
              selectedSongs.map((song) =>
                fetch(
                  `/api/playlists/${encodeURIComponent(playlistName)}/songs`,
                  {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ song }),
                  }
                )
              )
            )
              .then(() => {
                showToast(`${selectedSongs.length} song(s) added`);
                container.style.display = "none";
                confirmActions.style.display = "none";
                loadPlaylistSongs(playlistName);
              })
              .catch((err) => {
                console.error("Error adding songs", err);
                showToast("Error adding songs");
              });
          };

          // Cancel button
          document.getElementById("cancel-button").onclick = () => {
            container.style.display = "none";
            confirmActions.style.display = "none";
          };
        });
    });
});
document.getElementById("delete-song-button").addEventListener("click", () => {
  const playlistName = currentSongText.textContent
    .replace("Playlist: ", "")
    .trim();
  if (!playlistName) return showToast("No playlist selected");

  fetch(`/api/playlists/${encodeURIComponent(playlistName)}/songs`)
    .then((res) => res.json())
    .then((playlistSongs) => {
      if (!playlistSongs.length) return showToast("Playlist is empty.");

      // Clear and show the grid
      const container = document.getElementById("add-songs-container");
      container.innerHTML = "";
      container.style.display = "grid";

      const confirmActions = document.getElementById("confirm-actions");
      confirmActions.style.display = "block";

      playlistSongs.forEach((song) => {
        const songCard = document.createElement("div");
        songCard.classList.add("song-card");

        const label = document.createElement("label");
        label.classList.add("song-checkbox-label");

        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.value = song;

        const title = document.createElement("span");
        title.textContent = song.replace(".mp3", "");

        label.appendChild(checkbox);
        label.appendChild(title);
        songCard.appendChild(label);
        container.appendChild(songCard);
      });

      // Set confirm delete behavior
      document.getElementById("confirm-button").onclick = () => {
        const selectedSongs = Array.from(
          container.querySelectorAll("input:checked")
        ).map((cb) => cb.value);

        if (selectedSongs.length === 0) {
          showToast("No songs selected.");
          return;
        }

        Promise.all(
          selectedSongs.map((song) =>
            fetch(
              `/api/playlists/${encodeURIComponent(
                playlistName
              )}/songs/${encodeURIComponent(song)}`,
              {
                method: "DELETE",
              }
            )
          )
        )
          .then(() => {
            showToast(`${selectedSongs.length} song(s) removed`);
            container.style.display = "none";
            confirmActions.style.display = "none";
            loadPlaylistSongs(playlistName);
          })
          .catch((err) => {
            console.error("Error deleting songs", err);
            showToast("Error removing songs");
          });
      };

      // Cancel button hides grid and actions
      document.getElementById("cancel-button").onclick = () => {
        container.style.display = "none";
        confirmActions.style.display = "none";
      };
    });
});

// Combine DOMContentLoaded
window.addEventListener("DOMContentLoaded", () => {
  const savedVolume = localStorage.getItem("playerVolume");
  if (savedVolume !== null) {
    const volumeValue = parseFloat(savedVolume);
    audioPlayer.volume = volumeValue;
    volumeSlider.value = volumeValue;
  }
  // 👉 Keep home button in position but hidden initially
  const homeBtn = document.getElementById("home-button");
  homeBtn.style.visibility = "hidden";
  homeBtn.style.opacity = "0";
  homeBtn.style.transition = "opacity 0.3s ease";
  loadAllSongs(); // Initial load
});

// Save volume
volumeSlider.addEventListener("input", () => {
  const volume = parseFloat(volumeSlider.value);
  audioPlayer.volume = volume;
  localStorage.setItem("playerVolume", volume);
});
// ✅ Wire up create & delete playlist buttons
document
  .getElementById("create-playlist")
  .addEventListener("click", createPlaylist);
document
  .getElementById("delete-playlist")
  .addEventListener("click", deletePlaylist);

// Enter selection mode
function showAddSongsUI() {
  const songsInPlaylist = getPlaylistSongs(currentPlaylist);
  const availableSongs = allSongs.filter((song) => !playlist.includes(song));

  if (availableSongs.length === 0) {
    showToast("All songs are already in this playlist.");
    return;
  }

  const container = document.getElementById("add-songs-container");
  container.innerHTML = "";

  availableSongs.forEach((song) => {
    const div = document.createElement("div");
    div.className = "song-card checkbox-mode";
    div.innerHTML = `
      <input type="checkbox" class="song-checkbox" value="${song}">
      <span>${song.replace(".mp3", "")}</span>
    `;
    container.appendChild(div);
  });

  container.style.display = "grid";
  document.getElementById("confirm-actions").style.display = "block";
  document.getElementById("playlist-actions").style.display = "none";

  document.getElementById("confirm-button").onclick = () => {
    const checkboxes = container.querySelectorAll(".song-checkbox:checked");
    const selectedSongs = Array.from(checkboxes).map((cb) => cb.value);
    showToast("Songs added.");
    loadPlaylistSongs(playlistName);
    exitSelectionMode();
  };

  document.getElementById("cancel-button").onclick = exitSelectionMode;
}
function showDeleteSongsUI() {
  const songsInPlaylist = getPlaylistSongs(currentPlaylist);
  if (playlist.length === 0) {
    showToast("This playlist is already empty.");
    return;
  }

  const container = document.getElementById("add-songs-container");
  container.innerHTML = "";

  playlist.forEach((song) => {
    const div = document.createElement("div");
    div.className = "song-card checkbox-mode";
    div.innerHTML = `
      <input type="checkbox" class="song-checkbox" value="${song}">
      <span>${song.replace(".mp3", "")}</span>
    `;
    container.appendChild(div);
  });

  container.style.display = "grid";
  document.getElementById("confirm-actions").style.display = "block";
  document.getElementById("playlist-actions").style.display = "none";

  document.getElementById("confirm-button").onclick = () => {
    const checkboxes = container.querySelectorAll(".song-checkbox:checked");
    const selectedSongs = Array.from(checkboxes).map((cb) => cb.value);
    showToast("Songs deleted.");
    loadPlaylistSongs(currentPlaylist);
    exitSelectionMode();
  };

  document.getElementById("cancel-button").onclick = exitSelectionMode;
}

function exitSelectionMode() {
  document.getElementById("add-songs-container").style.display = "none";
  document.getElementById("confirm-actions").style.display = "none";
  document.getElementById("playlist-actions").style.display = "flex";
}
// Cancel selection
document.getElementById("cancel-button").addEventListener("click", () => {
  exitSelectionMode();
});

function getSelectedSongs(container) {
  const selected = [];
  const cards = container.querySelectorAll(".song-card");
  cards.forEach((card, index) => {
    const checkbox = card.querySelector(".song-checkbox");
    if (checkbox && checkbox.checked) {
      selected.push(card.dataset.filename); // assuming dataset is set
    }
  });
  return selected;
}

// Confirm selection
document
  .getElementById("confirm-button")
  .addEventListener("click", async () => {
    const selectedCheckboxes = document.querySelectorAll(
      ".song-checkbox:checked"
    );
    const selectedSongs = Array.from(selectedCheckboxes).map((cb) =>
      cb.parentElement.querySelector("p").textContent.trim()
    );

    const playlistName = currentPlaylist; // use your existing currentPlaylist variable
    if (!playlistName) return;
    for (let song of selectedSongs) {
      try {
        if (selectionMode === "add") {
          await fetch(`/api/playlists/${playlistName}/songs`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ song }),
          });
        } else if (selectionMode === "delete") {
          await fetch(`/api/playlists/${playlistName}songs`, {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ song }),
          });
        }
      } catch (err) {
        console.error(err);
        showToast("Error processing songs.");
      }
    }

    showToast(
      `Songs ${selectionMode === "add" ? "added to" : "deleted from"} playlist`
    );
    loadPlaylistSongs(playlistName); // reload playlist view
    exitSelectionMode();
  });

function exitSelectionMode() {
  const checkboxes = document.querySelectorAll(".song-checkbox");
  checkboxes.forEach((cb) => cb.remove());

  document.getElementById("confirm-actions").style.display = "none";
  document.getElementById("playlist-actions").style.display = "block";
  selectionMode = null;
}

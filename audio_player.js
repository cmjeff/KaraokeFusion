// Function to synchronize the players
function synchronizePlayers() {
  var player1 = document.getElementById("player-karoake");
  var player2 = document.getElementById("player2");
  const toggleDiv = document.getElementById("toggle");
  //toggle the Karaoke mode that mutes/plays player 2 audio
  toggleDiv.addEventListener("click", function () {
    toggleDiv.classList.toggle("active");
    if (player2.volume == 0) {
      player2.volume = 1;
    } else {
      player2.volume = 0;
    }
  });

  //sync player 1 and player 2 audio
  player1.addEventListener("play", function () {
    player2.play();
  });
  player1.addEventListener("pause", function () {
    player2.pause();
  });
  player1.addEventListener("timeupdate", function () {
    const timeDifferenceThreshold = 0.25;
    if (
      Math.abs(player2.currentTime - player1.currentTime) >
      timeDifferenceThreshold
    ) {
      player2.currentTime = player1.currentTime;
    }
  });
}

// extract query parameters from the URL
function getQueryParameter(name) {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(name);
}

// Sync lyric line to each time
function syncLyric(lyrics, time) {
  const scores = [];
  lyrics.forEach((lyric) => {
    // get the gap or distance or we call it score
    const score = time - lyric.time + 0.25;
    // only accept score with positive values
    if (score >= 0) scores.push(score);
  });
  if (scores.length == 0) return null;
  // get the smallest value from scores
  const closest = Math.min(...scores);
  // return the index of closest lyric
  return scores.indexOf(closest);
}

// convert the lrc string to lrc file text
function parseLyric(lrc) {
  const regex = /^\[(?<time>\d{2}:\d{2}(.\d{2})?)\](?<text>.*)/;
  // split lrc string to individual lines
  const lines = lrc.split("\n");
  const output = [];
  lines.forEach((line) => {
    const match = line.match(regex);
    // if doesn't match, return.
    if (match == null) return;
    const { time, text } = match.groups;
    output.push({
      time: parseTime(time),
      text: text.trim(),
    });
  });

  // parse formated time
  function parseTime(time) {
    const minsec = time.split(":");
    const min = parseInt(minsec[0]) * 60;
    const sec = parseFloat(minsec[1]);
    return min + sec;
  }
  return output;
}

// fetch the .lrc file contents
function fetchLrcFile(fileUrl) {
  return fetch(fileUrl)
    .then((response) => response.text())
    .catch((error) => {
      console.error("Error fetching .lrc file:", error);
      return null;
    });
}

// Call the function to fetch separated audio files when the page loads
window.onload = function () {
  const lrcFileUrl = getQueryParameter("lrc");

  fetchLrcFile(lrcFileUrl).then((lrcText) => {
    if (lrcText) {
      const lyrics = parseLyric(lrcText);
      var player1 = document.getElementById("player-karoake");
      var player2 = document.getElementById("player2");
      const songTitleElement = document.getElementById("song-title");
      //remove the output/
      var songName = getQueryParameter("vocal").substring(7);
      //remove the /vocal.mp3
      songName = songName.slice(0, -11);
      songTitleElement.textContent = songName;
      player1.src = getQueryParameter("instrumental");
      player2.src = getQueryParameter("vocal");
      synchronizePlayers();
      // Sync player 1 time to both lyrics and lyrics_next
      player1.ontimeupdate = () => {
        const time = player1.currentTime;
        const index = syncLyric(lyrics, time);
        if (index == null) return;
        var lyric = document.querySelector(".lyrics");
        var lyric_next = document.querySelector(".lyrics_next");
        if (lyric.innerHTML != lyrics[index].text) {
          lyric.classList.remove("highlighted");
          lyric.innerHTML = lyrics[index].text;
          if (index + 1 != lyrics.length) {
            lyric_next.innerHTML = lyrics[index + 1].text;
          } else {
            lyric_next.innerHTML = "";
          }
        } else {
          //Whenever new lyric line replaced, highlight the line
          lyric.classList.add("highlighted");
        }
      };
    }
  });
};

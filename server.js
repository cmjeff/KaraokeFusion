const express = require("express");
const multer = require("multer");
const path = require("path");
const { exec } = require("child_process");
const app = express();
const upload = multer({ dest: "uploads/" });
const fs = require("fs");

app.use(express.static(path.join(__dirname, "")));
var current_file;

// GET request handler for serving the index.html file
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// LRC file upload endpoint
app.post("/upload_lrc", upload.single("lrcUpload"), (req, res) => {
  const file = req.file;
  const tempFilePath = file.path;
  const targetFilePath = path.join(__dirname, "lrc", file.originalname);

  // Move the uploaded file to the target folder
  fs.rename(tempFilePath, targetFilePath, (err) => {
    if (err) {
      console.error("Error moving file:", err);
      return res.status(500).json({ error: "Failed to move the uploaded file" });
    }

    // Respond with a success message
    res.json({ message: "File uploaded successfully" });
  });
});

// MP3 file upload endpoint
app.post("/upload_Audio", upload.single("audio"), (req, res) => {
  const file = req.file;
  const tempFilePath = file.path;
  const targetFilePath = path.join(__dirname, "mp3", file.originalname);

  // Move the uploaded file to the target folder
  fs.rename(tempFilePath, targetFilePath, (err) => {
    if (err) {
      console.error("Error moving file:", err);
      return res.status(500).json({ error: "Failed to move the uploaded file" });
    }
    res.json({ message: "File uploaded successfully" });
  });
});

// Endpoint to retrieve .lrc file names
app.get('/lrc_files', (req, res) => {
  const lrcFolderPath = path.join(__dirname, 'lrc');
  // Read the contents of the lrc folder
  fs.readdir(lrcFolderPath, (err, files) => {
    if (err) {
      console.error('Error reading lrc folder:', err);
      return res.status(500).json({ error: 'Failed to read lrc folder' });
    }
    // Filter .lrc file names
    const lrcFiles = files.filter((file) => path.extname(file) === '.lrc');
    // Send the array of file names as a JSON response
    res.json({ lrcFiles });
  });
});

// Endpoint to retrieve .mp3 file names
app.get('/mp3_files', (req, res) => {
  const mp3FolderPath = path.join(__dirname, 'mp3');
  // Read the contents of the mp3 folder
  fs.readdir(mp3FolderPath, (err, files) => {
    if (err) {
      console.error('Error reading mp3 folder:', err);
      return res.status(500).json({ error: 'Failed to read mp3 folder' });
    }
    // Filter .mp3 file names
    const mp3Files = files.filter((file) => path.extname(file) === '.mp3');
    // Send the array of file names as a JSON response
    res.json({ mp3Files });
  });
});

// Post request handler for submiting the selected audio file to lrc_maker
app.post('/submit_Audio', upload.single("audio"), (req, res) => {
  // Get the selected MP3 file from the request body
  const selectedMP3File = req.body.selectedMP3File;

  // Continue with the rest of the logic
  const targetFilePath = path.join(__dirname, "mp3", selectedMP3File);
  const audioUrl = `/mp3/${encodeURIComponent(selectedMP3File)}`;

  res.json({ html: `/lrc_maker.html?audioUrl=${encodeURIComponent(audioUrl)}` });
  current_file = targetFilePath;
});

// POST request handler for separating vocals
app.post("/separate", upload.single("audio"), (req, res) => {
  console.log("Seperation started");
  const selectedLrcFile = req.body.selectedLrcFile;
  const audioFilePath = current_file;
  const audioFileName = path.basename(current_file);
  const audioFileId = path.parse(audioFileName).name;
  const outputPath = path.join(__dirname, "output");
  const existingFiles = fs.readdirSync(outputPath);
  // If already seperated before, return json of vocal and instrumental
  if (existingFiles.includes(audioFileId)) {
      return res.json({
        lrc: `lrc/${selectedLrcFile}`,
        vocal: `output/${audioFileId}/vocals.mp3`,
        instrumental: `output/${audioFileId}/accompaniment.mp3`,
      });
  }
  // the spleeter command to seperate audio file to two stems
  const command = `spleeter separate -o "${outputPath}" -p spleeter:2stems "${audioFilePath}"`;

  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.error("Vocal separation error:", error);
      res.status(500).send("An error occurred during vocal separation.");
    } else {
      console.log("Vocals separated");
      // Convert WAV files to MP3
      const vocalsWavPath = path.join(outputPath, audioFileId, "vocals.wav");
      const accompanimentWavPath = path.join(
        outputPath,
        audioFileId,
        "accompaniment.wav"
      );
      const vocalsMp3Path = path.join(outputPath, audioFileId, "vocals.mp3");
      const accompanimentMp3Path = path.join(
        outputPath,
        audioFileId,
        "accompaniment.mp3"
      );
      const convertCommand = `ffmpeg -i "${accompanimentWavPath}" -f mp3 "${accompanimentMp3Path}" && ffmpeg -i "${vocalsWavPath}" -f mp3 "${vocalsMp3Path}"`;

      exec(convertCommand, (convertError, convertStdout, convertStderr) => {
        if (convertError) {
          console.error("Audio conversion error:", convertError);
          res.status(500).send("An error occurred during audio conversion.");
        } else {
          // Delete the temporary files
          fs.unlink(vocalsWavPath, () => {});
          fs.unlink(accompanimentWavPath, () => {});
          res.json({
            lrc: `lrc/${selectedLrcFile}`,
            vocal: `output/${audioFileId}/vocals.mp3`,
            instrumental: `output/${audioFileId}/accompaniment.mp3`,
          });
        }
      });
    }
  });
});

// Favicon request handler
app.get("/favicon.ico", (req, res) => {
  res.status(204);
});

const port = 3000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

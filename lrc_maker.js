let draggableFileArea = document.querySelector(".drag-file-area");
let browseFileText = document.querySelector(".browse-files");
let uploadIcon = document.querySelector(".upload-icon");
let dragDropText = document.querySelector(".dynamic-message");
let fileInput = document.getElementById("lrcFile");
let cannotUploadMessage = document.querySelector(".cannot-upload-message");
let cancelAlertButton = document.querySelector(".cancel-alert-button");
let uploadedFile = document.querySelector(".file-block");
let fileName = document.querySelector(".file-name");
let fileSize = document.querySelector(".file-size");
let progressBar = document.querySelector(".progress-bar");
let removeFileButton = document.querySelector(".remove-file-icon");
let uploadButton = document.querySelector(".upload-button");
let fileFlag = 0;

// extract query parameters from the URL
function getQueryParameter(name) {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(name);
}

// Set the audio source
const audioPlayer = document.getElementById("player1");
audioPlayer.src = getQueryParameter("audioUrl");

//  redirect to audio-player.html with query parameters
function redirectToAudioPlayer(lrc, vocal, instrumental) {
  const queryParams = new URLSearchParams({
    lrc,
    vocal,
    instrumental,
  });

  window.location.href = `/audio_player.html?${queryParams}`;
}

// handle the seperate form 
function handleFormSubmit(event) {
  // display a loading button while seperating audio file
  document
    .getElementById("create-audio-lyrics-button")
    .classList.toggle("button--loading");
  event.preventDefault();
  const formData = new FormData(document.getElementById("lrc-form"));
  // Get the selected value from the dropdown menu
  const selectedLrcFile = document.getElementById("lrc-dropdown").value;
  // Add the selected value to the form data
  formData.append("selectedLrcFile", selectedLrcFile);
  fetch("/separate", {
    method: "POST",
    body: formData,
  })
    .then((response) => response.json())
    .then((data) => {
      // Extract the audio file URLs from the response
      const { lrc, vocal, instrumental } = data;
      // Redirect to audio-player.html with the audio file URLs
      redirectToAudioPlayer(lrc, vocal, instrumental);
    })
    .catch((error) => {
      console.error("Error:", error);
    });
}

// handle the lrc upload form
function handleUploadClick() {
  let isFileUploaded = fileInput.value;
  // check if file can be uploaded
  if (fileFlag == 0 && isFileUploaded != "") {
    fileFlag = 1;
    const form = document.getElementById("upload-form");
    const formData = new FormData(form);
    formData.append("lrcUpload", fileInput.files[0]);
    fetch("/upload_lrc", {
      method: "POST",
      body: formData,
    })
      .then((response) => response.json())
      .then((data) => {
        var width = 0;
        var id = setInterval(frame, 50);
        function frame() {
          if (width >= uploadedFile.offsetWidth - 40) {
            clearInterval(id);
            uploadButton.innerHTML = `<span class="material-icons-outlined upload-button-icon"> check_circle </span> Uploaded`;
          } else {
            width += 20;
            progressBar.style.width = width + "px";
          }
        }
        populateLRCDropdown();
      })
      .catch((error) => {
        window.alert("Failed to upload the file. Please try again later");
        fileFlag = 0;
      });
  } else {
    cannotUploadMessage.style.cssText =
      "display: flex; animation: fadeIn linear 1.5s;";
  }
}

// Function to populate the lyrics container with lines and buttons
function populateLyricsContainer() {
  // Popup window with the instructions on how to use lrc maker
  window.alert(`1. Start by playing the audio using the player above.

2. Listen to the lyrics carefully and locate the exact moment when each lyric line is about to begin.

3. As each lyric line is about to begin, click the "Track Time" button. This will capture the current time in the audio player.

4. Repeat step 3 for each lyric line in the song.

5. Once you have tracked the times for all the lyric lines, click the "Create LRC" button.`);

  const titleContainer = document.getElementById("title-container");
  titleContainer.style.display = "block";
  const createLRCContainer = document.getElementById(
    "create-lrc-button-container"
  );
  createLRCContainer.style.display = "block";
  const lyricsContainer = document.getElementById("lyrics-container");
  const textarea = document.getElementById("lyrics");
  // Clear existing content
  lyricsContainer.innerHTML = "";
  // Split textarea value into lines
  const lines = textarea.value.split("\n");
  // Create buttons and text nodes for each line
  lines.forEach((line) => {
    const lineContainer = document.createElement("div");
    lineContainer.classList.add("lyrics-line");
    const lineButton = document.createElement("button");
    lineButton.textContent = "Track Time";
    lineButton.addEventListener("click", (event) => {
      event.preventDefault();
      const currentTime = audioPlayer.currentTime;
      lineButton.textContent = currentTime.toFixed(2);
    });
    lineContainer.appendChild(lineButton);
    lineContainer.appendChild(document.createTextNode(line));
    lyricsContainer.appendChild(lineContainer);
  });
}

// populate the LRC dropdown with lrc files from the lrc folder
function populateLRCDropdown() {
  const dropdown = document.getElementById("lrc-dropdown");
  // Clear existing options
  dropdown.innerHTML = "";
  $(".sel--lrc-file").each(function () {
    // Remove any existing custom dropdown elements
    $(this).find(".sel__box").remove();
    $(this).find(".sel__placeholder").remove();
    $(this).find(".sel__box__options").remove();
    // Reset the display of the original select element
    $(this).children("select").css("display", "");
  });
  $(".sel--lrc-file").off("click");
  fetch("/lrc_files")
    .then((response) => response.json())
    .then((data) => {
      const option_default = document.createElement("option");
      option_default.value = ""; // Set the value attribute
      option_default.textContent = "Select from uploaded LRC files"; // Set the text content
      option_default.disabled = true; // Disable the option
      dropdown.appendChild(option_default);
      // Add options for each .lrc file name
      data.lrcFiles.forEach((file) => {
        const option = document.createElement("option");
        option.value = file;
        option.textContent = file;
        dropdown.appendChild(option);
      });
      setUpLRCDropDown();
    })
    .catch((error) => {
      console.error("Error:", error);
    });
}

// Set up custom LRC Dropdown
function setUpLRCDropDown() {
  $(".sel--lrc-file").each(function () {
    $(this).children("select").css("display", "none");
    var $current = $(this);
    $(this)
      .find("option")
      .each(function (i) {
        if (i == 0) {
          $current.prepend(
            $("<div>", {
              class: $current.attr("class").replace(/sel/g, "sel__box"),
            })
          );
          var placeholder = $(this).text();
          $current.prepend(
            $("<span>", {
              class: $current.attr("class").replace(/sel/g, "sel__placeholder"),
              text: placeholder,
              "data-placeholder": placeholder,
            })
          );
          return;
        }
        $current.children("div").append(
          $("<span>", {
            class: $current.attr("class").replace(/sel/g, "sel__box__options"),
            text: $(this).text(),
          })
        );
      });
  });
  // Toggling the `.active` state on the `.sel--lrc-file`.
  $(".sel--lrc-file").click(function () {
    $(this).toggleClass("active");
  });
  // Toggling the `.selected` state on the options.
  $(".sel--lrc-file .sel__box__options").click(function () {
    var txt = $(this).text();
    var index = $(this).index();
    $(this).siblings(".sel__box__options").removeClass("selected");
    $(this).addClass("selected");
    var $currentSel = $(this).closest(".sel--lrc-file");
    $currentSel.children(".sel__placeholder").text(txt);
    $currentSel.children("select").prop("selectedIndex", index + 1);
  });
}

//  handle the download button click event
function handleDownloadButtonClick() {
  const titleInput = document.getElementById("title");
  const title = titleInput.value.trim();
  if (title === "") {
    alert("Please enter a title before generating the LRC file.");
  } else {
    const lyricsListContainer = document.getElementById("lyrics-container");
    const lyricsList = lyricsListContainer.querySelectorAll(".lyrics-line");
    let lrcContent = ""; // Variable to store the LRC content
    // Loop through each lyric line
    lyricsList.forEach((lyricLine) => {
      const buttonContent = lyricLine.querySelector("button").textContent;
      const lineContent = lyricLine.textContent
        .substring(buttonContent.length)
        .trim();
      // Skip to the next line if buttonContent is "Track Time" or lineWithoutButton is an empty string
      if (buttonContent === "Track Time" || lineContent === "") {
        return;
      }
      const minutes = Math.floor(buttonContent / 60);
      const seconds = Math.floor(buttonContent % 60);
      const milliseconds = Math.floor((buttonContent % 1) * 100)
        .toString()
        .padStart(2, "0");
      const formattedTimestamp = `${minutes
        .toString()
        .padStart(2, "0")}:${seconds
        .toString()
        .padStart(2, "0")}:${milliseconds}`;
      lrcContent += `[${formattedTimestamp}]${lineContent}\n`;
    });
    // Create a Blob object with the LRC content
    const blob = new Blob([lrcContent], { type: "text/plain" });
    // Create a temporary download link
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${title}.lrc`;
    // trigger the download
    link.click();
  }
}

// Changes display when lrc file is uploaded
function handleFileInputChange(event) {
    const target = event.target;
    // check if the change is from lrcFile
    if (target && target.id === "lrcFile") {
      fileInput = target;
      // check if the file can be changed
      if (fileInput.files && fileInput.files.length > 0) {
        const file = fileInput.files[0];
        uploadIcon.innerHTML = "check_circle";
        dragDropText.innerHTML = "File Dropped Successfully!";
        document.querySelector(
          ".label"
        ).innerHTML = `<input type="file" id="lrcFile" name="lrcUpload" accept=".lrc" />
              <span class="browse-files-text">browse file</span>
              <span>from device</span>`;
        uploadButton.innerHTML = `Upload`;
        fileName.innerHTML = file.name;
        fileSize.innerHTML = (file.size / 1024).toFixed(1) + " KB";
        uploadedFile.style.cssText = "display: flex;";
        progressBar.style.width = 0;
        fileFlag = 0;
      }
    }
  }

// check if file is supported by browser
var isAdvancedUpload = (function () {
  var div = document.createElement("div");
  return (
    ("draggable" in div || ("ondragstart" in div && "ondrop" in div)) &&
    "FormData" in window &&
    "FileReader" in window
  );
})();

// hide the cannotUploadMessage
cancelAlertButton.addEventListener("click", () => {
  cannotUploadMessage.style.cssText = "display: none;";
});

// set up drag to upload feature
if (isAdvancedUpload) {
  [
    "drag",
    "dragstart",
    "dragend",
    "dragover",
    "dragenter",
    "dragleave",
    "drop",
  ].forEach((evt) =>
    draggableFileArea.addEventListener(evt, (e) => {
      e.preventDefault();
      e.stopPropagation();
    })
  );

  ["dragover", "dragenter"].forEach((evt) => {
    draggableFileArea.addEventListener(evt, (e) => {
      e.preventDefault();
      e.stopPropagation();
      uploadIcon.innerHTML = "file_download";
      dragDropText.innerHTML = "Drop your file here!";
    });
  });

  draggableFileArea.addEventListener("drop", (e) => {
    uploadIcon.innerHTML = "check_circle";
    dragDropText.innerHTML = "File Dropped Successfully!";
    document.querySelector(
      ".label"
    ).innerHTML = `<input type="file" id="lrcFile" name="lrcUpload" accept=".lrc" />
              <span class="browse-files-text">browse file</span>
              <span>from device</span>`;
    uploadButton.innerHTML = `Upload`;
    let files = e.dataTransfer.files;
    fileInput.files = files;
    fileName.innerHTML = files[0].name;
    fileSize.innerHTML = (files[0].size / 1024).toFixed(1) + " KB";
    uploadedFile.style.cssText = "display: flex;";
    progressBar.style.width = 0;
    fileFlag = 0;
  });
}

// add event listener to removeFileButton that resets display
removeFileButton.addEventListener("click", () => {
  uploadedFile.style.cssText = "display: none;";
  uploadIcon.innerHTML = "file_upload";
  dragDropText.innerHTML = "Drag & drop LRC file here";
  document.querySelector(
    ".label"
  ).innerHTML = `<input type="file" id="lrcFile" name="lrcUpload" accept=".lrc" />
              <span class="browse-files-text">browse file</span>
              <span>from device</span>`;
  uploadButton.innerHTML = `Upload`;
  fileInput.value = "";
});


// Add event listener to the download button click event
document
  .getElementById("create-lrc-button")
  .addEventListener("click", handleDownloadButtonClick);

// Add event listener to the form submit event
document
  .getElementById("create-audio-lyrics-button")
  .addEventListener("click", handleFormSubmit);

// Add event listener to the lyric LRC button click event
document
  .getElementById("lyrics-lrc-button")
  .addEventListener("click", populateLyricsContainer);

// Add event listener to the upload button click event
document
  .getElementById("upload-button")
  .addEventListener("click", handleUploadClick);

// Add event listener to the whenever file input is changed
document.addEventListener("change", handleFileInputChange);

// Populate the dropdown on window load
window.onload = populateLRCDropdown;

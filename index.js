let draggableFileArea = document.querySelector(".drag-file-area");
let browseFileText = document.querySelector(".browse-files");
let uploadIcon = document.querySelector(".upload-icon");
let dragDropText = document.querySelector(".dynamic-message");
let fileInput = document.getElementById("audioFile");
let cannotUploadMessage = document.querySelector(".cannot-upload-message");
let cancelAlertButton = document.querySelector(".cancel-alert-button");
let uploadedFile = document.querySelector(".file-block");
let fileName = document.querySelector(".file-name");
let fileSize = document.querySelector(".file-size");
let progressBar = document.querySelector(".progress-bar");
let removeFileButton = document.querySelector(".remove-file-icon");
let uploadButton = document.querySelector(".upload-button");
let fileFlag = 0;

// handles the form submission for an MP3 file
function handleMP3FormSubmit(event) {
  event.preventDefault();
  const formData = new FormData(document.getElementById("submit-form"));
  // Get the selected value from the dropdown menu
  const selectedMP3File = document.getElementById("mp3-dropdown").value;
  formData.append("selectedMP3File", selectedMP3File);
  fetch("/submit_Audio", {
    method: "POST",
    body: formData,
  })
    .then((response) => response.json())
    .then((data) => {
      window.location.href = data.html;
    })
    .catch((error) => {
      console.error("Error:", error);
    });
}

// handle the MP3 Upload form
function handleMP3FormUpload(event) {
  let isFileUploaded = fileInput.value;
  if (fileFlag == 0 && isFileUploaded != "") {
    fileFlag = 1;
    event.preventDefault();
    const form = document.getElementById("upload-form");
    const formData = new FormData(form);
    formData.append("audio", fileInput.files[0]);
    fetch("/upload_Audio", {
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
        populateMP3Dropdown();
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

// Populate the mp3 dropdown with mp3 from mp3 folder
function populateMP3Dropdown() {
  const dropdown = document.getElementById("mp3-dropdown");
  // Clear existing options
  dropdown.innerHTML = "";
  $(".sel--audio-file").each(function () {
    // Remove any existing custom dropdown elements
    $(this).find(".sel__box").remove();
    $(this).find(".sel__placeholder").remove();
    $(this).find(".sel__box__options").remove();
    // Reset the display of the original select element
    $(this).children("select").css("display", "");
  });
  $(".sel--audio-file").off("click");
  fetch("/mp3_files")
    .then((response) => response.json())
    .then((data) => {
      const option_default = document.createElement("option");
      option_default.value = ""; // Set the value attribute
      option_default.textContent = "Select from uploaded MP3 files"; // Set the text content
      option_default.disabled = true; // Disable the option
      dropdown.appendChild(option_default);
      // Add options for each .mp3 file name
      data.mp3Files.forEach((file) => {
        const option = document.createElement("option");
        option.value = file;
        option.textContent = file.slice(0, -4);
        dropdown.appendChild(option);
      });
      setUpAudioDropDown();
    })
    .catch((error) => {
      window.alert(
        "Failed to update MP3 dropdown menu. Please try again later"
      );
    });
}

//setup the custom mp3 dropdown
function setUpAudioDropDown() {
  // Reset the custom dropdown
  $(".sel--audio-file").each(function () {
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

  // Toggling the `.active` state on the `.sel--audio-file`.
  $(".sel--audio-file").click(function () {
    $(this).toggleClass("active");
  });
  // Toggling the `.selected` state on the options.
  $(".sel--audio-file .sel__box__options").click(function () {
    var txt = $(this).text();
    var index = $(this).index();
    $(this).siblings(".sel__box__options").removeClass("selected");
    $(this).addClass("selected");
    var $currentSel = $(this).closest(".sel--audio-file");
    $currentSel.children(".sel__placeholder").text(txt);
    $currentSel.children("select").prop("selectedIndex", index + 1);
  });
}

// Changes display when mp3 file is uploaded
function handleFileInputChange(event) {
  const target = event.target;
  // check if the change is from audioFile
  if (target && target.id === "audioFile") {
    fileInput = target;
    // check if the file can be changed
    if (fileInput.files && fileInput.files.length > 0) {
      const file = fileInput.files[0];
      uploadIcon.innerHTML = "check_circle";
      dragDropText.innerHTML = "File Dropped Successfully!";
      document.querySelector(
        ".label"
      ).innerHTML = `<input type="file" id="audioFile" name="audio" accept="audio/mpeg" />
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
    ).innerHTML = `<input type="file" id="audioFile" name="audio" accept="audio/mpeg" />
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
  dragDropText.innerHTML = "Drag & drop MP3 file here";
  document.querySelector(
    ".label"
  ).innerHTML = `<input type="file" id="audioFile" name="audio" accept="audio/mpeg" />
              <span class="browse-files-text">browse file</span>
              <span>from device</span>`;
  uploadButton.innerHTML = `Upload`;
  fileInput.value = "";
});

// Add event listener to the form submit event
document
  .getElementById("upload-button")
  .addEventListener("click", handleMP3FormUpload);

// Add event listener to the upload button click event
document
  .getElementById("submit-form")
  .addEventListener("submit", handleMP3FormSubmit);

// Add event listener to the whenever file input is changed
document.addEventListener("change", handleFileInputChange);

window.onload = populateMP3Dropdown;

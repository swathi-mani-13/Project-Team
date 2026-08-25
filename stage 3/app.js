const MODEL_URL =
  "https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights";

const MAX_STUDENTS = 70;
const MATCH_THRESHOLD = 80;
const DETECTION_INTERVAL = 300;

const video =
  document.getElementById("video");

const overlay =
  document.getElementById("overlay");

const startCameraButton =
  document.getElementById("startCamera");

const registerFaceButton =
  document.getElementById("registerFace");

const cameraState =
  document.getElementById("cameraState");

const modelState =
  document.getElementById("modelState");

const message =
  document.getElementById("message");

const videoHint =
  document.getElementById("videoHint");

const studentName =
  document.getElementById("studentName");

const studentId =
  document.getElementById("studentId");

const quality =
  document.getElementById("quality");

const registrationTime =
  document.getElementById("registrationTime");

const lastScan =
  document.getElementById("lastScan");

const result =
  document.getElementById("result");

const studentList =
  document.getElementById("studentList");

const registeredCount =
  document.getElementById("registeredCount");

const clearProfiles =
  document.getElementById("clearProfiles");


let modelsReady = false;
let cameraStream = null;
let monitoring = false;
let processing = false;
let lastDetection = 0;


function escapeHtml(text){

  const element =
    document.createElement("div");

  element.textContent = text;

  return element.innerHTML;
}


function formatTime(time){

  if(
    !time ||
    Number.isNaN(Date.parse(time))
  ){

    return "Time not recorded";
  }

  return new Date(time).toLocaleString(
    "en-IN",
    {
      timeZone:"Asia/Kolkata",
      dateStyle:"medium",
      timeStyle:"medium"
    }
  );
}


function getStudents(){

  return JSON.parse(
    localStorage.getItem(
      "ecampusStudents"
    ) || "[]"
  );
}


function saveStudents(students){

  localStorage.setItem(
    "ecampusStudents",
    JSON.stringify(students)
  );
}


function showMessage(
  text,
  color="#526779"
){

  message.textContent =
    text;

  message.style.color =
    color;
}


function showResult(html){

  result.innerHTML =
    html;
}


function renderStudents(){

  const students =
    getStudents();

  registeredCount.textContent =
    students.length;

  studentList.innerHTML =
    students.length

      ? students.map(
          student => `

        <div class="student">

          <strong>
            ${escapeHtml(
              student.name
            )}
          </strong>

          <span>
            Student ID:
            ${escapeHtml(
              student.id
            )}
          </span>

          <span>
            Registered:
            ${formatTime(
              student.registeredAt
            )}
          </span>

          <span style="color:#087466">
            ● Registered · Quality:
            ${student.quality}%
          </span>

        </div>

      `
        ).join("")

      : "<p>No students registered yet.</p>";
}


async function loadModels(){

  try{

    await faceapi.nets.tinyFaceDetector
      .loadFromUri(MODEL_URL);

    await faceapi.nets.faceLandmark68Net
      .loadFromUri(MODEL_URL);

    await faceapi.nets.faceRecognitionNet
      .loadFromUri(MODEL_URL);


    modelsReady =
      true;


    modelState.textContent =
      "AI models ready";

    modelState.style.color =
      "#087466";


    showMessage(
      "AI models ready. Click Start Camera.",
      "#087466"
    );

  }catch(error){

    console.error(error);

    modelState.textContent =
      "AI model error";

    modelState.style.color =
      "#c43b4a";

    showMessage(
      "AI model error: " +
      error.message,
      "#c43b4a"
    );
  }
}


async function startCamera(){

  try{

    if(!modelsReady){

      showMessage(
        "AI models are still loading. Please wait.",
        "#b87500"
      );

      return;
    }


    cameraStream =
      await navigator.mediaDevices
        .getUserMedia({

          video:{
            facingMode:"user",

            width:{
              ideal:960
            },

            height:{
              ideal:540
            }
          },

          audio:false

        });


    video.srcObject =
      cameraStream;

    await video.play();


    videoHint.style.display =
      "none";


    cameraState.textContent =
      "● Camera live";

    cameraState.style.color =
      "#087466";


    startCameraButton.textContent =
      "Camera Started";

    startCameraButton.disabled =
      true;


    registerFaceButton.disabled =
      false;


    monitoring =
      true;


    requestAnimationFrame(
      monitorFaces
    );


    showMessage(
      "Camera is live. Face recognition is active.",
      "#087466"
    );

  }catch(error){

    showMessage(
      "Camera error: " +
      error.message,
      "#c43b4a"
    );
  }
}


async function detectFaces(){

  return faceapi
    .detectAllFaces(
      video,

      new faceapi.TinyFaceDetectorOptions({
        inputSize:320,
        scoreThreshold:0.35
      })

    )
    .withFaceLandmarks()
    .withFaceDescriptors();
}


function confidence(distance){

  return Math.max(
    0,

    Math.min(
      100,

      Math.round(
        (100 - distance * 40) * 10
      ) / 10
    )
  );
}


function findBestMatch(
  descriptor,
  students
){

  let best =
    null;


  for(
    const student of students
  ){

    const distance =
      faceapi.euclideanDistance(
        descriptor,

        new Float32Array(
          student.descriptor
        )
      );


    if(
      !best ||
      distance < best.distance
    ){

      best = {
        student,
        distance
      };
    }
  }


  return best;
}


function drawBoxes(
  faces,
  labels
){

  overlay.width =
    video.videoWidth;

  overlay.height =
    video.videoHeight;


  const context =
    overlay.getContext("2d");


  context.clearRect(
    0,
    0,
    overlay.width,
    overlay.height
  );


  faces.forEach(
    (face,index) => {

      const box =
        face.detection.box;

      const label =
        labels[index];


      const mirroredX =
        overlay.width -
        box.x -
        box.width;


      const labelY =
        Math.max(
          25,
          box.y - 8
        );


      context.strokeStyle =
        label.color;

      context.lineWidth =
        3;


      context.strokeRect(
        mirroredX,
        box.y,
        box.width,
        box.height
      );


      context.font =
        "bold 16px Arial";

      context.fillStyle =
        label.color;


      const width =
        context.measureText(
          label.text
        ).width + 16;


      context.fillRect(
        mirroredX,
        labelY - 25,
        width,
        25
      );


      context.fillStyle =
        "#ffffff";


      context.fillText(
        label.text,
        mirroredX + 8,
        labelY - 7
      );

    }
  );
}


async function registerFace(){

  try{

    const name =
      studentName.value.trim();

    const id =
      studentId.value.trim();


    if(!name || !id){

      showMessage(
        "Enter both Student Name and Student ID.",
        "#c43b4a"
      );

      return;
    }


    const allStudents =
      getStudents();


    const exists =
      allStudents.find(
        student =>
          student.id === id
      );


    if(
      !exists &&
      allStudents.length >=
      MAX_STUDENTS
    ){

      showMessage(
        "Maximum limit reached. Only 70 students can be registered.",
        "#c43b4a"
      );

      return;
    }


    const faces =
      await detectFaces();


    if(faces.length !== 1){

      showMessage(

        faces.length === 0

          ? "No face detected. Look at the camera."

          : "Registration requires one face only.",

        "#c43b4a"
      );

      return;
    }


    const face =
      faces[0];


    const faceRatio =
      face.detection.box.width /
      video.videoWidth;


    const score =
      Math.min(
        98,

        Math.max(
          75,

          Math.round(
            faceRatio * 180 + 60
          )
        )
      );


    const registeredAt =
      new Date().toISOString();


    const students =
      allStudents.filter(
        student =>
          student.id !== id
      );


    students.push({

      name,

      id,

      quality:
        score,

      descriptor:
        Array.from(
          face.descriptor
        ),

      registeredAt

    });


    saveStudents(
      students
    );


    renderStudents();


    quality.textContent =
      score + "%";


    registrationTime.textContent =
      formatTime(
        registeredAt
      );


    showMessage(
      "Student face registered successfully.",
      "#087466"
    );

  }catch(error){

    showMessage(
      "Registration error: " +
      error.message,
      "#c43b4a"
    );
  }
}


async function monitorFaces(){

  if(!monitoring)
    return;


  requestAnimationFrame(
    monitorFaces
  );


  if(
    processing ||
    !modelsReady ||
    !cameraStream ||
    video.readyState < 3
  ){

    return;
  }


  if(
    performance.now() -
    lastDetection <
    DETECTION_INTERVAL
  ){

    return;
  }


  lastDetection =
    performance.now();

  processing =
    true;


  try{

    const time =
      new Date().toISOString();


    lastScan.textContent =
      formatTime(time);


    const faces =
      await detectFaces();


    const students =
      getStudents();


    if(faces.length === 0){

      drawBoxes(
        [],
        []
      );


      showResult(`

        <div class="result-icon">
          ◌
        </div>

        <h2>
          No face currently on screen
        </h2>

      `);

      return;
    }


    if(students.length === 0){

      drawBoxes(

        faces,

        faces.map(
          () => ({

            text:
              "Face Detected",

            color:
              "#1e5aa8"

          })
        )

      );


      showResult(`

        <div class="result-icon">
          ●
        </div>

        <h2>
          ${faces.length}
          Face(s) Detected
        </h2>

        <p>
          Register students one at a time.
        </p>

      `);

      return;
    }


    const labels = [];
    const cards = [];


    faces.forEach(
      face => {

        const best =
          findBestMatch(
            face.descriptor,
            students
          );


        const score =
          confidence(
            best.distance
          );


        if(
          score <
          MATCH_THRESHOLD
        ){

          labels.push({

            text:
              "Unknown Face",

            color:
              "#c43b4a"

          });


          cards.push(`

            <div
              style="
                margin:12px;
                color:#c43b4a
              "
            >

              🔴 Unknown Face

              <br>

              Confidence:
              ${score}%

              <br>

              Attendance will not be marked.

            </div>

          `);

          return;
        }


        labels.push({

          text:
            `${best.student.name} Recognized`,

          color:
            "#087466"

        });


        cards.push(`

          <div
            style="
              margin:12px;
              color:#087466
            "
          >

            🟢

            <strong>
              ${escapeHtml(
                best.student.name
              )}
            </strong>

            <br>

            Student ID:
            ${escapeHtml(
              best.student.id
            )}

            <br>

            Confidence:
            ${score}%

            <br>

            Face Recognition Successful.

          </div>

        `);

      }
    );


    drawBoxes(
      faces,
      labels
    );


    showResult(`

      <div class="result-icon">
        ●
      </div>

      <h2>
        ${faces.length}
        Face(s) Detected
      </h2>

      ${cards.join("")}

    `);

  }catch(error){

    console.error(
      "Monitoring error:",
      error
    );

  }finally{

    processing =
      false;
  }
}


clearProfiles.addEventListener(
  "click",
  () => {

    if(
      !confirm(
        "Remove all student profiles?"
      )
    ){

      return;
    }


    localStorage.removeItem(
      "ecampusStudents"
    );


    renderStudents();


    showMessage(
      "All local profiles removed."
    );

  }
);


startCameraButton.addEventListener(
  "click",
  startCamera
);


registerFaceButton.addEventListener(
  "click",
  registerFace
);


window.addEventListener(
  "beforeunload",
  () => {

    monitoring =
      false;


    cameraStream
      ?.getTracks()
      .forEach(
        track =>
          track.stop()
      );

  }
);


renderStudents();


window.addEventListener(
  "load",
  loadModels
);
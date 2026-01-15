// for converting the selected report option into integer (as per the database)
function report_type(){
    const select = document.getElementById("reportSelect").value;

    switch(select){
        case "DSWD Annual Report":
            return 1;
        case "Community Profile":
            return 2;
        case "Target Vs ACC & SE":
            return 3;
        case "Caseload Masterlist":
            return 4;
        case "Education Profile":
            return 5;
        case "Assistance to Families":
            return 6;
        case "Poverty Stoplight":
            return 7;
        case "CNF Candidates":
            return 8;
        case "Retirement Candidates":
            return 9;
        case "VM Accomplishments":
            return 10;
        case "Correspondence":
            return 11;
        case "Leaders Directory":
            return 12;
        default:
            return 0;
    }
}

// Sidebar navigation - Make dynamic
document.querySelectorAll('.nav-btn').forEach(btn => {
    // Highlight active category
    if (btn.dataset.category === '<%= currentCategory %>') {
        btn.classList.add('active');
    }
    // Navigate to category
    btn.addEventListener('click', () => {
        const category = btn.dataset.category;
        window.location.href = `/reports/${encodeURIComponent(category)}`;
    });
});

async function editProfile(){
    try {
        const response = await fetch('/home/editcreds', {
            method: "POST", 
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(loggedUser)
        });

        if (response.ok) {
            const html = await response.text();
            document.documentElement.innerHTML = html;
        } else {
            alert("Failed to load edit credentials page.");
        }
    } catch (err) {
        console.error("Error:", err);
        alert("Error loading edit credentials page.");
    }
}

async function cancel(){
        const currentValues = {
        firstname: document.getElementById("firstname").value,
        middlename: document.getElementById("middlename").value,
        lastname: document.getElementById("lastname").value,
        email: document.getElementById("email").value,
        password: document.getElementById("password").value,
        //spu: document.getElementById("spu").value
    };

    const originalData = loggedUser[0];

    console.log(originalData);

    const hasChanges = Object.keys(originalData).
                    some(key => originalData[key] !== currentValues[key]);

    if (hasChanges) {
        const confirmCancel = confirm("You have unsaved changes. Are you sure you want to cancel?");
        if (!confirmCancel) return;
    }
        window.location.href = "/home";
}

async function submitForm(){
    console.log(loggedUser[0]);
    const sdw_id = loggedUser.sdw_id;
    const updatedData = {
        firstname: document.getElementById("firstname").value.trim(),
        middlename: document.getElementById("middlename").value.trim(),
        lastname: document.getElementById("lastname").value.trim(),
        email: document.getElementById("email").value.trim(),
        password: document.getElementById("password").value
    }



    if(!updatedData.firstname || !updatedData.lastname || !updatedData.email){
        alert("Please fill in all required fields.");
        return;
    }

    const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailPattern.test(updatedData.email)) {
        alert("Please enter a valid Gmail address.");
        return;
    }

    // Password regex for password validation
    const passwordPattern = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;
    if (updatedData.password && !passwordPattern.test(updatedData.password)) {
        alert("Password must be at least 8 characters long and include at least one uppercase letter, one number, and one special character.");
        return;
    }
    fetch(`/home/editinfo/${loggedUser[0].staff_info_id}`, {
        method: "POST", 
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(updatedData)
    })
    .then((response) => response.json())
    .then(data => {
        if (data.success) {
            alert("Account details updated successfully.");
            //originalData = { ...updatedData };
            // location.reload();
            window.location.href = "/admin";
        } else {
            alert("Error updating admin details: " + data.message);
        }
    })
    .catch(error => {
        alert('Error updating sdw details: ' + error.message);
    });

}

document.addEventListener("DOMContentLoaded", ()=>{
    const uploadArea = document.getElementById("uploadArea");

    const uploadModal = document.getElementById("uploadModal");
    const fileTypeModal = document.getElementById("fileTypeModal");
    const successModal = document.getElementById("successModal");

    const fileName = document.getElementById("fileName");
    const fileSize = document.getElementById("fileSize");

    const successFileName = document.getElementById("successFileName");
    const successReport = document.getElementById("successReport");

    const cancelBtn = document.getElementById("cancelBtn");
    const correctBtn = document.getElementById("correctBtn");
    const continueBtn = document.getElementById("continueBtn");
    const uploadAnotherBtn = document.getElementById("uploadAnotherBtn");
    const fileTypeBtn = document.getElementById("fileTypeBtn");

    const fileInput = document.getElementById("fileInput");

    let currentFile = null; //so all listeners see the file

    // to allow file drop
    uploadArea.addEventListener("dragover", (event)=>{
        event.preventDefault();
    });

    // if continue button is clicked, just remove the success modal
    continueBtn.addEventListener("click", (event) => {
        event.preventDefault();
        successModal.classList.remove("show");
    });

    // if cancel button is clicked, remove the upload modal
    cancelBtn.addEventListener("click", () => {
        uploadModal.classList.remove("show");
        currentFile = null; // reset the file
    });

    // if file added is confirmed for upload (correct button clicked)
    //only then perform adding it to the db
    correctBtn.addEventListener("click", async () => {
    if(currentFile == null){
        alert("Please select a file to upload.");
        return;
    }

    // remove the upload modal from display
    uploadModal.classList.remove("show");
    
    // prepare the data to be fetched over the /upload route
    const formData = new FormData();
    formData.append("file", currentFile);
    formData.append("report_name", currentFile.name);
    formData.append("file_size", currentFile.size);
    formData.append("sdw_id", loggedUser.sdw_id);
    formData.append("type", report_type());

    // Show loading state if needed
    correctBtn.disabled = true;
    correctBtn.textContent = "Uploading...";

    try {
        const response = await fetch("/upload", {
            method: "POST",
            body: formData
        });

        const result = await response.json();
        
        if(result.success){
            // Use the final filename from server if available
            successFileName.textContent = result.finalFileName || currentFile.name;
            successReport.textContent = document.getElementById("reportSelect").value;

            successModal.classList.add("show");
            currentFile = null;
        } else {
            alert("Upload failed: " + (result.message || "Unknown error"));
        }
    } catch(err) {
        console.error("Upload failed:", err);
        alert("Upload failed due to network error.");
    } finally {
        // Reset button state
        correctBtn.disabled = false;
        correctBtn.textContent = "Yes, it's correct";
    }
});

    // fileTypeBtn.addEventListener("click", () =>{
    //     fileTypeModal.classList.remove("show");
    //     currentFile = document.getElementById("fileInputByClick").files[0];
    //     fileName.textContent = currentFile.name;
    //     fileSize.textContent = currentFile.size / 1000 + " KB";
    //     fileTypeModal.classList.remove("show");
    //     uploadModal.classList.add("show");
    //     console.log(currentFile.type);
    // });

    // if the user wants to upload another file
    //  currently only considers the recent file inputted
    //  since listeners are only for drag/drop events
    uploadAnotherBtn.addEventListener("click", () => {
        fileInput.value = "";
        successModal.classList.remove("show"); // remove the success modal so when file selection is cancelled, we just go back to the page
        fileInput.click();
    });

    // for when the upload is clicked instead of dragged a file
    uploadArea.addEventListener("click", () => {
        fileInput.value = "";
        fileInput.click();
    });

    // when user selects a file
    fileInput.addEventListener("change", (event) => {
        const file = event.target.files[0];//get the first file user selected

        if(!file){ //user cancelled
            return;
        }

        // Valid file type
        const validTypes = [
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // .xlsx
            "application/vnd.ms-excel" // .xls
        ]

        // Test if file type is valid
        if(!validTypes.includes(file.type)){
            alert("Users can only upload excel files (.xlsx, .xls).");
            fileInput.value = "";
            return;
        }

        currentFile = file;
        fileName.textContent = file.name;
        fileSize.textContent = (currentFile.size / 1000).toFixed(0) + " KB";

        uploadModal.classList.add("show");
    });

    // if the user drops a file to the upload box
    uploadArea.addEventListener("drop", (event) => {
        event.preventDefault();

        const file = event.dataTransfer.files[0];

        if(file == null){
            return;
        }

        // Valid file type
        const validTypes = [
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // .xlsx
            "application/vnd.ms-excel" // .xls
        ]

        // Test if file type is valid
        if(!validTypes.includes(file.type)){
            alert("Users can only upload excel files (.xlsx, .xls).");
            return;
        }

        //set the file
        currentFile = file;
        
        fileName.textContent = file.name;
        fileSize.textContent = (currentFile.size / 1000).toFixed(0) + " KB";

        uploadModal.classList.add("show");
    });
});
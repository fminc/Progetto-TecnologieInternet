const playButton = document.getElementById("playButton");
const backgroundMusic = document.getElementById("backgroundMusic");
const container = document.querySelector(".container");
const formContainer = document.getElementById("formContainer");
const loginButton = document.getElementById("loginButton");
const subscribeButton = document.getElementById("subscribeButton");



playButton.addEventListener("click", () => {
    playButton.style.display = "none";

    formContainer.style.display = "block";
});
  
loginButton.addEventListener("click", async (event) => {
    event.preventDefault();
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;
    localStorage.setItem("username", username);   
   
    try {
        const response = await fetch("/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ username, password }),
        });
  
        if (response.ok) {
            const data = await response.json();
            alert(data.message);
            window.location.href = "/middle.html";
        } else {
            const data = await response.json();
            alert(data.message);
        }
    } catch (error) {
        console.error("Error during login:", error);
        alert("An error occurred during login. Please try again later.");
    }
});
  
subscribeButton.addEventListener("click", async (event) => {
    event.preventDefault();

    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;
    try {
      const response = await fetch("/subscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });
  
      if (response.ok) {
        alert("Subscription successful!");
      } else {
        const data = await response.json();
        alert(data.message);
      }
    } catch (error) {
      console.error("Error during subscription:", error);
      alert("An error occurred during subscription. Please try again later.");
    }
});





console.log(localStorage);


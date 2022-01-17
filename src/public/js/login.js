import {formatData} from "./formatData.js";

document.querySelector("#loginForm").addEventListener("submit", (event) => {
    event.preventDefault();
    const emailInput = document.querySelector("#email").value;
    const passwordInput = document.querySelector("#password").value;
    const formattedData = formatData({emailInput, passwordInput});
    const xhr = new XMLHttpRequest();
    xhr.onload = function() {
        if (this.readyState == XMLHttpRequest.DONE && this.status == 200) {
            console.log(JSON.parse(this.responseText));
            window.location.replace("/profile");
        } else {
            document.querySelector("#errorMessage").textContent = "Invalid login"
        }
    }
    xhr.open("POST", "/login");
    xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
    xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
    xhr.send(formattedData);
})
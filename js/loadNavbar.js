document.addEventListener("DOMContentLoaded", function () {
    const navbarContainer = document.getElementById("navbar");
    fetch("core/navbar.html")
        .then(response => response.text())
        .then(data => {
            navbarContainer.innerHTML = data;
        })
        .catch(error => console.error('Navbar Loading ERROR:', error));
});

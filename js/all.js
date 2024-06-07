document.addEventListener('DOMContentLoaded', function () {
    fetch('images.json')
        .then(response => response.json())
        .then(images => {
            const gallery = document.getElementById('gallery');
            displayImages(images);


            window.images = images;
        })
        .catch(error => console.error('Error loading images:', error));
});

function displayImages(images) {
    const gallery = document.getElementById('gallery');
    gallery.innerHTML = '';
    images.forEach(image => {
        const imageCard = document.createElement('div');
        imageCard.className = 'quicklinkCard';
        imageCard.innerHTML = `
            <a href="#" onclick="openModal('${image.url}', '${image.title}')">
                <img src="${image.url}" alt="${image.title}" loading="lazy">
                <div class="info">
                    <strong>${image.title}</strong>
                    <span>${image.description}</span>
                </div>
            </a>
        `;
        gallery.appendChild(imageCard);
    });
}

function filterGallery(category) {
    const filteredImages = category === 'all' ? window.images : window.images.filter(image => image.category === category);
    displayImages(filteredImages);
}

function openModal(url, title) {
    const modal = document.getElementById('modal');
    const modalImg = document.getElementById('modal-image');
    const captionText = document.getElementById('caption');

    modal.style.display = 'block';
    modalImg.src = url;
    captionText.innerHTML = title;
}

function closeModal() {
    const modal = document.getElementById('modal');
    modal.style.display = 'none';
}

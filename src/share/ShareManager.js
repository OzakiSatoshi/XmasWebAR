export class ShareManager {
  constructor() {
    this.shareMenu = document.querySelector('.share-menu');
    this.setupShareButtons();
  }

  setupShareButtons() {
    const buttons = document.querySelectorAll('.share-button');
    buttons.forEach(button => {
      button.addEventListener('click', (e) => {
        const platform = button.dataset.platform;
        if (this.currentImageData) {
          this.shareImage(platform, this.currentImageData);
        }
      });
    });
  }

  showShareMenu(imageData) {
    this.currentImageData = imageData;
    this.shareMenu.classList.add('visible');
  }

  async shareImage(platform, imageData) {
    switch (platform) {
      case 'share':
        this.shareToSocial(imageData);
        break;
      case 'download':
        this.downloadImage(imageData);
        break;
    }
    this.shareMenu.classList.remove('visible');
  }

  async shareToSocial(imageData) {
    try {
      const response = await fetch(imageData);
      const blob = await response.blob();
      const file = new File([blob], 'jiet-xmas-2024.png', { type: 'image/png' });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: 'JIET X\'mas party 2024',
          text: 'JIET X\'mas party 2024 #JIET #Xmas',
          files: [file]
        });
      } else {
        this.downloadImage(imageData);
      }
    } catch (error) {
      console.error('Error sharing:', error);
      this.downloadImage(imageData);
    }
  }

  downloadImage(imageData) {
    const link = document.createElement('a');
    link.href = imageData;
    link.download = 'jiet-xmas-2024.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
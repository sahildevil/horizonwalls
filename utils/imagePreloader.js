// Simple native image preloader
export class ImagePreloader {
  static preloadedImages = new Set();
  
  static preloadImage = (url) => {
    return new Promise((resolve, reject) => {
      if (ImagePreloader.preloadedImages.has(url)) {
        resolve(url);
        return;
      }

      const image = new Image();
      
      image.onload = () => {
        ImagePreloader.preloadedImages.add(url);
        resolve(url);
      };
      
      image.onerror = (error) => {
        console.warn('Failed to preload image:', url);
        reject(error);
      };
      
      image.src = url;
    });
  };

  static preloadImages = async (imageUrls, batchSize = 3) => {
    const batches = [];
    
    // Split URLs into batches to avoid overwhelming the network
    for (let i = 0; i < imageUrls.length; i += batchSize) {
      batches.push(imageUrls.slice(i, i + batchSize));
    }

    // Process batches sequentially
    for (const batch of batches) {
      try {
        await Promise.all(
          batch.map(url => ImagePreloader.preloadImage(url))
        );
      } catch (error) {
        console.warn('Batch preload failed:', error);
      }
    }
  };

  static preloadWallpapers = (wallpapers) => {
    const imageUrls = wallpapers
      .filter(wallpaper => wallpaper?.imageUrl)
      .map(wallpaper => wallpaper.imageUrl);
    
    if (imageUrls.length > 0) {
      console.log(`Preloading ${imageUrls.length} wallpaper images`);
      return ImagePreloader.preloadImages(imageUrls);
    }
  };

  static clearPreloadCache = () => {
    ImagePreloader.preloadedImages.clear();
  };
}
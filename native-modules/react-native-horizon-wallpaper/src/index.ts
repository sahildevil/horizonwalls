import { NativeModules, Platform } from 'react-native';

const { HorizonWallpaper } = NativeModules;

export interface WallpaperOptions {
  uri: string;
  screen?: 'home' | 'lock' | 'both';
}

export interface HorizonWallpaperInterface {
  setWallpaper(options: WallpaperOptions): Promise<string>;
  setWallpaperFromUri(uri: string, screen?: string): Promise<string>;
}

const HorizonWallpaperModule: HorizonWallpaperInterface = {
  setWallpaper: (options: WallpaperOptions): Promise<string> => {
    if (!HorizonWallpaper) {
      return Promise.reject(new Error('HorizonWallpaper module not available'));
    }
    
    return HorizonWallpaper.setWallpaper({
      uri: options.uri,
      screen: options.screen || 'both'
    });
  },

  setWallpaperFromUri: (uri: string, screen: string = 'both'): Promise<string> => {
    if (!HorizonWallpaper) {
      return Promise.reject(new Error('HorizonWallpaper module not available'));
    }
    
    return HorizonWallpaper.setWallpaperFromUri(uri, screen);
  }
};

export default HorizonWallpaperModule;
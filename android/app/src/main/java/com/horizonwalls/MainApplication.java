
// Add this import
import com.horizonwallpaper.HorizonWallpaperPackage;

// In the getPackages() method, add:
@Override
protected List<ReactPackage> getReactPackages() {
  @SuppressWarnings("UnnecessaryLocalVariable")
  List<ReactPackage> packages = new PackageList(this).getPackages();
  // Add your custom package here
  packages.add(new HorizonWallpaperPackage());
  return packages;
}
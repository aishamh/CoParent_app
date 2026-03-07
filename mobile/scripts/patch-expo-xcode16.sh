#!/bin/bash
# Patch Expo SDK 55 for Xcode 16.4 compatibility
# Run after npm install / pod install. Safe to re-run (idempotent).
#
# Problems fixed:
# 1. ExpoModulesCore uses @MainActor on protocol conformance (Xcode 26+ compiler only)
# 2. expo-router uses iOS 26 SDK APIs (UIBarButtonItem.Badge, .prominent, etc.)
# 3. expo-image-picker uses iOS 26 SDK APIs (PHAsset.contentType)
# 4. expo-image uses iOS 26 SDK APIs (SymbolEffect .drawOn/.drawOff)

set -e
cd "$(dirname "$0")/.."

EXPO_CORE="node_modules/expo-modules-core/ios"
EXPO_ROUTER="node_modules/expo-router/ios"
EXPO_PICKER="node_modules/expo-image-picker/ios"
EXPO_IMAGE="node_modules/expo-image/ios"

echo "Patching Expo SDK 55 for Xcode 16.4 compatibility..."

# --- 1. ExpoModulesCore: Remove @MainActor on conformance ---
sed -i '' 's/: ExpoView, @MainActor AnyExpoSwiftUIHostingView/: ExpoView, AnyExpoSwiftUIHostingView/' \
  "$EXPO_CORE/Core/Views/SwiftUI/SwiftUIHostingView.swift"
sed -i '' 's/extension UIView: @MainActor AnyArgument/extension UIView: AnyArgument/' \
  "$EXPO_CORE/Core/Views/ViewDefinition.swift"
echo "  ✓ ExpoModulesCore patched"

# --- 2. expo-router: Guard iOS 26 APIs behind #if compiler(>=6.2) ---
python3 -c "
p='$EXPO_ROUTER/Toolbar/RouterToolbarHostView.swift'
t=open(p).read()
old='''            if #available(iOS 26.0, *) {
              if let hidesSharedBackground = menu.hidesSharedBackground {
                item.hidesSharedBackground = hidesSharedBackground
              }
              if let sharesBackground = menu.sharesBackground {
                item.sharesBackground = sharesBackground
              }
            }'''
new='''            #if compiler(>=6.2)
            if #available(iOS 26.0, *) {
              if let hidesSharedBackground = menu.hidesSharedBackground {
                item.hidesSharedBackground = hidesSharedBackground
              }
              if let sharesBackground = menu.sharesBackground {
                item.sharesBackground = sharesBackground
              }
            }
            #endif'''
if old in t: open(p,'w').write(t.replace(old,new))
"

python3 -c "
p='$EXPO_ROUTER/Toolbar/RouterToolbarItemView.swift'
t=open(p).read()
t=t.replace(
    '      item = controller.navigationItem.searchBarPlacementBarButtonItem',
    '''      #if compiler(>=6.2)
      item = controller.navigationItem.searchBarPlacementBarButtonItem
      #else
      item = UIBarButtonItem()
      #endif''')
old1='''    if #available(iOS 26.0, *) {
      item.hidesSharedBackground = hidesSharedBackground
      item.sharesBackground = sharesBackground
    }'''
new1='''    #if compiler(>=6.2)
    if #available(iOS 26.0, *) {
      item.hidesSharedBackground = hidesSharedBackground
      item.sharesBackground = sharesBackground
    }
    #endif'''
t=t.replace(old1,new1)
old2='    if #available(iOS 26.0, *) {\n      if let badgeConfig = badgeConfiguration {'
new2='    #if compiler(>=6.2)\n    if #available(iOS 26.0, *) {\n      if let badgeConfig = badgeConfiguration {'
t=t.replace(old2,new2)
old3='''      } else {
        item.badge = nil
      }
    }'''
new3='''      } else {
        item.badge = nil
      }
    }
    #endif'''
t=t.replace(old3,new3)
open(p,'w').write(t)
"

python3 -c "
p='$EXPO_ROUTER/Toolbar/RouterToolbarModule.swift'
t=open(p).read()
old='''    case .prominent:
      if #available(iOS 26.0, *) {
        return .prominent
      } else {
        return .done
      }'''
new='''    case .prominent:
      #if compiler(>=6.2)
      if #available(iOS 26.0, *) {
        return .prominent
      } else {
        return .done
      }
      #else
      return .done
      #endif'''
if old in t: open(p,'w').write(t.replace(old,new))
"
echo "  ✓ expo-router patched"

# --- 3. expo-image-picker: Guard iOS 26 PHAsset.contentType ---
python3 -c "
p='$EXPO_PICKER/MediaHandler.swift'
t=open(p).read()
t=t.replace(
    '''  private func getMimeType(from asset: PHAsset?, fileExtension: String) -> String? {
    let utType: UTType? = if #available(iOS 26.0, *) {
      asset?.contentType ?? UTType(filenameExtension: fileExtension)
    } else {
      UTType(filenameExtension: fileExtension)
    }
    return utType?.preferredMIMEType
  }''',
    '''  private func getMimeType(from asset: PHAsset?, fileExtension: String) -> String? {
    #if compiler(>=6.2)
    let utType: UTType? = if #available(iOS 26.0, *) {
      asset?.contentType ?? UTType(filenameExtension: fileExtension)
    } else {
      UTType(filenameExtension: fileExtension)
    }
    #else
    let utType: UTType? = UTType(filenameExtension: fileExtension)
    #endif
    return utType?.preferredMIMEType
  }''')
t=t.replace(
    '''  private func getMimeType(from resource: PHAssetResource, fileExtension: String) -> String? {
    let utType: UTType? = if #available(iOS 26.0, *) {
      resource.contentType
    } else {
      UTType(resource.uniformTypeIdentifier) ?? UTType(filenameExtension: fileExtension)
    }
    return utType?.preferredMIMEType
  }''',
    '''  private func getMimeType(from resource: PHAssetResource, fileExtension: String) -> String? {
    #if compiler(>=6.2)
    let utType: UTType? = if #available(iOS 26.0, *) {
      resource.contentType
    } else {
      UTType(resource.uniformTypeIdentifier) ?? UTType(filenameExtension: fileExtension)
    }
    #else
    let utType: UTType? = UTType(resource.uniformTypeIdentifier) ?? UTType(filenameExtension: fileExtension)
    #endif
    return utType?.preferredMIMEType
  }''')
open(p,'w').write(t)
"
echo "  ✓ expo-image-picker patched"

# --- 4. expo-image: Guard iOS 26 SymbolEffect .drawOn/.drawOff ---
python3 -c "
p='$EXPO_IMAGE/ImageView.swift'
t=open(p).read()
t=t.replace(
    '''    default:
      if #available(iOS 26.0, tvOS 26.0, *) {
        applySymbolEffectiOS26(effect: effect, scope: scope, options: options)
      }
    }
  }

  @available(iOS 26.0, tvOS 26.0, *)
  private func applySymbolEffectiOS26(effect: SFSymbolEffectType, scope: SFSymbolEffectScope?, options: SymbolEffectOptions) {
    switch effect {
    case .drawOn:
      switch scope {
      case .byLayer: sdImageView.addSymbolEffect(.drawOn.byLayer, options: options)
      case .wholeSymbol: sdImageView.addSymbolEffect(.drawOn.wholeSymbol, options: options)
      case .none: sdImageView.addSymbolEffect(.drawOn, options: options)
      }
    case .drawOff:
      switch scope {
      case .byLayer: sdImageView.addSymbolEffect(.drawOff.byLayer, options: options)
      case .wholeSymbol: sdImageView.addSymbolEffect(.drawOff.wholeSymbol, options: options)
      case .none: sdImageView.addSymbolEffect(.drawOff, options: options)
      }
    default:
      break
    }
  }''',
    '''    default:
      #if compiler(>=6.2)
      if #available(iOS 26.0, tvOS 26.0, *) {
        applySymbolEffectiOS26(effect: effect, scope: scope, options: options)
      }
      #endif
      break
    }
  }

  #if compiler(>=6.2)
  @available(iOS 26.0, tvOS 26.0, *)
  private func applySymbolEffectiOS26(effect: SFSymbolEffectType, scope: SFSymbolEffectScope?, options: SymbolEffectOptions) {
    switch effect {
    case .drawOn:
      switch scope {
      case .byLayer: sdImageView.addSymbolEffect(.drawOn.byLayer, options: options)
      case .wholeSymbol: sdImageView.addSymbolEffect(.drawOn.wholeSymbol, options: options)
      case .none: sdImageView.addSymbolEffect(.drawOn, options: options)
      }
    case .drawOff:
      switch scope {
      case .byLayer: sdImageView.addSymbolEffect(.drawOff.byLayer, options: options)
      case .wholeSymbol: sdImageView.addSymbolEffect(.drawOff.wholeSymbol, options: options)
      case .none: sdImageView.addSymbolEffect(.drawOff, options: options)
      }
    default:
      break
    }
  }
  #endif''')
open(p,'w').write(t)
"
echo "  ✓ expo-image patched"

echo ""
echo "Done. All patches applied for Xcode 16.4."
echo "Note: These patches are needed because Expo SDK 55 targets Xcode 26+."
echo "Once you upgrade to Xcode 26, these patches are no longer necessary."

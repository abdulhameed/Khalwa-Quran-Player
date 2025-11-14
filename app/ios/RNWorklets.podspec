Pod::Spec.new do |s|
  package = JSON.parse(File.read(File.join(__dir__, "../node_modules/react-native-worklets-core/package.json")))

  s.name         = "RNWorklets"
  s.version      = package["version"]
  s.summary      = "Alias for react-native-worklets-core to satisfy RNReanimated dependency"
  s.homepage     = package["homepage"]
  s.license      = package["license"]
  s.authors      = package["author"]

  s.platforms    = { :ios => "13.4" }
  s.source       = { :git => "https://github.com/margelo/react-native-worklets-core.git", :tag => "v#{s.version}" }

  s.source_files = "../node_modules/react-native-worklets-core/ios/**/*.{h,m,mm}", "../node_modules/react-native-worklets-core/cpp/**/*.{h,cpp}"
  s.public_header_files = "../node_modules/react-native-worklets-core/ios/**/*.h", "../node_modules/react-native-worklets-core/cpp/**/*.h"

  s.pod_target_xcconfig = {
    "DEFINES_MODULE" => "YES"
  }

  s.dependency "React-Core"
  s.dependency "React-jsi"
end

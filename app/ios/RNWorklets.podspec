Pod::Spec.new do |s|
  package = JSON.parse(File.read(File.join(__dir__, "../node_modules/react-native-worklets-core/package.json")))

  s.name         = "RNWorklets"
  s.version      = package["version"]
  s.summary      = "Alias for react-native-worklets-core"
  s.homepage     = package["homepage"]
  s.license      = package["license"]
  s.authors      = package["author"]

  s.platforms    = { :ios => "13.4" }
  s.source       = { :git => "https://github.com/margelo/react-native-worklets-core.git", :tag => "v#{s.version}" }

  s.source_files = [
    "../node_modules/react-native-worklets-core/apple/**/*.{h,m,mm}",
    "../node_modules/react-native-worklets-core/cpp/**/*.{h,cpp}"
  ]

  s.public_header_files = [
    "../node_modules/react-native-worklets-core/apple/**/*.h",
    "../node_modules/react-native-worklets-core/cpp/**/*.h"
  ]

  s.header_mappings_dir = "../node_modules/react-native-worklets-core/cpp"

  s.pod_target_xcconfig = {
    "DEFINES_MODULE" => "YES",
    "HEADER_SEARCH_PATHS" => [
      "\"$(PODS_TARGET_SRCROOT)/../node_modules/react-native-worklets-core/cpp\"",
      "\"$(PODS_ROOT)/Headers/Public/RNWorklets\""
    ].join(' ')
  }

  s.dependency "React-Core"
  s.dependency "React-jsi"
  s.dependency "React-callinvoker"
end

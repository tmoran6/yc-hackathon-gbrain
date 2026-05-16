// swift-tools-version:5.9
import PackageDescription

let package = Package(
    name: "screen-recorder",
    platforms: [.macOS(.v14)],
    targets: [
        .executableTarget(
            name: "screen-recorder",
            path: "Sources/screen-recorder"
        )
    ]
)

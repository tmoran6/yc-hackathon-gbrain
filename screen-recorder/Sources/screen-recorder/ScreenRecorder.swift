import Cocoa
import ScreenCaptureKit

final class ScreenRecorder {
    private(set) var isRecording = false
    private(set) var frameCount = 0
    var onStateChange: (() -> Void)?

    private var timer: Timer?
    private var sessionDir: URL?
    private var inFlight = false
    private let audioRecorder: AudioRecorder
    private var audioEnabled = false

    var isRecordingAudio: Bool { audioRecorder.isRecording }

    init() {
        let transcriber = ElevenLabsTranscriber(apiKey: Secrets.elevenLabsAPIKey)
        audioRecorder = AudioRecorder(transcriber: transcriber)
        audioRecorder.onStateChange = { [weak self] in
            self?.onStateChange?()
        }
    }

    static var baseDirectory: URL {
        let movies = FileManager.default.urls(for: .moviesDirectory, in: .userDomainMask).first
            ?? FileManager.default.homeDirectoryForCurrentUser.appendingPathComponent("Movies")
        return movies.appendingPathComponent("ScreenRecorder")
    }

    func start(withAudio: Bool) {
        guard !isRecording else { return }

        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd_HH-mm-ss"
        let timestamp = formatter.string(from: Date())

        let dir = Self.baseDirectory.appendingPathComponent("session_\(timestamp)")
        do {
            try FileManager.default.createDirectory(at: dir, withIntermediateDirectories: true)
        } catch {
            NSLog("ScreenRecorder: failed to create session directory: \(error)")
            return
        }

        sessionDir = dir
        frameCount = 0
        isRecording = true
        audioEnabled = withAudio
        onStateChange?()

        NSLog("ScreenRecorder: started -> \(dir.path) (audio: \(withAudio))")

        if withAudio {
            audioRecorder.start(in: dir)
        }

        timer = Timer.scheduledTimer(withTimeInterval: 0.5, repeats: true) { [weak self] _ in
            self?.captureFrame()
        }
        captureFrame()
    }

    func stop() {
        guard isRecording else { return }
        timer?.invalidate()
        timer = nil
        isRecording = false
        if audioEnabled {
            audioRecorder.stop()
        }
        audioEnabled = false
        if let dir = sessionDir {
            NSLog("ScreenRecorder: stopped. \(frameCount) frames in \(dir.path)")
        }
        sessionDir = nil
        onStateChange?()
    }

    private func captureFrame() {
        guard let dir = sessionDir, !inFlight else { return }
        inFlight = true
        let frameIndex = frameCount

        Task { [weak self] in
            defer { Task { @MainActor in self?.inFlight = false } }
            guard let self = self else { return }
            do {
                let content = try await SCShareableContent.excludingDesktopWindows(
                    false, onScreenWindowsOnly: true
                )
                guard let display = content.displays.first else {
                    NSLog("ScreenRecorder: no display available")
                    return
                }

                let filter = SCContentFilter(display: display, excludingWindows: [])
                let config = SCStreamConfiguration()
                config.width = display.width
                config.height = display.height
                config.showsCursor = true

                let cgImage = try await SCScreenshotManager.captureImage(
                    contentFilter: filter,
                    configuration: config
                )

                let formatter = DateFormatter()
                formatter.dateFormat = "yyyy-MM-dd_HH-mm-ss-SSS"
                let stamp = formatter.string(from: Date())
                let filename = "frame_\(String(format: "%06d", frameIndex))_\(stamp).png"
                let url = dir.appendingPathComponent(filename)

                let bitmap = NSBitmapImageRep(cgImage: cgImage)
                bitmap.size = NSSize(width: cgImage.width, height: cgImage.height)
                guard let data = bitmap.representation(using: .png, properties: [:]) else { return }
                try data.write(to: url)

                await MainActor.run {
                    self.frameCount += 1
                }
            } catch {
                NSLog("ScreenRecorder: capture error: \(error)")
            }
        }
    }
}

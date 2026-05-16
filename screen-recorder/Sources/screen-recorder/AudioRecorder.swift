import AVFoundation
import Foundation

final class AudioRecorder {
    private let chunkDuration: TimeInterval = 30.0
    private let settings: [String: Any] = [
        AVFormatIDKey: Int(kAudioFormatMPEG4AAC),
        AVSampleRateKey: 44_100.0,
        AVNumberOfChannelsKey: 1,
        AVEncoderAudioQualityKey: AVAudioQuality.high.rawValue,
    ]

    private(set) var isRecording = false
    var onStateChange: (() -> Void)?

    private let transcriber: ElevenLabsTranscriber
    private var currentRecorder: AVAudioRecorder?
    private var rotationTimer: Timer?
    private var sessionDir: URL?
    private var chunkIndex = 0
    private var pendingTranscription: Task<Void, Never>?

    init(transcriber: ElevenLabsTranscriber) {
        self.transcriber = transcriber
    }

    func start(in dir: URL) {
        guard !isRecording else { return }
        AVCaptureDevice.requestAccess(for: .audio) { [weak self] granted in
            DispatchQueue.main.async {
                guard let self = self else { return }
                guard granted else {
                    NSLog("AudioRecorder: microphone access denied")
                    return
                }
                self.sessionDir = dir
                self.chunkIndex = 0
                self.startNextChunk()
                self.rotationTimer = Timer.scheduledTimer(
                    withTimeInterval: self.chunkDuration,
                    repeats: true
                ) { [weak self] _ in
                    self?.rotateChunk()
                }
                self.isRecording = true
                self.onStateChange?()
            }
        }
    }

    func stop() {
        guard isRecording || currentRecorder != nil else { return }
        rotationTimer?.invalidate()
        rotationTimer = nil

        let finishedURL = currentRecorder?.url
        let finishedIndex = chunkIndex
        currentRecorder?.stop()
        currentRecorder = nil
        isRecording = false

        if let url = finishedURL {
            enqueueTranscription(url: url, index: finishedIndex)
        }
        sessionDir = nil
        onStateChange?()
    }

    private func startNextChunk() {
        guard let dir = sessionDir else { return }
        let url = dir.appendingPathComponent(
            "audio_chunk_\(String(format: "%04d", chunkIndex)).m4a"
        )
        do {
            let recorder = try AVAudioRecorder(url: url, settings: settings)
            recorder.record()
            currentRecorder = recorder
        } catch {
            NSLog("AudioRecorder: failed to start chunk \(chunkIndex): \(error)")
        }
    }

    private func rotateChunk() {
        guard isRecording else { return }
        let finishedURL = currentRecorder?.url
        let finishedIndex = chunkIndex
        currentRecorder?.stop()
        currentRecorder = nil

        if let url = finishedURL {
            enqueueTranscription(url: url, index: finishedIndex)
        }

        chunkIndex += 1
        startNextChunk()
    }

    private func enqueueTranscription(url: URL, index: Int) {
        let transcriber = self.transcriber
        let previous = pendingTranscription
        pendingTranscription = Task.detached {
            await previous?.value
            await Self.transcribeChunk(transcriber: transcriber, url: url, index: index)
        }
    }

    private static func transcribeChunk(
        transcriber: ElevenLabsTranscriber,
        url: URL,
        index: Int
    ) async {
        let attrs = try? FileManager.default.attributesOfItem(atPath: url.path)
        let size = (attrs?[.size] as? NSNumber)?.intValue ?? 0
        guard size > 4_096 else {
            NSLog("AudioRecorder: skipping chunk \(index), only \(size) bytes")
            return
        }

        do {
            let text = try await transcriber.transcribe(fileURL: url)
            let txtURL = url.deletingPathExtension().appendingPathExtension("txt")
            try text.write(to: txtURL, atomically: true, encoding: .utf8)
            appendToCombinedTranscript(
                dir: url.deletingLastPathComponent(),
                index: index,
                text: text
            )
            NSLog("AudioRecorder: transcribed chunk \(index) (\(text.count) chars)")
        } catch {
            NSLog("AudioRecorder: transcription failed for chunk \(index): \(error)")
        }
    }
}

private func appendToCombinedTranscript(dir: URL, index: Int, text: String) {
    let url = dir.appendingPathComponent("transcript.txt")
    let entry = "[chunk \(String(format: "%04d", index))]\n\(text)\n\n"
    guard let data = entry.data(using: .utf8) else { return }

    if FileManager.default.fileExists(atPath: url.path) {
        if let handle = try? FileHandle(forWritingTo: url) {
            defer { try? handle.close() }
            _ = try? handle.seekToEnd()
            try? handle.write(contentsOf: data)
        }
    } else {
        try? data.write(to: url)
    }
}

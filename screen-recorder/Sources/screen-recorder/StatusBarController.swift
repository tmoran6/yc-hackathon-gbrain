import Cocoa

final class StatusBarController: NSObject {
    private let statusItem: NSStatusItem
    private let recorder = ScreenRecorder()
    private var currentUser: User?

    override init() {
        statusItem = NSStatusBar.system.statusItem(withLength: NSStatusItem.variableLength)
        super.init()
        recorder.onStateChange = { [weak self] in
            DispatchQueue.main.async { self?.refresh() }
        }
        refresh()
    }

    private func refresh() {
        updateIcon()
        rebuildMenu()
    }

    private func updateIcon() {
        guard let button = statusItem.button else { return }
        if recorder.isRecording {
            button.image = Self.redDotImage()
        } else {
            let image = NSImage(systemSymbolName: "record.circle", accessibilityDescription: "Screen Recorder")
            image?.isTemplate = true
            button.image = image
        }
    }

    private static func redDotImage() -> NSImage {
        let size = NSSize(width: 18, height: 18)
        let image = NSImage(size: size, flipped: false) { rect in
            NSColor.systemRed.setFill()
            NSBezierPath(ovalIn: rect.insetBy(dx: 3, dy: 3)).fill()
            return true
        }
        image.isTemplate = false
        return image
    }

    private static func blankAvatar() -> NSImage {
        let size = NSSize(width: 18, height: 18)
        let image = NSImage(size: size, flipped: false) { rect in
            NSColor(white: 0.75, alpha: 1.0).setFill()
            NSBezierPath(ovalIn: rect).fill()
            NSColor(white: 0.5, alpha: 1.0).setStroke()
            let stroke = NSBezierPath(ovalIn: rect.insetBy(dx: 0.5, dy: 0.5))
            stroke.lineWidth = 1
            stroke.stroke()
            return true
        }
        image.isTemplate = false
        return image
    }

    private func rebuildMenu() {
        let menu = NSMenu()
        menu.autoenablesItems = false

        if let user = currentUser {
            let header = NSMenuItem(title: user.name, action: nil, keyEquivalent: "")
            header.image = Self.blankAvatar()
            header.isEnabled = false
            menu.addItem(header)
            menu.addItem(.separator())

            if recorder.isRecording {
                let item = NSMenuItem(title: "Stop Recording", action: #selector(stopRecording), keyEquivalent: "r")
                item.target = self
                menu.addItem(item)

                let frames = NSMenuItem(title: "Frames captured: \(recorder.frameCount)", action: nil, keyEquivalent: "")
                frames.isEnabled = false
                menu.addItem(frames)

                let audioStatus = NSMenuItem(
                    title: recorder.isRecordingAudio ? "Audio: recording" : "Audio: off",
                    action: nil,
                    keyEquivalent: ""
                )
                audioStatus.isEnabled = false
                menu.addItem(audioStatus)

                let discard = NSMenuItem(
                    title: "Discard Recording",
                    action: #selector(discardRecording),
                    keyEquivalent: ""
                )
                discard.target = self
                menu.addItem(discard)
            } else {
                let withAudio = NSMenuItem(
                    title: "Start Recording (with audio)",
                    action: #selector(startRecordingWithAudio),
                    keyEquivalent: "r"
                )
                withAudio.target = self
                menu.addItem(withAudio)

                let noAudio = NSMenuItem(
                    title: "Start Recording (no audio)",
                    action: #selector(startRecordingNoAudio),
                    keyEquivalent: ""
                )
                noAudio.target = self
                menu.addItem(noAudio)
            }

            menu.addItem(.separator())

            let reveal = NSMenuItem(title: "Open Recordings Folder", action: #selector(openRecordingsFolder), keyEquivalent: "")
            reveal.target = self
            menu.addItem(reveal)

            let logout = NSMenuItem(title: "Log Out", action: #selector(logOut), keyEquivalent: "")
            logout.target = self
            menu.addItem(logout)
        } else {
            let loginItem = NSMenuItem(title: "Log In", action: nil, keyEquivalent: "")
            let submenu = NSMenu()
            for user in hardcodedUsers {
                let item = NSMenuItem(title: user.name, action: #selector(selectUser(_:)), keyEquivalent: "")
                item.image = Self.blankAvatar()
                item.target = self
                item.representedObject = user.name
                submenu.addItem(item)
            }
            loginItem.submenu = submenu
            menu.addItem(loginItem)
        }

        menu.addItem(.separator())
        menu.addItem(NSMenuItem(title: "Quit", action: #selector(NSApplication.terminate(_:)), keyEquivalent: "q"))

        statusItem.menu = menu
    }

    @objc private func selectUser(_ sender: NSMenuItem) {
        guard let name = sender.representedObject as? String,
              let user = hardcodedUsers.first(where: { $0.name == name }) else { return }
        currentUser = user
        refresh()
    }

    @objc private func logOut() {
        if recorder.isRecording {
            recorder.stop()
        }
        currentUser = nil
        refresh()
    }

    @objc private func startRecordingWithAudio() {
        guard let user = currentUser else { return }
        recorder.start(withAudio: true, username: user.name)
    }

    @objc private func startRecordingNoAudio() {
        guard let user = currentUser else { return }
        recorder.start(withAudio: false, username: user.name)
    }

    @objc private func stopRecording() {
        recorder.stop()
    }

    @objc private func discardRecording() {
        let alert = NSAlert()
        alert.messageText = "Discard this recording?"
        alert.informativeText =
            "Deletes the local frames and removes the session plus any "
            + "uploaded screenshots. This can't be undone."
        alert.alertStyle = .warning
        alert.addButton(withTitle: "Discard")
        alert.addButton(withTitle: "Cancel")
        NSApp.activate(ignoringOtherApps: true)
        // First button ("Discard"); rawValue 1000 == .alertFirstButtonResponse.
        let firstButton = NSApplication.ModalResponse(rawValue: 1000)
        if alert.runModal() == firstButton {
            recorder.discard()
        }
    }

    @objc private func openRecordingsFolder() {
        let dir = ScreenRecorder.baseDirectory
        try? FileManager.default.createDirectory(at: dir, withIntermediateDirectories: true)
        NSWorkspace.shared.open(dir)
    }
}

import Foundation

struct SessionInfo {
    let id: String
    let storageURL: URL
    let storageKey: String
    let bucket: String
    let screenshotsPrefix: String
    let transcriptsPrefix: String
}

enum UploaderError: Error, CustomStringConvertible {
    case badResponse(status: Int, body: String)
    case decodeFailed(String)
    case noDashboardURL

    var description: String {
        switch self {
        case .badResponse(let status, let body):
            return "HTTP \(status): \(body)"
        case .decodeFailed(let body):
            return "could not decode response: \(body)"
        case .noDashboardURL:
            return "dashboard URL is empty"
        }
    }
}

actor SessionUploader {
    private let dashboardURL: URL
    private(set) var session: SessionInfo?

    init(dashboardURL: URL) {
        self.dashboardURL = dashboardURL
    }

    func register(username: String) async throws -> SessionInfo {
        let endpoint = dashboardURL.appendingPathComponent("api/sessions")
        var request = URLRequest(url: endpoint)
        request.httpMethod = "POST"
        request.timeoutInterval = 30
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")

        let payload = try JSONSerialization.data(withJSONObject: ["username": username])
        request.httpBody = payload

        let (data, response) = try await URLSession.shared.data(for: request)
        guard let http = response as? HTTPURLResponse,
              (200..<300).contains(http.statusCode) else {
            let status = (response as? HTTPURLResponse)?.statusCode ?? -1
            let text = String(data: data, encoding: .utf8) ?? ""
            throw UploaderError.badResponse(status: status, body: text)
        }

        guard let obj = try JSONSerialization.jsonObject(with: data) as? [String: Any],
              let id = obj["id"] as? String,
              let storage = obj["storage"] as? [String: Any],
              let urlString = storage["url"] as? String,
              let storageURL = URL(string: urlString),
              let key = storage["key"] as? String,
              let bucket = storage["bucket"] as? String,
              let screenshotsPrefix = storage["screenshots_prefix"] as? String,
              let transcriptsPrefix = storage["transcripts_prefix"] as? String
        else {
            throw UploaderError.decodeFailed(String(data: data, encoding: .utf8) ?? "")
        }

        let info = SessionInfo(
            id: id,
            storageURL: storageURL,
            storageKey: key,
            bucket: bucket,
            screenshotsPrefix: screenshotsPrefix,
            transcriptsPrefix: transcriptsPrefix
        )
        session = info
        return info
    }

    func end() async {
        guard let info = session else { return }
        let endpoint = dashboardURL
            .appendingPathComponent("api/sessions")
            .appendingPathComponent(info.id)
            .appendingPathComponent("end")
        var request = URLRequest(url: endpoint)
        request.httpMethod = "POST"
        request.timeoutInterval = 30
        do {
            _ = try await URLSession.shared.data(for: request)
        } catch {
            NSLog("SessionUploader: end() failed: \(error)")
        }
        session = nil
    }

    /// Discard the recording: delete the remote session row + its uploaded
    /// Storage objects (the dashboard handles the cascade/cleanup).
    func discard() async {
        guard let info = session else {
            session = nil
            return
        }
        let endpoint = dashboardURL
            .appendingPathComponent("api/sessions")
            .appendingPathComponent(info.id)
        var request = URLRequest(url: endpoint)
        request.httpMethod = "DELETE"
        request.timeoutInterval = 30
        do {
            _ = try await URLSession.shared.data(for: request)
            NSLog("SessionUploader: discarded session \(info.id)")
        } catch {
            NSLog("SessionUploader: discard() failed: \(error)")
        }
        session = nil
    }

    func uploadScreenshot(data: Data, filename: String) async {
        guard let info = session else { return }
        let path = info.screenshotsPrefix + filename
        await upload(
            data: data,
            session: info,
            path: path,
            contentType: "image/png",
            label: "screenshot \(filename)"
        )
    }

    func uploadTranscript(data: Data, filename: String) async {
        guard let info = session else { return }
        let path = info.transcriptsPrefix + filename
        await upload(
            data: data,
            session: info,
            path: path,
            contentType: "text/plain; charset=utf-8",
            label: "transcript \(filename)"
        )
    }

    private func upload(
        data: Data,
        session info: SessionInfo,
        path: String,
        contentType: String,
        label: String
    ) async {
        let urlString = info.storageURL.absoluteString
            + "/storage/v1/object/"
            + info.bucket
            + "/"
            + path
        guard let url = URL(string: urlString) else {
            NSLog("SessionUploader: bad upload URL \(urlString)")
            return
        }
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.timeoutInterval = 60
        request.setValue(info.storageKey, forHTTPHeaderField: "apikey")
        request.setValue("Bearer \(info.storageKey)", forHTTPHeaderField: "Authorization")
        request.setValue(contentType, forHTTPHeaderField: "Content-Type")
        request.setValue("3600", forHTTPHeaderField: "Cache-Control")
        request.setValue("true", forHTTPHeaderField: "x-upsert")
        request.httpBody = data

        do {
            let (respData, response) = try await URLSession.shared.data(for: request)
            guard let http = response as? HTTPURLResponse,
                  (200..<300).contains(http.statusCode) else {
                let status = (response as? HTTPURLResponse)?.statusCode ?? -1
                let body = String(data: respData, encoding: .utf8) ?? ""
                NSLog("SessionUploader: \(label) failed HTTP \(status): \(body)")
                return
            }
        } catch {
            NSLog("SessionUploader: \(label) error: \(error)")
        }
    }
}

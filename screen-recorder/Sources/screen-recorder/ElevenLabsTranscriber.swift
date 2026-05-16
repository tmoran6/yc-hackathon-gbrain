import Foundation

struct ElevenLabsTranscriber {
    let apiKey: String
    let modelID: String

    init(apiKey: String, modelID: String = "scribe_v1") {
        self.apiKey = apiKey
        self.modelID = modelID
    }

    enum TranscriptionError: Error, CustomStringConvertible {
        case badResponse(status: Int, body: String)
        case decodeFailed(String)

        var description: String {
            switch self {
            case .badResponse(let status, let body):
                return "HTTP \(status): \(body)"
            case .decodeFailed(let body):
                return "could not decode response: \(body)"
            }
        }
    }

    func transcribe(fileURL: URL) async throws -> String {
        let endpoint = URL(string: "https://api.elevenlabs.io/v1/speech-to-text")!
        var request = URLRequest(url: endpoint)
        request.httpMethod = "POST"
        request.timeoutInterval = 120
        request.setValue(apiKey, forHTTPHeaderField: "xi-api-key")

        let boundary = "Boundary-\(UUID().uuidString)"
        request.setValue("multipart/form-data; boundary=\(boundary)", forHTTPHeaderField: "Content-Type")

        var body = Data()
        body.appendFormField(name: "model_id", value: modelID, boundary: boundary)

        let fileData = try Data(contentsOf: fileURL)
        body.appendFileField(
            name: "file",
            filename: fileURL.lastPathComponent,
            contentType: "audio/mp4",
            data: fileData,
            boundary: boundary
        )
        body.append("--\(boundary)--\r\n".data(using: .utf8)!)
        request.httpBody = body

        let (data, response) = try await URLSession.shared.data(for: request)

        guard let http = response as? HTTPURLResponse,
              (200..<300).contains(http.statusCode) else {
            let status = (response as? HTTPURLResponse)?.statusCode ?? -1
            let text = String(data: data, encoding: .utf8) ?? ""
            throw TranscriptionError.badResponse(status: status, body: text)
        }

        struct Response: Decodable { let text: String }
        do {
            return try JSONDecoder().decode(Response.self, from: data).text
        } catch {
            throw TranscriptionError.decodeFailed(String(data: data, encoding: .utf8) ?? "")
        }
    }
}

private extension Data {
    mutating func appendFormField(name: String, value: String, boundary: String) {
        append("--\(boundary)\r\n".data(using: .utf8)!)
        append("Content-Disposition: form-data; name=\"\(name)\"\r\n\r\n".data(using: .utf8)!)
        append("\(value)\r\n".data(using: .utf8)!)
    }

    mutating func appendFileField(
        name: String,
        filename: String,
        contentType: String,
        data fileData: Data,
        boundary: String
    ) {
        append("--\(boundary)\r\n".data(using: .utf8)!)
        append("Content-Disposition: form-data; name=\"\(name)\"; filename=\"\(filename)\"\r\n".data(using: .utf8)!)
        append("Content-Type: \(contentType)\r\n\r\n".data(using: .utf8)!)
        append(fileData)
        append("\r\n".data(using: .utf8)!)
    }
}

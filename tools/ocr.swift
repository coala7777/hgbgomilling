import Foundation
import Vision
import AppKit

func recognizeText(at path: String) throws -> String {
  let url = URL(fileURLWithPath: path)
  guard let image = NSImage(contentsOf: url),
        let tiff = image.tiffRepresentation,
        let bitmap = NSBitmapImageRep(data: tiff),
        let cgImage = bitmap.cgImage else {
    throw NSError(domain: "OCR", code: 1, userInfo: [NSLocalizedDescriptionKey: "Could not read image: \(path)"])
  }

  let request = VNRecognizeTextRequest()
  request.recognitionLevel = .accurate
  request.recognitionLanguages = ["ko-KR", "en-US"]
  request.usesLanguageCorrection = true

  let handler = VNImageRequestHandler(cgImage: cgImage, options: [:])
  try handler.perform([request])

  return (request.results ?? [])
    .compactMap { $0.topCandidates(1).first?.string }
    .joined(separator: "\n")
}

let args = Array(CommandLine.arguments.dropFirst())
if args.first == "--json", args.count >= 3 {
  let outputPath = args[1]
  let paths = args.dropFirst(2)
  let rows = paths.map { path -> [String: String] in
    do {
      return ["path": path, "text": try recognizeText(at: path)]
    } catch {
      fputs("\(error.localizedDescription)\n", stderr)
      return ["path": path, "text": ""]
    }
  }
  let data = try JSONSerialization.data(withJSONObject: rows, options: [.prettyPrinted, .sortedKeys])
  try data.write(to: URL(fileURLWithPath: outputPath))
} else {
  for path in args {
    do {
      print("=== \(path) ===")
      print(try recognizeText(at: path))
    } catch {
      fputs("\(error.localizedDescription)\n", stderr)
    }
  }
}

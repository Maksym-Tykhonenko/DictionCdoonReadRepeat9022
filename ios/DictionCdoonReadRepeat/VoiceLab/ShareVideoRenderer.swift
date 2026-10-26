import AVFoundation
import UIKit

/**
 * Renders a vertical (9:16) MP4 of a Reverse Voice Game round: each audio
 * segment plays back-to-back under an animated waveform, then an outro card
 * shows the score and a call to action. Built for TikTok / Reels / Shorts.
 *
 * Options (all strings already localized by JS):
 *   segments: [{ path, label }]
 *   title, teaser, scoreLabel, score, cta, brand, footer
 */
final class ShareVideoRenderer {
  private struct Segment {
    let url: URL
    let label: String
    let envelope: [Double]
    var start: Double = 0
    var duration: Double = 0
  }

  private let width = 720
  private let height = 1280
  private let fps: Int32 = 30
  private let gap = 0.35
  private let outro = 1.8

  private var segments: [Segment] = []
  private let title: String
  private let teaser: String
  private let scoreLabel: String
  private let score: String
  private let cta: String
  private let brand: String
  private let footer: String

  private let gold = UIColor(red: 0.906, green: 0.757, blue: 0.408, alpha: 1)
  private let goldBright = UIColor(red: 0.957, green: 0.847, blue: 0.525, alpha: 1)
  private let violet = UIColor(red: 0.486, green: 0.361, blue: 1, alpha: 1)
  private let textPrimary = UIColor(red: 0.965, green: 0.953, blue: 1, alpha: 1)
  private let textMuted = UIColor(red: 0.541, green: 0.510, blue: 0.682, alpha: 1)

  init(options: NSDictionary) throws {
    title = options["title"] as? String ?? ""
    teaser = options["teaser"] as? String ?? ""
    scoreLabel = options["scoreLabel"] as? String ?? ""
    score = options["score"] as? String ?? ""
    cta = options["cta"] as? String ?? ""
    brand = options["brand"] as? String ?? ""
    footer = options["footer"] as? String ?? ""

    let raw = options["segments"] as? [NSDictionary] ?? []
    for item in raw {
      guard let path = item["path"] as? String else { continue }
      let url = URL(fileURLWithPath: path)
      let analysis = try VoiceLab.analyze(url: url, bins: 48)
      segments.append(Segment(url: url, label: item["label"] as? String ?? "", envelope: analysis.envelope))
    }
    if segments.isEmpty {
      throw NSError(domain: "VoiceLab", code: 10, userInfo: [NSLocalizedDescriptionKey: "No segments"])
    }
  }

  func render() throws -> URL {
    // 1) Audio: segments back-to-back with a short gap.
    let composition = AVMutableComposition()
    guard let audioTrack = composition.addMutableTrack(
      withMediaType: .audio,
      preferredTrackID: kCMPersistentTrackID_Invalid
    ) else {
      throw NSError(domain: "VoiceLab", code: 11, userInfo: nil)
    }
    var cursor = CMTime.zero
    for i in segments.indices {
      let asset = AVURLAsset(url: segments[i].url)
      guard let source = asset.tracks(withMediaType: .audio).first else { continue }
      let range = CMTimeRange(start: .zero, duration: asset.duration)
      try audioTrack.insertTimeRange(range, of: source, at: cursor)
      segments[i].start = cursor.seconds
      segments[i].duration = asset.duration.seconds
      cursor = cursor + asset.duration + CMTime(seconds: gap, preferredTimescale: 600)
    }
    let audioEnd = cursor.seconds
    let total = audioEnd + outro

    // 2) Video frames.
    let videoURL = VoiceLab.tempURL(prefix: "frames", ext: "mp4")
    try renderFrames(to: videoURL, duration: total)

    // 3) Mux.
    let videoAsset = AVURLAsset(url: videoURL)
    guard let videoSource = videoAsset.tracks(withMediaType: .video).first,
          let videoTrack = composition.addMutableTrack(
            withMediaType: .video,
            preferredTrackID: kCMPersistentTrackID_Invalid
          )
    else {
      throw NSError(domain: "VoiceLab", code: 12, userInfo: nil)
    }
    try videoTrack.insertTimeRange(
      CMTimeRange(start: .zero, duration: videoAsset.duration),
      of: videoSource,
      at: .zero
    )

    let outURL = VoiceLab.tempURL(prefix: "DictionCrown-Reverse", ext: "mp4")
    guard let export = AVAssetExportSession(asset: composition, presetName: AVAssetExportPresetHighestQuality) else {
      throw NSError(domain: "VoiceLab", code: 13, userInfo: nil)
    }
    export.outputURL = outURL
    export.outputFileType = .mp4
    export.shouldOptimizeForNetworkUse = true
    let done = DispatchSemaphore(value: 0)
    export.exportAsynchronously { done.signal() }
    done.wait()
    try? FileManager.default.removeItem(at: videoURL)
    if export.status != .completed {
      throw export.error ?? NSError(domain: "VoiceLab", code: 14, userInfo: nil)
    }
    return outURL
  }

  // MARK: - Frames

  private func renderFrames(to url: URL, duration: Double) throws {
    let writer = try AVAssetWriter(outputURL: url, fileType: .mp4)
    let input = AVAssetWriterInput(mediaType: .video, outputSettings: [
      AVVideoCodecKey: AVVideoCodecType.h264,
      AVVideoWidthKey: width,
      AVVideoHeightKey: height,
      AVVideoCompressionPropertiesKey: [AVVideoAverageBitRateKey: 4_000_000],
    ])
    input.expectsMediaDataInRealTime = false
    let adaptor = AVAssetWriterInputPixelBufferAdaptor(assetWriterInput: input, sourcePixelBufferAttributes: [
      kCVPixelBufferPixelFormatTypeKey as String: kCVPixelFormatType_32BGRA,
      kCVPixelBufferWidthKey as String: width,
      kCVPixelBufferHeightKey as String: height,
      kCVPixelBufferCGImageCompatibilityKey as String: true,
      kCVPixelBufferCGBitmapContextCompatibilityKey as String: true,
    ])
    writer.add(input)
    guard writer.startWriting() else {
      throw writer.error ?? NSError(domain: "VoiceLab", code: 20, userInfo: nil)
    }
    writer.startSession(atSourceTime: .zero)

    let frameCount = Int(ceil(duration * Double(fps)))
    for frame in 0..<frameCount {
      while !input.isReadyForMoreMediaData {
        usleep(2_000)
      }
      guard let pool = adaptor.pixelBufferPool else {
        throw NSError(domain: "VoiceLab", code: 21, userInfo: nil)
      }
      var pixel: CVPixelBuffer?
      CVPixelBufferPoolCreatePixelBuffer(nil, pool, &pixel)
      guard let buffer = pixel else { continue }
      draw(into: buffer, time: Double(frame) / Double(fps))
      adaptor.append(buffer, withPresentationTime: CMTime(value: CMTimeValue(frame), timescale: fps))
    }
    input.markAsFinished()
    let done = DispatchSemaphore(value: 0)
    writer.finishWriting { done.signal() }
    done.wait()
    if writer.status != .completed {
      throw writer.error ?? NSError(domain: "VoiceLab", code: 22, userInfo: nil)
    }
  }

  private func draw(into buffer: CVPixelBuffer, time: Double) {
    CVPixelBufferLockBaseAddress(buffer, [])
    defer { CVPixelBufferUnlockBaseAddress(buffer, []) }
    guard let ctx = CGContext(
      data: CVPixelBufferGetBaseAddress(buffer),
      width: width,
      height: height,
      bitsPerComponent: 8,
      bytesPerRow: CVPixelBufferGetBytesPerRow(buffer),
      space: CGColorSpaceCreateDeviceRGB(),
      bitmapInfo: CGImageAlphaInfo.premultipliedFirst.rawValue | CGBitmapInfo.byteOrder32Little.rawValue
    ) else { return }

    // Flip to UIKit's top-left origin so text draws upright.
    ctx.translateBy(x: 0, y: CGFloat(height))
    ctx.scaleBy(x: 1, y: -1)
    UIGraphicsPushContext(ctx)
    defer { UIGraphicsPopContext() }

    let w = CGFloat(width)
    let h = CGFloat(height)

    // Background gradient + soft violet glow.
    let colors = [
      UIColor(red: 0.10, green: 0.07, blue: 0.25, alpha: 1).cgColor,
      UIColor(red: 0.027, green: 0.020, blue: 0.071, alpha: 1).cgColor,
    ] as CFArray
    if let gradient = CGGradient(colorsSpace: CGColorSpaceCreateDeviceRGB(), colors: colors, locations: [0, 1]) {
      ctx.drawLinearGradient(gradient, start: .zero, end: CGPoint(x: 0, y: h), options: [])
    }
    ctx.setFillColor(violet.withAlphaComponent(0.12).cgColor)
    ctx.fillEllipse(in: CGRect(x: w / 2 - 330, y: 360, width: 660, height: 560))

    drawText(brand.uppercased(), size: 22, weight: .heavy, color: gold, y: 90, kern: 5)
    drawText(title, size: 46, weight: .bold, color: textPrimary, y: 140)

    let audioEnd = (segments.last.map { $0.start + $0.duration } ?? 0) + gap
    if time >= audioEnd {
      drawOutro(ctx: ctx, progress: min(1, (time - audioEnd) / 0.35))
      return
    }

    // Find the active segment (gaps keep the previous one fully drawn).
    var index = 0
    for (i, seg) in segments.enumerated() where time >= seg.start {
      index = i
    }
    let seg = segments[index]
    let progress = seg.duration > 0 ? min(1, max(0, (time - seg.start) / seg.duration)) : 1

    drawText("\(index + 1) / \(segments.count)", size: 24, weight: .bold, color: textMuted, y: 330)
    drawText(seg.label, size: 40, weight: .heavy, color: goldBright, y: 370)
    drawWaveform(ctx: ctx, envelope: seg.envelope, progress: progress, centerY: 640)
    drawDots(ctx: ctx, active: index, centerY: 860)

    let isLast = index == segments.count - 1
    if isLast && !score.isEmpty {
      drawText(scoreLabel, size: 28, weight: .semibold, color: textMuted, y: 930)
      drawText(score, size: 96, weight: .heavy, color: gold, y: 970)
    } else {
      drawText(teaser, size: 30, weight: .semibold, color: textPrimary.withAlphaComponent(0.85), y: 960)
    }
    drawText(footer, size: 24, weight: .semibold, color: textMuted, y: h - 110)
  }

  private func drawOutro(ctx: CGContext, progress: Double) {
    let h = CGFloat(height)
    let alpha = CGFloat(progress)
    drawText(scoreLabel, size: 32, weight: .semibold, color: textMuted.withAlphaComponent(alpha), y: 430)
    drawText(score, size: 150, weight: .heavy, color: gold.withAlphaComponent(alpha), y: 480)
    drawText(cta, size: 40, weight: .bold, color: textPrimary.withAlphaComponent(alpha), y: 720)
    drawText(footer, size: 26, weight: .semibold, color: goldBright.withAlphaComponent(alpha), y: h - 140)
  }

  private func drawWaveform(ctx: CGContext, envelope: [Double], progress: Double, centerY: CGFloat) {
    guard !envelope.isEmpty else { return }
    let totalWidth: CGFloat = 600
    let step = totalWidth / CGFloat(envelope.count)
    let barWidth = max(4, step * 0.6)
    let originX = (CGFloat(width) - totalWidth) / 2
    for (i, value) in envelope.enumerated() {
      let barHeight = 16 + CGFloat(value) * 300
      let played = Double(i) / Double(envelope.count) <= progress
      ctx.setFillColor((played ? gold : violet.withAlphaComponent(0.45)).cgColor)
      let rect = CGRect(
        x: originX + CGFloat(i) * step + (step - barWidth) / 2,
        y: centerY - barHeight / 2,
        width: barWidth,
        height: barHeight
      )
      ctx.addPath(UIBezierPath(roundedRect: rect, cornerRadius: barWidth / 2).cgPath)
      ctx.fillPath()
    }
  }

  private func drawDots(ctx: CGContext, active: Int, centerY: CGFloat) {
    let count = segments.count
    let spacing: CGFloat = 34
    let startX = CGFloat(width) / 2 - spacing * CGFloat(count - 1) / 2
    for i in 0..<count {
      let r: CGFloat = i == active ? 9 : 6
      ctx.setFillColor((i <= active ? gold : violet.withAlphaComponent(0.5)).cgColor)
      ctx.fillEllipse(in: CGRect(x: startX + CGFloat(i) * spacing - r, y: centerY - r, width: r * 2, height: r * 2))
    }
  }

  private func drawText(
    _ text: String,
    size: CGFloat,
    weight: UIFont.Weight,
    color: UIColor,
    y: CGFloat,
    kern: CGFloat = 0
  ) {
    guard !text.isEmpty else { return }
    let style = NSMutableParagraphStyle()
    style.alignment = .center
    style.lineBreakMode = .byWordWrapping
    let attrs: [NSAttributedString.Key: Any] = [
      .font: UIFont.systemFont(ofSize: size, weight: weight),
      .foregroundColor: color,
      .paragraphStyle: style,
      .kern: kern,
    ]
    let rect = CGRect(x: 48, y: y, width: CGFloat(width) - 96, height: size * 2.6)
    (text as NSString).draw(with: rect, options: [.usesLineFragmentOrigin], attributes: attrs, context: nil)
  }
}

import AVFoundation
import Foundation
import React
import Speech

/**
 * Native voice toolkit used by the JS practice flows.
 *
 * - Records the microphone to a local PCM file while (optionally) running
 *   live speech recognition on the same audio buffers.
 * - Reverses a recording sample-by-sample for the Reverse Voice Game.
 * - Transcribes a finished file (used to score the "flipped back" attempt).
 * - Plays files and renders a shareable vertical MP4 of a game round.
 *
 * Everything stays on device; temp files live in the app's tmp directory.
 */
@objc(VoiceLab)
final class VoiceLab: NSObject, AVAudioPlayerDelegate {
  @objc static func requiresMainQueueSetup() -> Bool { false }

  private let engine = AVAudioEngine()
  private let lock = NSLock()

  private var file: AVAudioFile?
  private var fileURL: URL?
  private var isRecording = false
  private var recordStart = Date()
  private var currentLevel: Float = 0

  private var recognizer: SFSpeechRecognizer?
  private var currentRequest: SFSpeechAudioBufferRecognitionRequest?
  private var recognitionTasks: [SFSpeechRecognitionTask] = []
  private var segmentTexts: [String] = []
  private var segmentDone: [Bool] = []
  private var segmentTimer: DispatchSourceTimer?
  private var generation = 0
  private var envelopeBinsPerSecond: Double = 0
  /// Server-side recognition stops after about a minute, so long takes are
  /// split into back-to-back segments whose texts are joined.
  private let segmentSeconds = 50.0

  private var player: AVAudioPlayer?
  private var playResolve: RCTPromiseResolveBlock?

  // MARK: - Permissions

  @objc(requestPermissions:rejecter:)
  func requestPermissions(
    _ resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    AVAudioSession.sharedInstance().requestRecordPermission { mic in
      SFSpeechRecognizer.requestAuthorization { status in
        resolve([
          "mic": mic ? "granted" : "denied",
          "speech": VoiceLab.describe(status),
        ])
      }
    }
  }

  @objc(isRecognitionAvailable:resolver:rejecter:)
  func isRecognitionAvailable(
    _ locale: NSString,
    resolver resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    let rec = SFSpeechRecognizer(locale: Locale(identifier: locale as String))
    resolve(rec?.isAvailable ?? false)
  }

  private static func describe(_ status: SFSpeechRecognizerAuthorizationStatus) -> String {
    switch status {
    case .authorized: return "granted"
    case .denied: return "denied"
    case .restricted: return "restricted"
    case .notDetermined: return "unknown"
    @unknown default: return "unknown"
    }
  }

  // MARK: - Recording

  @objc(startRecording:resolver:rejecter:)
  func startRecording(
    _ options: NSDictionary,
    resolver resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    if isRecording {
      teardownRecording()
    }
    stopPlaybackInternal()

    let session = AVAudioSession.sharedInstance()
    do {
      try session.setCategory(.playAndRecord, mode: .default, options: [.defaultToSpeaker, .allowBluetooth])
      try session.setActive(true, options: .notifyOthersOnDeactivation)
    } catch {
      reject("session_failed", "Could not start the audio session.", error)
      return
    }

    let input = engine.inputNode
    let format = input.outputFormat(forBus: 0)
    guard format.sampleRate > 0, format.channelCount > 0 else {
      reject("no_input", "Microphone input is unavailable.", nil)
      return
    }

    let url = VoiceLab.tempURL(prefix: "rec", ext: "caf")
    let settings: [String: Any] = [
      AVFormatIDKey: kAudioFormatLinearPCM,
      AVSampleRateKey: format.sampleRate,
      AVNumberOfChannelsKey: format.channelCount,
      AVLinearPCMBitDepthKey: 32,
      AVLinearPCMIsFloatKey: true,
      AVLinearPCMIsBigEndianKey: false,
      AVLinearPCMIsNonInterleaved: false,
    ]
    do {
      let newFile = try AVAudioFile(
        forWriting: url,
        settings: settings,
        commonFormat: .pcmFormatFloat32,
        interleaved: false
      )
      lock.lock()
      file = newFile
      fileURL = url
      segmentTexts = []
      segmentDone = []
      generation += 1
      currentLevel = 0
      lock.unlock()
    } catch {
      reject("file_failed", "Could not create the recording file.", error)
      return
    }

    // Optional live speech recognition on the same buffers.
    let wantsTranscript = (options["transcribe"] as? Bool) ?? false
    let continuous = (options["continuous"] as? Bool) ?? false
    let localeId = (options["locale"] as? String) ?? "en-US"
    envelopeBinsPerSecond = (options["envelopeBinsPerSecond"] as? Double) ?? 0
    if wantsTranscript && SFSpeechRecognizer.authorizationStatus() == .authorized,
       let rec = SFSpeechRecognizer(locale: Locale(identifier: localeId)),
       rec.isAvailable {
      recognizer = rec
      startSegment(rec)
      if continuous {
        let timer = DispatchSource.makeTimerSource(queue: DispatchQueue.global(qos: .userInitiated))
        timer.schedule(deadline: .now() + segmentSeconds, repeating: segmentSeconds)
        timer.setEventHandler { [weak self] in
          guard let self = self, let rec = self.recognizer else { return }
          self.lock.lock()
          let previous = self.currentRequest
          self.lock.unlock()
          self.startSegment(rec)
          previous?.endAudio()
        }
        segmentTimer = timer
        timer.resume()
      }
    }

    input.installTap(onBus: 0, bufferSize: 1024, format: format) { [weak self] buffer, _ in
      guard let self = self else { return }
      self.lock.lock()
      let request = self.currentRequest
      self.lock.unlock()
      request?.append(buffer)
      let rms = VoiceLab.rms(of: buffer)
      self.lock.lock()
      try? self.file?.write(from: buffer)
      self.currentLevel = rms
      self.lock.unlock()
    }

    do {
      engine.prepare()
      try engine.start()
    } catch {
      teardownRecording()
      reject("engine_failed", "Could not start the microphone.", error)
      return
    }

    recordStart = Date()
    isRecording = true
    resolve(["path": url.path])
  }

  @objc(getLiveState:rejecter:)
  func getLiveState(
    _ resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    lock.lock()
    let level = currentLevel
    let text = joinedTranscript()
    lock.unlock()
    resolve([
      "recording": isRecording,
      "elapsed": isRecording ? Date().timeIntervalSince(recordStart) : 0,
      "level": VoiceLab.normalizedLevel(level),
      "transcript": text,
    ])
  }

  @objc(stopRecording:rejecter:)
  func stopRecording(
    _ resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    guard isRecording, let url = fileURL else {
      reject("not_recording", "No recording in progress.", nil)
      return
    }
    engine.inputNode.removeTap(onBus: 0)
    engine.stop()
    isRecording = false
    lock.lock()
    file = nil // closes the file
    lock.unlock()
    segmentTimer?.cancel()
    segmentTimer = nil
    lock.lock()
    let lastRequest = currentRequest
    currentRequest = nil
    lock.unlock()
    lastRequest?.endAudio()

    DispatchQueue.global(qos: .userInitiated).async {
      // Give the recognizer a moment to deliver its final result.
      let deadline = Date().addingTimeInterval(2.5)
      while Date() < deadline {
        self.lock.lock()
        let done = self.segmentDone.allSatisfy { $0 }
        self.lock.unlock()
        if done { break }
        usleep(50_000)
      }
      self.lock.lock()
      let text = self.joinedTranscript()
      let tasks = self.recognitionTasks
      self.recognitionTasks = []
      self.lock.unlock()
      tasks.forEach { $0.cancel() }
      self.recognizer = nil

      do {
        let analysis = try VoiceLab.analyze(
          url: url,
          bins: 96,
          binsPerSecond: self.envelopeBinsPerSecond
        )
        resolve([
          "path": url.path,
          "duration": analysis.duration,
          "envelope": analysis.envelope,
          "transcript": text,
        ])
      } catch {
        reject("analyze_failed", "Could not read the recording.", error)
      }
    }
  }

  @objc(cancelRecording:rejecter:)
  func cancelRecording(
    _ resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    teardownRecording()
    resolve(nil)
  }

  private func teardownRecording() {
    if isRecording {
      engine.inputNode.removeTap(onBus: 0)
      engine.stop()
    }
    isRecording = false
    lock.lock()
    file = nil
    lock.unlock()
    segmentTimer?.cancel()
    segmentTimer = nil
    lock.lock()
    let tasks = recognitionTasks
    recognitionTasks = []
    currentRequest = nil
    lock.unlock()
    tasks.forEach { $0.cancel() }
    recognizer = nil
  }

  /// Starts a fresh recognition request; its text lands in its own slot.
  private func startSegment(_ rec: SFSpeechRecognizer) {
    let request = SFSpeechAudioBufferRecognitionRequest()
    request.shouldReportPartialResults = true
    request.taskHint = .dictation
    if #available(iOS 16.0, *) {
      request.addsPunctuation = false
    }
    lock.lock()
    let index = segmentTexts.count
    let owner = generation
    segmentTexts.append("")
    segmentDone.append(false)
    currentRequest = request
    lock.unlock()

    let task = rec.recognitionTask(with: request) { [weak self] result, error in
      guard let self = self else { return }
      self.lock.lock()
      defer { self.lock.unlock() }
      // Ignore late callbacks from an earlier recording.
      guard owner == self.generation, index < self.segmentTexts.count else { return }
      if let result = result {
        self.segmentTexts[index] = result.bestTranscription.formattedString
        if result.isFinal {
          self.segmentDone[index] = true
        }
      }
      if error != nil {
        self.segmentDone[index] = true
      }
    }
    lock.lock()
    recognitionTasks.append(task)
    lock.unlock()
  }

  /// Joined text of all segments. Call with `lock` held.
  private func joinedTranscript() -> String {
    segmentTexts.filter { !$0.isEmpty }.joined(separator: " ")
  }

  // MARK: - Reverse + transcribe

  @objc(reverse:resolver:rejecter:)
  func reverse(
    _ path: NSString,
    resolver resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    DispatchQueue.global(qos: .userInitiated).async {
      do {
        let outURL = try VoiceLab.writeReversed(source: URL(fileURLWithPath: path as String))
        let analysis = try VoiceLab.analyze(url: outURL, bins: 96)
        resolve([
          "path": outURL.path,
          "duration": analysis.duration,
          "envelope": analysis.envelope,
          "transcript": "",
        ])
      } catch {
        reject("reverse_failed", "Could not reverse the recording.", error)
      }
    }
  }

  @objc(transcribeFile:locale:resolver:rejecter:)
  func transcribeFile(
    _ path: NSString,
    locale: NSString,
    resolver resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    guard SFSpeechRecognizer.authorizationStatus() == .authorized,
          let rec = SFSpeechRecognizer(locale: Locale(identifier: locale as String)),
          rec.isAvailable
    else {
      resolve("")
      return
    }
    let request = SFSpeechURLRecognitionRequest(url: URL(fileURLWithPath: path as String))
    request.shouldReportPartialResults = false
    if #available(iOS 16.0, *) {
      request.addsPunctuation = false
    }

    var finished = false
    let finishLock = NSLock()
    func finish(_ text: String) {
      finishLock.lock()
      defer { finishLock.unlock() }
      if finished { return }
      finished = true
      resolve(text)
    }

    let task = rec.recognitionTask(with: request) { result, error in
      if let result = result, result.isFinal {
        finish(result.bestTranscription.formattedString)
      } else if error != nil {
        // "No speech detected" is reported as an error; treat as empty.
        finish("")
      }
    }
    DispatchQueue.global().asyncAfter(deadline: .now() + 10) {
      task.cancel()
      finish("")
    }
  }

  // MARK: - Playback

  @objc(play:resolver:rejecter:)
  func play(
    _ path: NSString,
    resolver resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    DispatchQueue.main.async {
      self.stopPlaybackInternal()
      do {
        let session = AVAudioSession.sharedInstance()
        try session.setCategory(.playAndRecord, mode: .default, options: [.defaultToSpeaker, .allowBluetooth])
        try session.setActive(true, options: .notifyOthersOnDeactivation)
        let p = try AVAudioPlayer(contentsOf: URL(fileURLWithPath: path as String))
        p.delegate = self
        p.prepareToPlay()
        self.player = p
        self.playResolve = resolve
        if !p.play() {
          self.player = nil
          self.playResolve = nil
          reject("play_failed", "Playback could not start.", nil)
        }
      } catch {
        reject("play_failed", "Playback could not start.", error)
      }
    }
  }

  @objc(stopPlayback:rejecter:)
  func stopPlayback(
    _ resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    DispatchQueue.main.async {
      self.stopPlaybackInternal()
      resolve(nil)
    }
  }

  private func stopPlaybackInternal() {
    player?.stop()
    player = nil
    if let pending = playResolve {
      playResolve = nil
      pending(false)
    }
  }

  func audioPlayerDidFinishPlaying(_ player: AVAudioPlayer, successfully flag: Bool) {
    DispatchQueue.main.async {
      guard player === self.player else { return }
      self.player = nil
      if let pending = self.playResolve {
        self.playResolve = nil
        pending(true)
      }
    }
  }

  // MARK: - Share video

  @objc(exportShareVideo:resolver:rejecter:)
  func exportShareVideo(
    _ options: NSDictionary,
    resolver resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    DispatchQueue.global(qos: .userInitiated).async {
      do {
        let url = try ShareVideoRenderer(options: options).render()
        resolve(url.path)
      } catch {
        reject("export_failed", "Could not create the video.", error)
      }
    }
  }

  // MARK: - Helpers

  static func tempURL(prefix: String, ext: String) -> URL {
    let name = "\(prefix)-\(UUID().uuidString.prefix(8)).\(ext)"
    return FileManager.default.temporaryDirectory.appendingPathComponent(name)
  }

  static func rms(of buffer: AVAudioPCMBuffer) -> Float {
    guard let data = buffer.floatChannelData, buffer.frameLength > 0 else { return 0 }
    let n = Int(buffer.frameLength)
    let samples = data[0]
    var sum: Float = 0
    for i in 0..<n {
      sum += samples[i] * samples[i]
    }
    return sqrt(sum / Float(n))
  }

  /// Maps RMS amplitude to a 0...1 meter value on a -50...0 dB scale.
  static func normalizedLevel(_ rms: Float) -> Double {
    guard rms > 0 else { return 0 }
    let db = 20 * log10(rms)
    return Double(min(max((db + 50) / 50, 0), 1))
  }

  struct Analysis {
    let duration: Double
    let envelope: [Double]
  }

  /// Reads a whole file and returns its duration and a normalized RMS envelope.
  static func analyze(url: URL, bins requestedBins: Int, binsPerSecond: Double = 0) throws -> Analysis {
    let f = try AVAudioFile(forReading: url)
    let frames = AVAudioFrameCount(f.length)
    let duration = Double(f.length) / f.processingFormat.sampleRate
    // Long takes can ask for a finer envelope (e.g. to find pauses).
    let bins = binsPerSecond > 0
      ? max(requestedBins, min(6000, Int(duration * binsPerSecond)))
      : requestedBins
    guard frames > 0,
          let buffer = AVAudioPCMBuffer(pcmFormat: f.processingFormat, frameCapacity: frames)
    else {
      return Analysis(duration: duration, envelope: Array(repeating: 0, count: bins))
    }
    try f.read(into: buffer)
    guard let data = buffer.floatChannelData else {
      return Analysis(duration: duration, envelope: Array(repeating: 0, count: bins))
    }
    let n = Int(buffer.frameLength)
    let samples = data[0]
    let window = max(1, n / bins)
    var env: [Double] = []
    env.reserveCapacity(bins)
    for b in 0..<bins {
      let start = b * window
      if start >= n {
        env.append(0)
        continue
      }
      let end = min(n, start + window)
      var sum: Float = 0
      for i in start..<end {
        sum += samples[i] * samples[i]
      }
      env.append(Double(sqrt(sum / Float(end - start))))
    }
    let peak = env.max() ?? 0
    if peak > 0 {
      env = env.map { $0 / peak }
    }
    return Analysis(duration: duration, envelope: env)
  }

  static func writeReversed(source: URL) throws -> URL {
    let input = try AVAudioFile(forReading: source)
    let format = input.processingFormat
    let frames = AVAudioFrameCount(input.length)
    guard frames > 0, let buffer = AVAudioPCMBuffer(pcmFormat: format, frameCapacity: frames) else {
      throw NSError(domain: "VoiceLab", code: 1, userInfo: [NSLocalizedDescriptionKey: "Empty recording"])
    }
    try input.read(into: buffer)
    let n = Int(buffer.frameLength)
    if let channels = buffer.floatChannelData {
      for c in 0..<Int(format.channelCount) {
        let p = channels[c]
        var i = 0
        var j = n - 1
        while i < j {
          let tmp = p[i]
          p[i] = p[j]
          p[j] = tmp
          i += 1
          j -= 1
        }
      }
    }
    let outURL = tempURL(prefix: "rev", ext: "caf")
    try writeBuffer(buffer, to: outURL, settings: input.fileFormat.settings, format: format)
    return outURL
  }

  /// Writes in its own scope so the file handle is closed before reading it back.
  private static func writeBuffer(
    _ buffer: AVAudioPCMBuffer,
    to url: URL,
    settings: [String: Any],
    format: AVAudioFormat
  ) throws {
    let out = try AVAudioFile(
      forWriting: url,
      settings: settings,
      commonFormat: format.commonFormat,
      interleaved: format.isInterleaved
    )
    try out.write(from: buffer)
  }
}

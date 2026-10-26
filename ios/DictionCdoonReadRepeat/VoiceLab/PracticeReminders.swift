import Foundation
import React
import UserNotifications

/**
 * Local practice reminders. JS decides the exact upcoming dates and the
 * (localized) copy, so today's reminder can be skipped once the user has
 * already practiced and the streak count stays current.
 */
@objc(PracticeReminders)
final class PracticeReminders: NSObject {
  @objc static func requiresMainQueueSetup() -> Bool { false }

  private static let prefix = "dcrr.reminder."

  @objc(requestPermission:rejecter:)
  func requestPermission(
    _ resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    UNUserNotificationCenter.current().requestAuthorization(options: [.alert, .sound, .badge]) { granted, _ in
      resolve(granted)
    }
  }

  @objc(getPermission:rejecter:)
  func getPermission(
    _ resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    UNUserNotificationCenter.current().getNotificationSettings { settings in
      switch settings.authorizationStatus {
      case .authorized, .provisional, .ephemeral:
        resolve("granted")
      case .denied:
        resolve("denied")
      default:
        resolve("unknown")
      }
    }
  }

  /// Replaces every pending reminder with `items`:
  /// [{ id, timestamp (ms since epoch), title, body }]
  @objc(schedule:resolver:rejecter:)
  func schedule(
    _ items: NSArray,
    resolver resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    let center = UNUserNotificationCenter.current()
    removeOurs(center) {
      var scheduled = 0
      let countLock = NSLock()
      let group = DispatchGroup()
      for case let item as NSDictionary in items {
        guard let id = item["id"] as? String,
              let ms = item["timestamp"] as? Double,
              let title = item["title"] as? String,
              let body = item["body"] as? String
        else { continue }
        let date = Date(timeIntervalSince1970: ms / 1000)
        guard date > Date() else { continue }

        let content = UNMutableNotificationContent()
        content.title = title
        content.body = body
        content.sound = .default
        let parts = Calendar.current.dateComponents([.year, .month, .day, .hour, .minute], from: date)
        let trigger = UNCalendarNotificationTrigger(dateMatching: parts, repeats: false)
        let request = UNNotificationRequest(
          identifier: PracticeReminders.prefix + id,
          content: content,
          trigger: trigger
        )
        group.enter()
        center.add(request) { error in
          if error == nil {
            countLock.lock()
            scheduled += 1
            countLock.unlock()
          }
          group.leave()
        }
      }
      group.notify(queue: .main) { resolve(scheduled) }
    }
  }

  @objc(cancelAll:rejecter:)
  func cancelAll(
    _ resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    removeOurs(UNUserNotificationCenter.current()) { resolve(nil) }
  }

  private func removeOurs(_ center: UNUserNotificationCenter, then done: @escaping () -> Void) {
    center.getPendingNotificationRequests { requests in
      let ids = requests.map(\.identifier).filter { $0.hasPrefix(PracticeReminders.prefix) }
      center.removePendingNotificationRequests(withIdentifiers: ids)
      done()
    }
  }
}

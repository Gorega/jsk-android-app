import Expo
import React
import ReactAppDependencyProvider
import UserNotifications
import ExpoModulesCore

@UIApplicationMain
public class AppDelegate: ExpoAppDelegate {
  var window: UIWindow?

  var reactNativeDelegate: ExpoReactNativeFactoryDelegate?
  var reactNativeFactory: RCTReactNativeFactory?

  public override func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
  ) -> Bool {
    let delegate = ReactNativeDelegate()
    let factory = ExpoReactNativeFactory(delegate: delegate)
    delegate.dependencyProvider = RCTAppDependencyProvider()

    reactNativeDelegate = delegate
    reactNativeFactory = factory
    bindReactNativeFactory(factory)

    // Register for push notifications
    UNUserNotificationCenter.current().delegate = self
    registerForPushNotifications(application)

#if os(iOS) || os(tvOS)
    window = UIWindow(frame: UIScreen.main.bounds)
    factory.startReactNative(
      withModuleName: "main",
      in: window,
      launchOptions: launchOptions)
#endif

    return super.application(application, didFinishLaunchingWithOptions: launchOptions)
  }
  
  // Register for push notifications with proper authorization
  func registerForPushNotifications(_ application: UIApplication) {
    let center = UNUserNotificationCenter.current()
    center.requestAuthorization(options: [.alert, .sound, .badge]) { granted, error in
      guard granted else { return }
      
      DispatchQueue.main.async {
        application.registerForRemoteNotifications()
      }
    }
  }

  // Linking API
  public override func application(
    _ app: UIApplication,
    open url: URL,
    options: [UIApplication.OpenURLOptionsKey: Any] = [:]
  ) -> Bool {
    return super.application(app, open: url, options: options) || RCTLinkingManager.application(app, open: url, options: options)
  }

  // Universal Links
  public override func application(
    _ application: UIApplication,
    continue userActivity: NSUserActivity,
    restorationHandler: @escaping ([UIUserActivityRestoring]?) -> Void
  ) -> Bool {
    let result = RCTLinkingManager.application(application, continue: userActivity, restorationHandler: restorationHandler)
    return super.application(application, continue: userActivity, restorationHandler: restorationHandler) || result
  }
  
  // Handle push notification registration success
  public override func application(_ application: UIApplication, didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data) {
    // Convert token to string for debugging
    let tokenParts = deviceToken.map { data in String(format: "%02.2hhx", data) }
    let token = tokenParts.joined()
    print("Device Token: \(token)")
    
    super.application(application, didRegisterForRemoteNotificationsWithDeviceToken: deviceToken)
  }
  
  // Handle push notification registration failure
  public override func application(_ application: UIApplication, didFailToRegisterForRemoteNotificationsWithError error: Error) {
    print("Failed to register for remote notifications: \(error.localizedDescription)")
    super.application(application, didFailToRegisterForRemoteNotificationsWithError: error)
  }
  
  // Handle receiving a remote notification when app is in background
  public override func application(_ application: UIApplication, didReceiveRemoteNotification userInfo: [AnyHashable : Any], fetchCompletionHandler completionHandler: @escaping (UIBackgroundFetchResult) -> Void) {
    // Process the notification data
    print("Received remote notification in background: \(userInfo)")
    
    // Create a local notification to ensure visibility
    if application.applicationState == .background || application.applicationState == .inactive {
      let notificationContent = UNMutableNotificationContent()
      
      if let aps = userInfo["aps"] as? [String: Any],
         let alert = aps["alert"] as? [String: Any] {
        notificationContent.title = alert["title"] as? String ?? "New Notification"
        notificationContent.body = alert["body"] as? String ?? "You have a new notification"
      } else {
        notificationContent.title = "New Notification"
        notificationContent.body = "You have a new notification"
      }
      
      notificationContent.sound = UNNotificationSound.default
      notificationContent.badge = 1
      notificationContent.userInfo = userInfo
      
      // Create a request and add it to notification center
      let request = UNNotificationRequest(
        identifier: UUID().uuidString,
        content: notificationContent,
        trigger: nil
      )
      
      UNUserNotificationCenter.current().add(request) { error in
        if let error = error {
          print("Error showing local notification: \(error)")
        }
      }
    }
    
    super.application(application, didReceiveRemoteNotification: userInfo, fetchCompletionHandler: completionHandler)
  }
}

// Extend AppDelegate to conform to UNUserNotificationCenterDelegate
extension AppDelegate: UNUserNotificationCenterDelegate {
  // Handle a notification that arrived while the app was in the foreground
  public func userNotificationCenter(_ center: UNUserNotificationCenter, willPresent notification: UNNotification, withCompletionHandler completionHandler: @escaping (UNNotificationPresentationOptions) -> Void) {
    let options: UNNotificationPresentationOptions
    
    if #available(iOS 14.0, *) {
      options = [.banner, .badge, .sound, .list]
    } else {
      options = [.alert, .badge, .sound]
    }
    
    completionHandler(options)
  }
  
  // Handle user tapping on a notification
  public func userNotificationCenter(_ center: UNUserNotificationCenter, didReceive response: UNNotificationResponse, withCompletionHandler completionHandler: @escaping () -> Void) {
    let userInfo = response.notification.request.content.userInfo
    // Forward to Expo's notification handler
    completionHandler()
  }
}

class ReactNativeDelegate: ExpoReactNativeFactoryDelegate {
  // Extension point for config-plugins

  override func sourceURL(for bridge: RCTBridge) -> URL? {
    // needed to return the correct URL for expo-dev-client.
    bridge.bundleURL ?? bundleURL()
  }

  override func bundleURL() -> URL? {
#if DEBUG
    return RCTBundleURLProvider.sharedSettings().jsBundleURL(forBundleRoot: ".expo/.virtual-metro-entry")
#else
    return Bundle.main.url(forResource: "main", withExtension: "jsbundle")
#endif
  }
}

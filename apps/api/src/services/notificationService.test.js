import { createNotification, listNotifications } from "./notificationService.js";

describe("Notification Service ID Collision and Server State Protection (#11733)", () => {
  it("generates unique collision-resistant IDs across rapid concurrent creations", async () => {
    const promises = Array.from({ length: 50 }, (_, i) =>
      createNotification({ message: `Notification ${i}` })
    );
    const results = await Promise.all(promises);
    const ids = results.map((n) => n.id);
    const uniqueIds = new Set(ids);

    expect(uniqueIds.size).toBe(50);
  });

  it("ignores client-provided id and read fields to enforce server-owned defaults", async () => {
    const notification = await createNotification({
      id: "malicious_override_id",
      read: true,
      userId: "user_123",
      message: "Security Alert",
    });

    expect(notification.id).not.toBe("malicious_override_id");
    expect(notification.id.startsWith("ntf_")).toBe(true);
    expect(notification.read).toBe(false);
    expect(notification.userId).toBe("user_123");
    expect(notification.message).toBe("Security Alert");
  });
});

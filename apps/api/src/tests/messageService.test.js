import test from "node:test";
import assert from "node:assert/strict";
import { listMessages, sendMessage } from "../services/messageService.js";

test("sendMessage keeps ids server-owned", async () => {
  const message = await sendMessage({
    id: "client_supplied_id",
    body: "hello",
    receiverId: "usr_id_override_receiver",
    senderId: "usr_sender"
  });

  assert.notEqual(message.id, "client_supplied_id");
  assert.match(message.id, /^msg_\d+$/);

  const stored = (await listMessages()).find((item) => item.receiverId === "usr_id_override_receiver");
  assert.equal(stored.id, message.id);
  assert.notEqual(stored.id, "client_supplied_id");
});

test("sendMessage returns a snapshot instead of the stored record", async () => {
  const message = await sendMessage({
    body: "original",
    receiverId: "usr_return_snapshot_receiver",
    senderId: "usr_sender"
  });

  message.body = "mutated";

  const stored = (await listMessages()).find((item) => item.receiverId === "usr_return_snapshot_receiver");
  assert.equal(stored.body, "original");
});

test("listMessages returns defensive snapshots", async () => {
  const message = await sendMessage({
    body: "snapshot",
    receiverId: "usr_list_snapshot_receiver",
    senderId: "usr_sender"
  });

  const listed = await listMessages();
  const originalLength = listed.length;
  const listedMessage = listed.find((item) => item.receiverId === "usr_list_snapshot_receiver");

  listedMessage.body = "mutated through listed object";
  listed.length = 0;

  const listedAgain = await listMessages();
  const stored = listedAgain.find((item) => item.receiverId === "usr_list_snapshot_receiver");

  assert.equal(listedAgain.length, originalLength);
  assert.equal(stored.body, "snapshot");
});

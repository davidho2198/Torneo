/// <reference path="../pb_data/types.d.ts" />

onRecordCreateRequest((e) => {
  const authRecord = e.auth;
  const isAdmin = authRecord && authRecord.get("role") === "admin";

  if (!isAdmin) {
    const requestedRole = e.record.get("role");
    if (requestedRole === "organizer") {
      e.record.set("role", "organizer");
      e.record.set("community_status", "pending");
      e.record.set("community_verified", false);
    } else {
      e.record.set("role", "player");
      e.record.set("community_status", "none");
      e.record.set("community_verified", false);
    }
  }
}, "users");

onRecordUpdateRequest((e) => {
  const authRecord = e.auth;
  const isAdmin = authRecord && authRecord.get("role") === "admin";

  if (!isAdmin && e.record.original()) {
    const orig = e.record.original();
    e.record.set("role", orig.get("role"));
    e.record.set("community_status", orig.get("community_status"));
    e.record.set("community_verified", orig.get("community_verified"));
  }
}, "users");

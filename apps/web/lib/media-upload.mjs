// Upload status is a UX guard; server authorization and quotas remain authoritative.
export function mediaBlocksSave(statuses) {
  return Object.values(statuses).some(
    (status) => status === "uploading" || status === "failed",
  );
}

// client/src/api/managerLiveTrackingApi.js
import apiClient from "./apiClient";

// Get live snapshot of drivers + active trips
export const getManagerLiveSnapshotApi = (params = {}) =>
  apiClient.get("/manager/live/snapshot", { params });

import { api } from "./client.js";

export const getBalance = () => api.get("/api/v1/merchants/me/balance/");

export const getTransactions = (page = 1) =>
  api.get("/api/v1/merchants/me/transactions/", { params: { page } });

export const getPayouts = () => api.get("/api/v1/payouts/");

export const createPayout = (body, idempotencyKey) =>
  api.post("/api/v1/payouts/", body, {
    headers: { "Idempotency-Key": idempotencyKey },
  });

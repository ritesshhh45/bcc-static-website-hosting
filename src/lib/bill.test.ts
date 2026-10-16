import { describe, it, expect } from "vitest";
import { calculateBill } from "./bill";

describe("calculateBill", () => {
  it("adds 5% GST", () => {
    expect(calculateBill(200).gst).toBe(10);
  });
  it("charges ₹40 delivery below ₹499", () => {
    expect(calculateBill(498).delivery_fee).toBe(40);
  });
  it("gives free delivery from ₹499", () => {
    expect(calculateBill(499).delivery_fee).toBe(0);
  });
  it("caps coupon discount at max_discount", () => {
    const c = { code: "WELCOME50", discount_percent: 50, max_discount: 100, min_order: 149 };
    expect(calculateBill(400, c).discount).toBe(100);
  });
  it("ignores coupon below min order", () => {
    const c = { code: "MEGA30", discount_percent: 30, max_discount: 150, min_order: 599 };
    expect(calculateBill(300, c).discount).toBe(0);
  });
});

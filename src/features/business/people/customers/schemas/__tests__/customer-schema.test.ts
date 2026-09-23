import { describe, expect, it } from "vitest"

import { createCustomerSchema, updateCustomerSchema } from "../customer-schema"

// Minimal t function for schema validation messages
const t = (key: string) => key

describe("createCustomerSchema", () => {
  const schema = createCustomerSchema(t)

  it("accepts valid customer data", () => {
    const result = schema.safeParse({
      firstName: "Carlos",
      lastName: "Perez",
      identificationTypeId: 1,
      identificationNumber: "1023456789",
      phoneNumber: "3000000000",
      emailAddress: "carlos@test.com",
      address: "Calle 123",
      city: "Bogota",
      department: "Cundinamarca",
    })
    expect(result.success).toBe(true)
  })

  it("rejects empty firstName", () => {
    const result = schema.safeParse({
      firstName: "",
      lastName: "Perez",
      identificationTypeId: 1,
      identificationNumber: "1023456789",
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].path).toContain("firstName")
    }
  })

  it("rejects empty lastName", () => {
    const result = schema.safeParse({
      firstName: "Carlos",
      lastName: "",
      identificationTypeId: 1,
      identificationNumber: "1023456789",
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].path).toContain("lastName")
    }
  })

  it("rejects missing identificationTypeId", () => {
    const result = schema.safeParse({
      firstName: "Carlos",
      lastName: "Perez",
      identificationNumber: "1023456789",
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].path).toContain("identificationTypeId")
    }
  })

  it("rejects empty identificationNumber", () => {
    const result = schema.safeParse({
      firstName: "Carlos",
      lastName: "Perez",
      identificationTypeId: 1,
      identificationNumber: "",
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].path).toContain("identificationNumber")
    }
  })

  it("accepts optional fields as undefined", () => {
    const result = schema.safeParse({
      firstName: "Carlos",
      lastName: "Perez",
      identificationTypeId: 1,
      identificationNumber: "1023456789",
    })
    expect(result.success).toBe(true)
  })

  it("accepts identificationTypeId of 2 (CE)", () => {
    const result = schema.safeParse({
      firstName: "Carlos",
      lastName: "Perez",
      identificationTypeId: 2,
      identificationNumber: "AB123456",
    })
    expect(result.success).toBe(true)
  })
})

describe("updateCustomerSchema", () => {
  const schema = updateCustomerSchema(t)

  it("accepts empty object (all fields optional)", () => {
    const result = schema.safeParse({})
    expect(result.success).toBe(true)
  })

  it("accepts partial update with only firstName", () => {
    const result = schema.safeParse({ firstName: "Ana" })
    expect(result.success).toBe(true)
  })

  it("accepts full update payload", () => {
    const result = schema.safeParse({
      firstName: "Carlos",
      lastName: "Perez",
      identificationTypeId: 1,
      identificationNumber: "1023456789",
      phoneNumber: "3000000000",
      emailAddress: "carlos@test.com",
      address: "Calle 123",
      city: "Bogota",
      department: "Cundinamarca",
    })
    expect(result.success).toBe(true)
  })

  it("rejects empty firstName when provided", () => {
    const result = schema.safeParse({ firstName: "" })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].path).toContain("firstName")
    }
  })
})

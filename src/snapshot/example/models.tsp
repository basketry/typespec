import "@typespec/http";

using TypeSpec.Http;

namespace ExampleService;

// String enum
enum Color {
  red: "red",
  green: "green",
  blue: "blue",
}

// Numeric enum (tests coercion)
enum Priority {
  low: 1,
  medium: 2,
  high: 3,
}

// Named union
union StringOrInt {
  string,
  int32,
}

// Base model
model BaseEntity {
  id: int64;
  createdAt: utcDateTime;
  updatedAt?: utcDateTime;
}

// Model with inheritance (extends)
model Widget extends BaseEntity {
  name: string;
  description?: string;
  active: boolean;
  color: Color;
  priority: Priority;
  score: float64;
  rating: float32;
  quantity: int32;
  tags: string[];
  // Named union reference
  label: StringOrInt;
  // Nullable property
  deletedAt: utcDateTime | null;
}

// Another model referencing Widget
model WidgetPage {
  items: Widget[];
  total: int32;
  page: int32;
  pageSize: int32;
}

// Simple model for request bodies
model CreateWidgetRequest {
  name: string;
  description?: string;
  color: Color;
  priority: Priority;
}

model UpdateWidgetRequest {
  name?: string;
  description?: string;
  color?: Color;
  priority?: Priority;
}

// Model exercising coerced scalar types
model ScalarShowcase {
  tinyInt: int8;
  smallInt: int16;
  unsignedByte: uint8;
  unsignedShort: uint16;
  unsignedInt: uint32;
  unsignedLong: uint64;
  money: decimal;
  money128: decimal128;
  timeOfDay: plainTime;
  elapsed: duration;
  website: url;
  data: bytes;
  dateField: plainDate;
}

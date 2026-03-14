import "@typespec/http";
using TypeSpec.Http;

namespace InvalidService;

// Reference a type that doesn't exist
model Broken {
  value: NonExistentType;
}

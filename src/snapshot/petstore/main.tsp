import "@typespec/http";
import "@typespec/rest";

using TypeSpec.Http;

@service(#{
  title: "Pet Store Service",
})
@useAuth(BearerAuth)
namespace PetStore;

// Enums
enum PetStatus {
  available: "available",
  pending: "pending",
  sold: "sold",
}

// Models
model Pet {
  id: int64;
  name: string;
  tag?: string;
  status: PetStatus;
}

model Owner {
  id: int64;
  name: string;
  email?: string;
}

// Pet operations
@route("/pets")
interface Pets {
  @get list(@query limit?: int32, @header("X-Request-Id") requestId?: string): Pet[];
  @post create(@body pet: Pet): Pet;
  @get read(@path petId: int64): Pet;
  @put update(@path petId: int64, @body pet: Pet): Pet;
  @delete delete(@path petId: int64): void;
}

// Owner operations
@route("/owners")
interface Owners {
  @get read(@path ownerId: int64): Owner;
}

import "@typespec/http";
import "@typespec/rest";

using TypeSpec.Http;

@service(#{
  title: "Pet Store Service",
})
@useAuth(BearerAuth)
namespace PetStore;

/** The status of a pet in the store. */
enum PetStatus {
  /** The pet is available for purchase. */
  available: "available",
  /** The pet is pending adoption. */
  pending: "pending",
  /** The pet has been sold. */
  sold: "sold",
}

/**
 * A pet in the store.
 *
 * Pets are the core resource of the Pet Store API.
 */
model Pet {
  /** The unique identifier for the pet. */
  id: int64;
  /** The name of the pet. */
  name: string;
  /** An optional tag for the pet. */
  tag?: string;
  /** The current status of the pet. */
  status: PetStatus;
}

/** A pet owner. */
model Owner {
  id: int64;
  name: string;
  email?: string;
}

/** Operations for managing pets. */
@route("/pets")
interface Pets {
  /** List all pets in the store. */
  @get list(
    /** The maximum number of pets to return. */
    @query limit?: int32,
    @header("X-Request-Id") requestId?: string,
  ): Pet[];
  /** Create a new pet. */
  @post create(@body pet: Pet): Pet;
  /** Read a pet by ID. */
  @get read(@path petId: int64): Pet;
  @put update(@path petId: int64, @body pet: Pet): Pet;
  @delete delete(@path petId: int64): void;
}

// Owner operations
@route("/owners")
interface Owners {
  @get read(@path ownerId: int64): Owner;
}

[![main](https://github.com/basketry/typespec/workflows/build/badge.svg?branch=main&event=push)](https://github.com/basketry/typespec/actions?query=workflow%3Abuild+branch%3Amain+event%3Apush)
[![master](https://img.shields.io/npm/v/@basketry/typespec)](https://www.npmjs.com/package/@basketry/typespec)

# TypeSpec

[Basketry parser](https://github.com/basketry/basketry) for [TypeSpec](https://typespec.io/) service definitions. This parser can be coupled with any Basketry generator to translate a TypeSpec project into other artifacts including servers, clients, and human-readable documentation.

## Quick Start

The following example converts a TypeSpec service definition into TypeScript types:

1. Create a `main.tsp` file in the root of your project (see [example](#example-typespec-file) below).
1. Install packages: `npm install basketry @basketry/typespec @basketry/typescript`
1. Generate code: `npx basketry --source main.tsp --parser @basketry/typespec --generators @basketry/typescript --output src`

When the last step is run, Basketry will parse the source file (`main.tsp`) using the specified parser (`@basketry/typespec`) and then run each specified generator (in this case only `@basketry/typescript`) writing to the output folder (`src`).

## Config File

You can use a config file instead of passing command line arguments. Create a `basketry.config.json` file in the root of your project:

```json
{
  "source": "main.tsp",
  "parser": "@basketry/typespec",
  "generators": ["@basketry/typescript"],
  "output": "src"
}
```

Then run: `npx basketry`

## Multi-File TypeSpec Projects

The parser fully supports multi-file TypeSpec projects. Point the `source` to your entry file (typically `main.tsp`) and the TypeSpec compiler will resolve all imports automatically:

```
my-api/
  main.tsp          <-- source entry point
  models.tsp
  operations.tsp
```

```json
{
  "source": "my-api/main.tsp",
  "parser": "@basketry/typespec",
  "generators": ["@basketry/typescript"],
  "output": "src"
}
```

Source locations in the generated IR will correctly reference the originating `.tsp` file for each type, operation, and parameter.

## TypeSpec Features Supported

| Feature                                 | Support                          |
| --------------------------------------- | -------------------------------- |
| Models and properties                   | Full                             |
| Model inheritance (`extends`)           | Full (flattened)                 |
| Enums (string and numeric)              | Full (numeric coerced to string) |
| Named unions                            | Full                             |
| Nullable types (`T \| null`)            | Full                             |
| Arrays (`T[]`)                          | Full                             |
| Scalars (all built-in types)            | Full (with validation rules)     |
| HTTP operations (`@get`, `@post`, etc.) | Full                             |
| Path, query, header parameters          | Full                             |
| Request/response bodies                 | Full                             |
| Authentication (`@useAuth`)             | Bearer, Basic, API Key, OAuth2   |
| Multi-file imports                      | Full                             |
| `@service` decorator                    | Title extraction                 |
| Compiler diagnostics                    | Forwarded as violations          |

## Type Mapping

TypeSpec scalars are mapped to Basketry IR primitives. When a TypeSpec scalar is richer than the IR primitive (e.g., `int8` mapped to `integer`), the parser attaches validation rules (like `NumberGTE`/`NumberLTE`) to preserve the constraints, and emits an informational `typespec/type-coercion` violation.

| TypeSpec Scalar | IR Primitive | Validation Rules                    |
| --------------- | ------------ | ----------------------------------- |
| `string`        | `string`     |                                     |
| `boolean`       | `boolean`    |                                     |
| `int32`         | `integer`    |                                     |
| `int64`         | `long`       |                                     |
| `float32`       | `float`      |                                     |
| `float64`       | `double`     |                                     |
| `int8`          | `integer`    | NumberGTE(-128), NumberLTE(127)     |
| `int16`         | `integer`    | NumberGTE(-32768), NumberLTE(32767) |
| `uint8`         | `integer`    | NumberGTE(0), NumberLTE(255)        |
| `uint16`        | `integer`    | NumberGTE(0), NumberLTE(65535)      |
| `uint32`        | `long`       | NumberGTE(0), NumberLTE(4294967295) |
| `uint64`        | `long`       | NumberGTE(0)                        |
| `plainDate`     | `date`       |                                     |
| `utcDateTime`   | `date-time`  |                                     |
| `plainTime`     | `string`     | StringFormat(time)                  |
| `duration`      | `string`     | StringFormat(duration)              |
| `url`           | `string`     | StringFormat(uri)                   |
| `bytes`         | `binary`     |                                     |
| `decimal`       | `number`     | StringFormat(decimal)               |

## Violations

The parser emits the following violation codes:

| Code                           | Severity | Description                                                           |
| ------------------------------ | -------- | --------------------------------------------------------------------- |
| `typespec/type-coercion`       | info     | A TypeSpec scalar was mapped to a coarser IR primitive                |
| `typespec/unsupported-feature` | warning  | A TypeSpec feature is not supported by the parser                     |
| `typespec/missing-version`     | warning  | No version information found in the source                            |
| `typespec/source-not-found`    | error    | The source file could not be found                                    |
| `typespec/numeric-enum`        | info     | Enum has numeric members that were coerced to strings                 |
| `typespec/*`                   | varies   | TypeSpec compiler diagnostics are forwarded with a `typespec/` prefix |

## Example TypeSpec File

```typespec
import "@typespec/http";

using TypeSpec.Http;

@service(#{
  title: "Pet Store Service",
})
@useAuth(BearerAuth)
namespace PetStore;

enum PetStatus {
  available: "available",
  pending: "pending",
  sold: "sold",
}

model Pet {
  id: int64;
  name: string;
  tag?: string;
  status: PetStatus;
}

@route("/pets")
interface Pets {
  @get list(@query limit?: int32): Pet[];
  @post create(@body pet: Pet): Pet;
  @get read(@path petId: int64): Pet;
  @put update(@path petId: int64, @body pet: Pet): Pet;
  @delete delete(@path petId: int64): void;
}
```

---

## For contributors:

### Run this project

1.  Install packages: `npm ci`
1.  Build the code: `npm run build`
1.  Run it! `npm start`

Note that the `lint` script is run prior to `build`. Auto-fixable linting or formatting errors may be fixed by running `npm run fix`.

### Create and run tests

1.  Add tests by creating files with the `.test.ts` suffix
1.  Run the tests: `npm t`
1.  Test coverage can be viewed at `/coverage/lcov-report/index.html`

Note: Tests require `NODE_OPTIONS="--experimental-vm-modules"` which is configured in `jest.config.json`.

### Publish a new package version

1. Create new version
   1. Navigate to the [version workflow](https://github.com/basketry/typespec/actions/workflows/version.yml) from the Actions tab.
   1. Manually dispatch the action with the appropriate inputs
   1. This will create a PR with the new version
1. Publish to NPM
   1. Review and merge the PR
   1. The [publish workflow](https://github.com/basketry/typespec/actions/workflows/publish.yml) will create a git tag and publish the package on NPM

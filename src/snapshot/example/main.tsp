import "@typespec/http";
import "@typespec/rest";
import "./models.tsp";
import "./operations.tsp";

using TypeSpec.Http;

@service(#{
  title: "Example Service",
})
@useAuth(BearerAuth)
namespace ExampleService;

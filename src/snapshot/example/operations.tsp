import "@typespec/http";
import "@typespec/rest";

using TypeSpec.Http;
using TypeSpec.Rest;

namespace ExampleService;

// Widgets interface - CRUD operations with all HTTP verbs
@route("/widgets")
interface Widgets {
  @get list(
    @query page?: int32,
    @query pageSize?: int32,
    @query color?: string,
    @header("X-Request-Id") requestId?: string,
  ): WidgetPage;

  @post create(@body body: CreateWidgetRequest): Widget;

  @get read(@path widgetId: int64): Widget;

  @put update(@path widgetId: int64, @body body: UpdateWidgetRequest): Widget;

  @patch partialUpdate(@path widgetId: int64, @body body: UpdateWidgetRequest): Widget;

  @delete delete(@path widgetId: int64): void;
}

// Admin interface - OAuth2 auth override
@route("/admin/widgets")
@useAuth(OAuth2Auth<[{
  type: OAuth2FlowType.clientCredentials,
  tokenUrl: "https://example.com/token",
  scopes: ["admin:write"],
}]>)
interface AdminWidgets {
  @get list(@query active?: boolean): WidgetPage;
  @delete purge(): void;
}

// Scalars interface - exercises coerced scalar type mappings
@route("/scalars")
interface Scalars {
  @get showcase(): ScalarShowcase;
}

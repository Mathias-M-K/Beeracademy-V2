package dk.mathiaskofod.providers.openapi;

import dk.mathiaskofod.websocket.game.models.WebsocketCodes;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;
import org.eclipse.microprofile.openapi.OASFilter;
import org.eclipse.microprofile.openapi.models.OpenAPI;
import org.eclipse.microprofile.openapi.models.media.Schema;

/**
 * SmallRye represents the {@link WebsocketCodes} enum by its constant <em>names</em>, dropping the numeric close
 * codes the frontend actually needs to match a WebSocket {@code CloseEvent.code}.
 *
 * <p>This filter rewrites that schema into an integer enum whose members keep their (PascalCase) names via the
 * {@code x-enum-varnames} extension, which the typescript-angular generator honours. The result on the frontend is
 * {@code WebsocketCodes = { SessionNotFound: 4000, ... }}. The Java enum stays the single source of truth.
 */
public class WebsocketCodeSchemaFilter implements OASFilter {

    private static final String SCHEMA_NAME = "WebsocketCodes";

    @Override
    public void filterOpenAPI(OpenAPI openAPI) {
        if (openAPI.getComponents() == null || openAPI.getComponents().getSchemas() == null) {
            return;
        }

        Schema schema = openAPI.getComponents().getSchemas().get(SCHEMA_NAME);
        if (schema == null) {
            return;
        }

        List<Object> codes = Arrays.stream(WebsocketCodes.values())
                .map(code -> (Object) code.getCode())
                .toList();
        List<String> varNames = Arrays.stream(WebsocketCodes.values())
                .map(code -> toPascalCase(code.name()))
                .toList();

        schema.setType(List.of(Schema.SchemaType.INTEGER));
        schema.setFormat("int32");
        schema.setEnumeration(codes);
        schema.addExtension("x-enum-varnames", varNames);
    }

    private static String toPascalCase(String enumName) {
        return Arrays.stream(enumName.split("_"))
                .map(word -> word.charAt(0) + word.substring(1).toLowerCase())
                .collect(Collectors.joining());
    }
}
